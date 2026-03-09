import { FootballDataService, MatchResultData } from './football-data.service';
import { QuinielaScraper } from './quiniela-scraper.service';
import pool from '../config/database';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScraperSource = 'resultados-futbol' | 'football-data-api' | 'manual';

export interface MatchScore {
  matchId: number;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'in_progress' | 'finished';
  minute?: number;
}

export interface ScraperResult {
  source: ScraperSource;
  matches: Map<string, { home_score: number; away_score: number; status: string }>;
  fetchedAt: string;
  reliable: boolean;
}

export interface ScoreDiscrepancy {
  team: string;
  primarySource: ScraperSource;
  fallbackSource: ScraperSource;
  primary: { home_score: number; away_score: number };
  fallback: { home_score: number; away_score: number };
}

export interface ScraperHealthStatus {
  footballDataApi: { available: boolean; lastCheck: string | null; error?: string };
  resultadosFutbol: { available: boolean; lastCheck: string | null; error?: string };
}

// ---------------------------------------------------------------------------
// Socket.io reference (set at startup)
// ---------------------------------------------------------------------------
let socketIoInstance: any = null;

export function setSocketInstance(io: any): void {
  socketIoInstance = io;
}

// ---------------------------------------------------------------------------
// Scraper Fallback Service – Chain-of-Responsibility
// ---------------------------------------------------------------------------

export class ScraperFallbackService {
  // Retry configuration: 3 attempts with exponential backoff (1s, 2s, 4s)
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY_MS = 1000;

  // Health tracking
  private static healthCache: ScraperHealthStatus = {
    footballDataApi: { available: true, lastCheck: null },
    resultadosFutbol: { available: true, lastCheck: null },
  };

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Fetch live scores using chain-of-responsibility:
   *   1. Primary: football-data.org API
   *   2. Fallback: resultados-futbol.com HTML scraper
   *
   * When both sources succeed, scores are cross-validated and discrepancies
   * are logged. Results from the primary source take precedence.
   */
  static async getLiveScores(
    jornadaId: number,
    competition: string = 'PD',
    matchday?: number,
  ): Promise<ScraperResult> {
    let primaryResult: ScraperResult | null = null;
    let fallbackResult: ScraperResult | null = null;
    let primaryError: string | null = null;
    let fallbackError: string | null = null;

    // --- 1. Try primary source: football-data.org API ---
    try {
      primaryResult = await this.withRetry(
        () => this.fetchFromFootballDataApi(competition, matchday),
        'football-data-api',
      );
      await this.logScraperAttempt(jornadaId, 'football-data-api', true, null, primaryResult.matches.size);
      this.healthCache.footballDataApi = { available: true, lastCheck: new Date().toISOString() };
    } catch (err) {
      primaryError = err instanceof Error ? err.message : String(err);
      await this.logScraperAttempt(jornadaId, 'football-data-api', false, primaryError, 0);
      this.healthCache.footballDataApi = { available: false, lastCheck: new Date().toISOString(), error: primaryError };
      logger.warn({ jornadaId, error: primaryError }, 'Primary scraper (football-data-api) failed, trying fallback');
    }

    // --- 2. Try fallback source: resultados-futbol.com scraper ---
    try {
      fallbackResult = await this.withRetry(
        () => this.fetchFromResultadosFutbol(),
        'resultados-futbol',
      );
      await this.logScraperAttempt(jornadaId, 'resultados-futbol', true, null, fallbackResult.matches.size);
      this.healthCache.resultadosFutbol = { available: true, lastCheck: new Date().toISOString() };
    } catch (err) {
      fallbackError = err instanceof Error ? err.message : String(err);
      await this.logScraperAttempt(jornadaId, 'resultados-futbol', false, fallbackError, 0);
      this.healthCache.resultadosFutbol = { available: false, lastCheck: new Date().toISOString(), error: fallbackError };
      logger.warn({ jornadaId, error: fallbackError }, 'Fallback scraper (resultados-futbol) failed');
    }

    // --- 3. Cross-validate when both sources available ---
    if (primaryResult && fallbackResult) {
      const discrepancies = this.validateScores(primaryResult, fallbackResult);
      if (discrepancies.length > 0) {
        logger.warn(
          { jornadaId, discrepancies },
          `Score discrepancies detected between sources (${discrepancies.length} mismatches)`,
        );
      }
    }

    // --- 4. Return best available result ---
    if (primaryResult) {
      return primaryResult;
    }

    if (fallbackResult) {
      return fallbackResult;
    }

    // --- 5. Both failed → emit Socket.io error to admins + critical log ---
    const errorMsg = `All scraper sources failed for jornada ${jornadaId}. ` +
      `Primary: ${primaryError}. Fallback: ${fallbackError}`;

    logger.fatal({ jornadaId, primaryError, fallbackError }, errorMsg);

    this.emitScraperError(jornadaId, errorMsg);

    throw new Error(errorMsg);
  }

  /**
   * Health check: verify availability of each scraper source.
   */
  static getHealthStatus(): ScraperHealthStatus {
    return { ...this.healthCache };
  }

  /**
   * Actively probe both scraper sources and return fresh health status.
   */
  static async checkHealth(): Promise<ScraperHealthStatus> {
    // Probe football-data.org
    try {
      await FootballDataService.getCompetitions();
      this.healthCache.footballDataApi = { available: true, lastCheck: new Date().toISOString() };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.healthCache.footballDataApi = { available: false, lastCheck: new Date().toISOString(), error: msg };
    }

    // Probe resultados-futbol.com (lightweight: just check if it responds)
    try {
      await QuinielaScraper.getQuinielaMatches();
      this.healthCache.resultadosFutbol = { available: true, lastCheck: new Date().toISOString() };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.healthCache.resultadosFutbol = { available: false, lastCheck: new Date().toISOString(), error: msg };
    }

    return { ...this.healthCache };
  }

  // -----------------------------------------------------------------------
  // Source adapters
  // -----------------------------------------------------------------------

  private static async fetchFromFootballDataApi(
    competition: string,
    matchday?: number,
  ): Promise<ScraperResult> {
    const day = matchday ?? await FootballDataService.getCurrentMatchday(competition);
    const results: MatchResultData[] = await FootballDataService.getResults(competition, day);

    const matches = new Map<string, { home_score: number; away_score: number; status: string }>();

    for (const r of results) {
      if (r.home_score !== null && r.away_score !== null) {
        const key = r.home_team.toLowerCase().trim();
        matches.set(key, {
          home_score: r.home_score,
          away_score: r.away_score,
          status: this.mapFootballDataStatus(r.status),
        });
      }
    }

    return {
      source: 'football-data-api',
      matches,
      fetchedAt: new Date().toISOString(),
      reliable: true,
    };
  }

  private static async fetchFromResultadosFutbol(): Promise<ScraperResult> {
    const matches = await QuinielaScraper.getLiveResults();

    return {
      source: 'resultados-futbol',
      matches,
      fetchedAt: new Date().toISOString(),
      reliable: matches.size > 0,
    };
  }

  // -----------------------------------------------------------------------
  // Retry with exponential backoff
  // -----------------------------------------------------------------------

  private static async withRetry<T>(
    fn: () => Promise<T>,
    sourceName: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.debug(
          { source: sourceName, attempt, maxRetries: this.MAX_RETRIES, error: lastError.message },
          `Scraper attempt ${attempt}/${this.MAX_RETRIES} failed`,
        );

        if (attempt < this.MAX_RETRIES) {
          const delayMs = this.BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
          await this.sleep(delayMs);
        }
      }
    }

    throw lastError!;
  }

  // -----------------------------------------------------------------------
  // Score validation
  // -----------------------------------------------------------------------

  /**
   * Compare scores from both sources. Returns discrepancies where both have
   * data for the same team but the scores don't match.
   */
  private static validateScores(
    primary: ScraperResult,
    fallback: ScraperResult,
  ): ScoreDiscrepancy[] {
    const discrepancies: ScoreDiscrepancy[] = [];

    for (const [teamKey, primaryData] of primary.matches) {
      // Try exact match first
      let fallbackData = fallback.matches.get(teamKey);

      // Fuzzy match: check if keys start with one another
      if (!fallbackData) {
        for (const [fbKey, fbVal] of fallback.matches) {
          if (fbKey.startsWith(teamKey) || teamKey.startsWith(fbKey)) {
            fallbackData = fbVal;
            break;
          }
        }
      }

      if (!fallbackData) continue;

      // Only compare finished or in-progress matches
      if (primaryData.status === 'SCHEDULED' || fallbackData.status === 'SCHEDULED') continue;

      // Both have scores — compare
      if (
        primaryData.home_score !== fallbackData.home_score ||
        primaryData.away_score !== fallbackData.away_score
      ) {
        discrepancies.push({
          team: teamKey,
          primarySource: primary.source,
          fallbackSource: fallback.source,
          primary: { home_score: primaryData.home_score, away_score: primaryData.away_score },
          fallback: { home_score: fallbackData.home_score, away_score: fallbackData.away_score },
        });
      }
    }

    return discrepancies;
  }

  // -----------------------------------------------------------------------
  // Scraper log persistence
  // -----------------------------------------------------------------------

  private static async logScraperAttempt(
    jornadaId: number,
    source: ScraperSource,
    success: boolean,
    errorMessage: string | null,
    matchesUpdated: number,
  ): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO scraper_logs (jornada_id, source, success, error_message, matches_updated)
         VALUES (?, ?, ?, ?, ?)`,
        [jornadaId, source, success, errorMessage, matchesUpdated],
      );
    } catch (err) {
      // Don't let logging failures break the scraping flow
      logger.error({ err, jornadaId, source }, 'Failed to write scraper log');
    }
  }

  // -----------------------------------------------------------------------
  // Socket.io admin notification
  // -----------------------------------------------------------------------

  private static emitScraperError(jornadaId: number, message: string): void {
    if (!socketIoInstance) {
      logger.warn('Socket.io instance not set — cannot emit scraper:error');
      return;
    }

    try {
      // Emit to admin room (admins join 'admin' room on connect)
      socketIoInstance.to('admin').emit('scraper:error', {
        jornadaId,
        message,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'Failed to emit scraper:error via Socket.io');
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private static mapFootballDataStatus(apiStatus: string): string {
    switch (apiStatus) {
      case 'FINISHED':
        return 'FINISHED';
      case 'IN_PLAY':
      case 'PAUSED':
      case 'LIVE':
        return 'IN_PLAY';
      case 'TIMED':
      case 'SCHEDULED':
      default:
        return 'SCHEDULED';
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
