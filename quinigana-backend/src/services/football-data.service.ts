import https from 'https';
import { env } from '../config/environment';

interface FootballDataMatch {
  homeTeam: { shortName: string; name: string };
  awayTeam: { shortName: string; name: string };
  utcDate: string;
  matchday: number;
  status: string;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

interface FootballDataResponse {
  matches: FootballDataMatch[];
  competition: { name: string; code: string };
  resultSet?: { count: number };
}

interface CompetitionResponse {
  currentSeason: {
    currentMatchday: number;
    startDate: string;
    endDate: string;
  };
}

interface StandingsTableEntry {
  position: number;
  team: { name: string; shortName: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface StandingsResponse {
  standings: Array<{
    type: string;
    table: StandingsTableEntry[];
  }>;
}

export interface LeagueStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface MatchData {
  match_number: number;
  home_team: string;
  away_team: string;
  match_date: string;
}

export interface MatchResultData {
  match_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  sign: string | null; // '1', 'X', '2'
}

export class FootballDataService {
  private static readonly BASE_URL = 'api.football-data.org';

  private static get API_KEY(): string {
    return env.footballData.apiKey;
  }

  static async getMatches(competition: string, matchday: number): Promise<MatchData[]> {
    if (!this.API_KEY) {
      throw new Error('FOOTBALL_DATA_API_KEY is not configured');
    }

    const path = `/v4/competitions/${competition}/matches?matchday=${matchday}`;

    const data = await this.httpGet(path);

    if (!data.matches || data.matches.length === 0) {
      throw new Error(`No matches found for ${competition} matchday ${matchday}`);
    }

    return data.matches.map((match: FootballDataMatch, index: number) => ({
      match_number: index + 1,
      home_team: match.homeTeam.shortName || match.homeTeam.name,
      away_team: match.awayTeam.shortName || match.awayTeam.name,
      match_date: match.utcDate,
    }));
  }

  static async getResults(competition: string, matchday: number): Promise<MatchResultData[]> {
    if (!this.API_KEY) {
      throw new Error('FOOTBALL_DATA_API_KEY is not configured');
    }

    const path = `/v4/competitions/${competition}/matches?matchday=${matchday}`;
    const data = await this.httpGet(path);

    if (!data.matches || data.matches.length === 0) {
      throw new Error(`No matches found for ${competition} matchday ${matchday}`);
    }

    return data.matches.map((match: FootballDataMatch, index: number) => {
      const homeScore = match.score.fullTime.home;
      const awayScore = match.score.fullTime.away;
      let sign: string | null = null;

      if (homeScore !== null && awayScore !== null) {
        if (homeScore > awayScore) sign = '1';
        else if (homeScore === awayScore) sign = 'X';
        else sign = '2';
      }

      return {
        match_number: index + 1,
        home_team: match.homeTeam.shortName || match.homeTeam.name,
        away_team: match.awayTeam.shortName || match.awayTeam.name,
        home_score: homeScore,
        away_score: awayScore,
        status: match.status,
        sign,
      };
    });
  }

  static async getCurrentMatchday(competition: string): Promise<number> {
    if (!this.API_KEY) {
      throw new Error('FOOTBALL_DATA_API_KEY is not configured');
    }

    const path = `/v4/competitions/${competition}`;
    const data = await this.httpGet(path) as unknown as CompetitionResponse;

    if (!data.currentSeason?.currentMatchday) {
      throw new Error(`Could not determine current matchday for ${competition}`);
    }

    return data.currentSeason.currentMatchday;
  }

  static async getCompetitions(): Promise<{ code: string; name: string }[]> {
    // Return the free-tier competitions available
    return [
      { code: 'PD', name: 'La Liga' },
      { code: 'PL', name: 'Premier League' },
      { code: 'BL1', name: 'Bundesliga' },
      { code: 'SA', name: 'Serie A' },
      { code: 'FL1', name: 'Ligue 1' },
      { code: 'CL', name: 'Champions League' },
      { code: 'EC', name: 'European Championship' },
    ];
  }

  private static standingsCache: Map<string, { data: LeagueStanding[]; timestamp: number }> = new Map();

  static async getStandings(competition: string): Promise<LeagueStanding[]> {
    if (!this.API_KEY) {
      throw new Error('FOOTBALL_DATA_API_KEY is not configured');
    }

    // Check cache (1 hour TTL)
    const cached = this.standingsCache.get(competition);
    if (cached && (Date.now() - cached.timestamp) < 60 * 60 * 1000) {
      return cached.data;
    }

    const path = `/v4/competitions/${competition}/standings`;
    const data = await this.httpGet(path) as unknown as StandingsResponse;

    if (!data.standings || data.standings.length === 0) {
      throw new Error(`No standings found for ${competition}`);
    }

    // Get the TOTAL standings (not home/away)
    const totalStandings = data.standings.find(s => s.type === 'TOTAL');
    if (!totalStandings) {
      throw new Error(`No total standings found for ${competition}`);
    }

    const standings: LeagueStanding[] = totalStandings.table.map(entry => ({
      position: entry.position,
      team: entry.team.shortName || entry.team.name,
      played: entry.playedGames,
      won: entry.won,
      drawn: entry.draw,
      lost: entry.lost,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst,
      points: entry.points,
    }));

    // Cache the result
    this.standingsCache.set(competition, { data: standings, timestamp: Date.now() });

    return standings;
  }

  private static httpGet(path: string): Promise<FootballDataResponse> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.BASE_URL,
        path,
        method: 'GET',
        headers: {
          'X-Auth-Token': this.API_KEY,
        },
      };

      const req = https.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error('Failed to parse API response'));
            }
          } else if (res.statusCode === 429) {
            reject(new Error('API rate limit exceeded. Try again in a minute.'));
          } else {
            reject(new Error(`Football-data.org API error: ${res.statusCode} - ${body}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Failed to connect to football-data.org: ${err.message}`));
      });

      req.end();
    });
  }
}
