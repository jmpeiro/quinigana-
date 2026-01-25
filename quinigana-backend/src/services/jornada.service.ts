import { JornadaModel } from '../models/jornada.model';
import { MatchModel } from '../models/match.model';
import { UserModel } from '../models/user.model';
import { ProposalModel } from '../models/proposal.model';
import { NotificationService } from './notification.service';
import { QuinielaScraper } from './quiniela-scraper.service';
import { CreateJornadaDto, SubmitResultsDto } from '../types';

export class JornadaService {
  static async createJornada(data: CreateJornadaDto) {
    const jornadaId = await JornadaModel.create(data.name, data.season, data.jornada_number, data.deadline);
    await MatchModel.createMany(jornadaId, data.matches);

    // Notify all active users about new jornada
    UserModel.getAllActiveUserIds().then(userIds => {
      NotificationService.notifyNewJornada(data.name, userIds).catch(() => {});
    });

    return JornadaModel.findByIdWithMatches(jornadaId);
  }

  static async getAll() {
    return JornadaModel.findAll();
  }

  static async getAllForUser(userId: number) {
    return JornadaModel.findForUser(userId);
  }

  static async getById(id: number) {
    return JornadaModel.findByIdWithMatches(id);
  }

  static async getActive() {
    return JornadaModel.findActive();
  }

  static async updateStatus(id: number, status: 'open' | 'closed' | 'finished') {
    const jornada = await JornadaModel.findById(id);
    if (!jornada) {
      throw new Error('Jornada not found');
    }
    await JornadaModel.updateStatus(id, status);
    return JornadaModel.findById(id);
  }

  static async getLiveScores(jornadaId: number) {
    const jornada = await JornadaModel.findByIdWithMatches(jornadaId);
    if (!jornada) {
      throw new Error('Jornada not found');
    }

    // Scrape live results from resultados-futbol.com (Primera + Segunda)
    let liveResults: Map<string, { home_score: number; away_score: number; status: string }> | null = null;
    try {
      liveResults = await QuinielaScraper.getLiveResults();
    } catch {
      // Scraping failed - fall back to local DB results only
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

    // Notify all active users about results published
    UserModel.getAllActiveUserIds().then(userIds => {
      NotificationService.notifyResultsPublished(jornada.name, userIds).catch(() => {});
    });

    return JornadaModel.findByIdWithMatches(jornadaId);
  }
}
