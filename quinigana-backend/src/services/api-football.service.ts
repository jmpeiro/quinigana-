import https from 'https';
import { env } from '../config/environment';
import { LeagueStanding } from './football-data.service';

interface ApiFootballTeamStanding {
  rank: number;
  team: { name: string };
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  points: number;
}

interface ApiFootballResponse {
  response?: Array<{
    league?: {
      standings?: ApiFootballTeamStanding[][];
    };
  }>;
}

interface ApiFootballLeagueSeasonsResponse {
  response?: Array<{
    seasons?: Array<{
      year: number;
      current?: boolean;
    }>;
  }>;
}

export class ApiFootballService {
  private static resolveLeagueId(division: 'primera' | 'segunda'): number {
    return division === 'primera' ? 140 : 141;
  }

  private static currentSeasonYear(): number {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    return month >= 7 ? year : year - 1;
  }

  private static resolveBaseUrl(): URL {
    const raw = (env.apiFootball.baseHost || '').trim();
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol);
  }

  private static async getCurrentSeasonFromApi(league: number): Promise<number | null> {
    try {
      const data = await this.httpGet<ApiFootballLeagueSeasonsResponse>(`/leagues?id=${league}&current=true`);
      const seasons = data.response?.[0]?.seasons || [];
      const current = seasons.find((s) => s.current) || seasons[0];
      return typeof current?.year === 'number' ? current.year : null;
    } catch {
      return null;
    }
  }

  static async getStandings(division: 'primera' | 'segunda'): Promise<LeagueStanding[]> {
    if (!env.apiFootball.apiKey) {
      throw new Error('API_FOOTBALL_KEY is not configured');
    }

    const league = this.resolveLeagueId(division);
    const apiSeason = await this.getCurrentSeasonFromApi(league);
    const inferredSeason = this.currentSeasonYear();
    const seasonCandidates = [...new Set([
      apiSeason,
      inferredSeason,
      inferredSeason - 1,
      inferredSeason + 1,
    ].filter((v): v is number => typeof v === 'number'))];

    for (const season of seasonCandidates) {
      const path = `/standings?league=${league}&season=${season}`;
      const data = await this.httpGet<ApiFootballResponse>(path);
      const rawStandings = data.response?.[0]?.league?.standings?.[0] || [];

      if (!rawStandings.length) {
        continue;
      }

      return rawStandings.map((row) => ({
        position: row.rank,
        team: row.team?.name || 'Unknown',
        played: row.all?.played || 0,
        won: row.all?.win || 0,
        drawn: row.all?.draw || 0,
        lost: row.all?.lose || 0,
        goalsFor: row.all?.goals?.for || 0,
        goalsAgainst: row.all?.goals?.against || 0,
        points: row.points || 0,
      }));
    }

    return [];
  }

  private static httpGet<T = ApiFootballResponse>(path: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {};
      const baseUrl = this.resolveBaseUrl();
      const basePath = baseUrl.pathname === '/' ? '' : baseUrl.pathname.replace(/\/$/, '');
      const requestPath = `${basePath}${path}`;

      if (env.apiFootball.useRapidApi) {
        headers['x-rapidapi-key'] = env.apiFootball.apiKey;
        headers['x-rapidapi-host'] = env.apiFootball.rapidApiHost;
      } else {
        headers['x-apisports-key'] = env.apiFootball.apiKey;
      }

      const req = https.request({
        hostname: baseUrl.hostname,
        port: baseUrl.port ? Number(baseUrl.port) : undefined,
        path: requestPath,
        method: 'GET',
        headers,
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`API-Football error: ${res.statusCode} - ${body}`));
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch {
            reject(new Error('Failed to parse API-Football response'));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Failed to connect to API-Football: ${err.message}`));
      });

      req.end();
    });
  }
}
