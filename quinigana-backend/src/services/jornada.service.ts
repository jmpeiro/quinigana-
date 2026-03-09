import { JornadaModel } from '../models/jornada.model';
import { MatchModel } from '../models/match.model';
import { UserModel } from '../models/user.model';
import { ProposalModel } from '../models/proposal.model';
import { NotificationService } from './notification.service';
import { ScraperFallbackService } from './scraper-fallback.service';
import { CacheService } from './cache.service';
import { CacheKey } from '../config/cache';
import { CreateJornadaDto, SubmitResultsDto } from '../types';
import logger from '../config/logger';

export class JornadaService {
  static async createJornada(data: CreateJornadaDto) {
    const jornadaId = await JornadaModel.create(data.name, data.season, data.jornada_number, data.deadline);
    await MatchModel.createMany(jornadaId, data.matches);

    // Invalidate jornada list cache
    CacheService.invalidateByPrefix(CacheKey.JORNADA_LIST);

    // Notify all active users about new jornada
    UserModel.getAllActiveUserIds().then(userIds => {
      NotificationService.notifyNewJornada(data.name, userIds).catch(() => {});
    });

    return JornadaModel.findByIdWithMatches(jornadaId);
  }

  static async getAll() {
    return JornadaModel.findAll();
  }

  static async getAllForUser(userId: number, page: number = 1, limit: number = 20) {
    const cacheKey = CacheService.buildKey(CacheKey.JORNADA_LIST, userId, page, limit);
    const cached = CacheService.get<any>(cacheKey);
    if (cached) return cached;

    const { items, total } = await JornadaModel.findForUser(userId, page, limit);
    const result = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    CacheService.set(cacheKey, result);
    return result;
  }

  static async getById(id: number) {
    return JornadaModel.findByIdWithMatches(id);
  }

  static async getActive() {
    const cacheKey = CacheService.buildKey(CacheKey.JORNADA_LIST, 'active');
    const cached = CacheService.get<any>(cacheKey);
    if (cached) return cached;

    const result = await JornadaModel.findActive();
    // Cache active jornada for 2 minutes (shorter TTL since it changes)
    CacheService.set(cacheKey, result, 120);
    return result;
  }

  static async updateStatus(id: number, status: 'open' | 'closed' | 'finished') {
    const jornada = await JornadaModel.findById(id);
    if (!jornada) {
      throw new Error('Jornada not found');
    }
    await JornadaModel.updateStatus(id, status);

    // Invalidate caches when jornada status changes (especially on close/finish)
    CacheService.invalidateScoresAndStandings();

    return JornadaModel.findById(id);
  }

  static async getLiveScores(jornadaId: number) {
    const jornada = await JornadaModel.findByIdWithMatches(jornadaId);
    if (!jornada) {
      throw new Error('Jornada not found');
    }

    // Use the scraper fallback service (primary: football-data API, fallback: resultados-futbol)
    let liveResults: Map<string, { home_score: number; away_score: number; status: string }> | null = null;
    try {
      const scraperResult = await ScraperFallbackService.getLiveScores(jornadaId);
      liveResults = scraperResult.matches;
      logger.debug({ jornadaId, source: scraperResult.source, matchCount: liveResults.size }, 'Live scores fetched');
    } catch (err) {
      logger.warn({ jornadaId, err }, 'All scraper sources failed — falling back to local DB results');
    }

    return jornada.matches.map(m => {
      let homeScore: number | null = m.result?.home_score ?? null;
      let awayScore: number | null = m.result?.away_score ?? null;
      let sign: string | null = null;
      let status = 'SCHEDULED';

      // Try live data from scraper (keyed by home team name lowercase)
      if (liveResults) {
        const dbName = m.home_team.toLowerCase().replace(/\./g, '').trim();
        let live = liveResults.get(dbName);
        // Fuzzy match: DB name may be abbreviated (e.g. "Atlético de Ma" vs "Atlético de Madrid")
        if (!live) {
          for (const [key, val] of liveResults) {
            if (key.startsWith(dbName) || dbName.startsWith(key.replace(/\./g, ''))) {
              live = val;
              break;
            }
          }
        }
        if (live) {
          homeScore = live.home_score;
          awayScore = live.away_score;
          status = live.status;
          if (homeScore > awayScore) sign = '1';
          else if (homeScore === awayScore) sign = 'X';
          else sign = '2';
          return { match_number: m.match_number, home_team: m.home_team, away_team: m.away_team, home_score: homeScore, away_score: awayScore, status, sign };
        }
      }

      // Fallback: local DB results
      if (homeScore !== null && awayScore !== null) {
        status = 'FINISHED';
        if (homeScore > awayScore) sign = '1';
        else if (homeScore === awayScore) sign = 'X';
        else sign = '2';
      }

      return { match_number: m.match_number, home_team: m.home_team, away_team: m.away_team, home_score: homeScore, away_score: awayScore, status, sign };
    });
  }

  static async getUserPredictions(jornadaId: number, userId: number) {
    const jornada = await JornadaModel.findById(jornadaId);
    if (!jornada) {
      throw new Error('Jornada not found');
    }
    return ProposalModel.getUserPredictionsForJornada(userId, jornadaId);
  }

  static async submitResults(jornadaId: number, data: SubmitResultsDto) {
    const jornada = await JornadaModel.findById(jornadaId);
    if (!jornada) {
      throw new Error('Jornada not found');
    }

    const matches = await MatchModel.findByJornada(jornadaId);
    const matchIds = matches.map(m => m.id);

    for (const result of data.results) {
      if (!matchIds.includes(result.match_id)) {
        throw new Error(`Match ${result.match_id} does not belong to this jornada`);
      }
      await MatchModel.addResult(result.match_id, result.home_score, result.away_score);
    }

    // Invalidate caches after results are submitted
    CacheService.invalidateScoresAndStandings();

    // Notify all active users about results published
    UserModel.getAllActiveUserIds().then(userIds => {
      NotificationService.notifyResultsPublished(jornada.name, userIds).catch(() => {});
    });

    return JornadaModel.findByIdWithMatches(jornadaId);
  }
}
