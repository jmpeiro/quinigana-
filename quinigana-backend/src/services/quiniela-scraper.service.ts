import https from 'https';
import http from 'http';
import { MatchData } from './football-data.service';
import { env } from '../config/environment';
import { normalizeTeamName } from '../utils/team-name.util';

export interface QuinielaLiveMatch {
  match_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  sign: string | null;
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

// Pool of realistic User-Agent strings from different browsers and platforms
const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  // Firefox on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  // Safari on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// Common Accept-Language headers for Spanish users
const ACCEPT_LANGUAGES = [
  'es-ES,es;q=0.9,en;q=0.8',
  'es-ES,es;q=0.9',
  'es,en;q=0.9,es-ES;q=0.8',
  'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
];

export class QuinielaScraper {
  // resultados-futbol.com/quiniela now 301s to besoccer.es, which serves the
  // site-wide match feed rather than the coupon, so the 15 quiniela fixtures
  // (Primera + Segunda mixed) are read from eduardolosilla.es instead.
  private static readonly URL = 'https://www.eduardolosilla.es/quiniela';

  // Scoreboard feed the coupon site itself consumes (urlJornadaEnVivo).
  private static readonly LIVE_URL = 'https://static.dataradar.es/marcador/json/partidos.json';

  private static liveCache: {
    data: Map<string, { home_score: number; away_score: number; status: string }>;
    timestamp: number;
  } | null = null;

  // Track last used User-Agent index to rotate
  private static lastUaIndex = 0;

  private static getRandomUserAgent(): string {
    // Rotate through User-Agents instead of pure random to ensure variety
    this.lastUaIndex = (this.lastUaIndex + 1) % USER_AGENTS.length;
    return USER_AGENTS[this.lastUaIndex];
  }

  private static getRandomAcceptLanguage(): string {
    return ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)];
  }

  private static getRandomDelay(): number {
    const { minDelayMs, maxDelayMs } = env.scraper;
    return Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
  }

  private static getBrowserHeaders(): Record<string, string> {
    const userAgent = this.getRandomUserAgent();
    const isFirefox = userAgent.includes('Firefox');
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');

    const headers: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': this.getRandomAcceptLanguage(),
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    };

    // Add browser-specific headers
    if (isFirefox) {
      headers['Sec-Fetch-Dest'] = 'document';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'none';
      headers['Sec-Fetch-User'] = '?1';
    } else if (!isSafari) {
      // Chrome/Edge headers
      headers['Sec-Ch-Ua'] = '"Not_A Brand";v="8", "Chromium";v="120"';
      headers['Sec-Ch-Ua-Mobile'] = '?0';
      headers['Sec-Ch-Ua-Platform'] = '"Windows"';
      headers['Sec-Fetch-Dest'] = 'document';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'none';
      headers['Sec-Fetch-User'] = '?1';
    }

    return headers;
  }

  static async getQuinielaMatches(): Promise<MatchData[]> {
    const html = await this.fetchPage(this.URL);
    return this.parseMatches(html);
  }

  private static standingsCache: {
    data: Map<string, LeagueStanding[]>;
    timestamp: number;
  } | null = null;

  static async getStandings(division: 'primera' | 'segunda'): Promise<LeagueStanding[]> {
    const cacheTtl = 60 * 60 * 1000; // 1 hour cache for standings

    // Return cached data if still fresh
    if (this.standingsCache && (Date.now() - this.standingsCache.timestamp) < cacheTtl) {
      return this.standingsCache.data.get(division) || [];
    }

    // Fetch both divisions and cache
    const results = new Map<string, LeagueStanding[]>();

    try {
      const primeraHtml = await this.fetchPage('https://www.resultados-futbol.com/primera');
      results.set('primera', this.parseStandingsPage(primeraHtml));
    } catch {
      results.set('primera', []);
    }

    await new Promise(resolve => setTimeout(resolve, this.getRandomDelay()));

    try {
      const segundaHtml = await this.fetchPage('https://www.resultados-futbol.com/segunda');
      results.set('segunda', this.parseStandingsPage(segundaHtml));
    } catch {
      results.set('segunda', []);
    }

    this.standingsCache = { data: results, timestamp: Date.now() };
    return results.get(division) || [];
  }

  private static parseStandingsPage(html: string): LeagueStanding[] {
    const standings: LeagueStanding[] = [];

    // Find the main standings table
    const tableMatch = html.match(/<table[^>]*class="[^"]*tabla-datos[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return standings;

    const tableContent = tableMatch[1];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let row;
    let position = 0;

    while ((row = rowRegex.exec(tableContent)) !== null) {
      const rowHtml = row[1];

      // Skip header rows
      if (rowHtml.includes('<th')) continue;

      const cells = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!cells || cells.length < 9) continue;

      position++;

      const extractText = (cell: string) => cell.replace(/<[^>]+>/g, '').trim();

      // Typical columns: Pos, Team, PT, PJ, PG, PE, PP, GF, GC (or similar)
      const team = extractText(cells[1]);
      const points = parseInt(extractText(cells[2]), 10) || 0;
      const played = parseInt(extractText(cells[3]), 10) || 0;
      const won = parseInt(extractText(cells[4]), 10) || 0;
      const drawn = parseInt(extractText(cells[5]), 10) || 0;
      const lost = parseInt(extractText(cells[6]), 10) || 0;
      const goalsFor = parseInt(extractText(cells[7]), 10) || 0;
      const goalsAgainst = parseInt(extractText(cells[8]), 10) || 0;

      if (team) {
        standings.push({
          position,
          team,
          played,
          won,
          drawn,
          lost,
          goalsFor,
          goalsAgainst,
          points,
        });
      }
    }

    return standings;
  }

  static async getLiveResults(): Promise<Map<string, { home_score: number; away_score: number; status: string }>> {
    const cacheTtl = env.scraper.cacheTtlMs;

    // Return cached data if still fresh
    if (this.liveCache && (Date.now() - this.liveCache.timestamp) < cacheTtl) {
      return this.liveCache.data;
    }

    const results = new Map<string, { home_score: number; away_score: number; status: string }>();

    // Scoreboard feed behind the coupon site: plain JSON, no key, and it covers
    // the whole coupon, Segunda included. Both football APIs gate the current
    // season behind paid plans, and every HTML source renders its scoreboard
    // client-side, so this is the only free feed with Segunda scores.
    try {
      const payload = await this.fetchJson(this.LIVE_URL);

      for (const match of Array.isArray(payload) ? payload : []) {
        // The feed sends 0-0 for fixtures that have not kicked off yet, so the
        // score alone cannot tell them apart from a real goalless draw: use the
        // textual state and skip anything still pending.
        const estado: string = match?.estado ?? '';
        const started = estado !== '' && !/sin\s*(comenzar|empezar)/i.test(estado);
        if (!started) continue;

        const home = match?.local_goles;
        const away = match?.visitante_goles;
        if (home === null || home === undefined || away === null || away === undefined) {
          continue;
        }

        const homeName: string = match?.local ?? '';
        if (!homeName) continue;

        const value = {
          home_score: Number(home),
          away_score: Number(away),
          status: /finalizado/i.test(estado) ? 'FINISHED' : 'IN_PLAY',
        };

        results.set(normalizeTeamName(homeName), value);
        results.set(homeName.toLowerCase().trim(), value);
      }
    } catch {
      // Feed unreachable: callers fall back to whatever the admin entered.
    }

    this.liveCache = { data: results, timestamp: Date.now() };
    return results;
  }

  private static fetchJson(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = { 'User-Agent': this.getRandomUserAgent(), 'Accept': 'application/json' };
      const req = https.get(url, { headers }, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          res.resume();
          reject(new Error(`football-data responded ${res.statusCode}`));
          return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        });
      });
      req.setTimeout(15000, () => { req.destroy(new Error('football-data timeout')); });
      req.on('error', reject);
    });
  }

  private static parseResultsPage(html: string, results: Map<string, { home_score: number; away_score: number; status: string }>): void {
    const trRegex = /<tr[^>]*class="[^"]*vevent[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    let tr;
    while ((tr = trRegex.exec(html)) !== null) {
      const row = tr[1];

      const t1Match = row.match(/<td[^>]*class="equipo1"[^>]*>([\s\S]*?)<\/td>/);
      const t2Match = row.match(/<td[^>]*class="equipo2"[^>]*>([\s\S]*?)<\/td>/);
      const rstdMatch = row.match(/<td[^>]*class="rstd"[^>]*>([\s\S]*?)<\/td>/);
      const fechaMatch = row.match(/<td[^>]*class="fecha"[^>]*>([\s\S]*?)<\/td>/);

      if (!t1Match || !t2Match) continue;

      const team1 = t1Match[1].replace(/<[^>]+>/g, '').trim();
      const team2 = t2Match[1].replace(/<[^>]+>/g, '').trim();
      if (!team1 || !team2) continue;

      let status = 'SCHEDULED';
      if (fechaMatch) {
        const fechaText = fechaMatch[1].replace(/<[^>]+>/g, '').trim();
        if (fechaText.includes('Finalizado')) status = 'FINISHED';
        else if (fechaText.includes('En juego') || fechaText.includes('Descanso')) status = 'IN_PLAY';
      }

      if (status === 'SCHEDULED') continue; // No score yet

      if (rstdMatch) {
        const allScores = rstdMatch[1].match(/\b(\d{1,2})-(\d{1,2})\b/g);
        if (allScores) {
          const lastScore = allScores[allScores.length - 1];
          const parts = lastScore.split('-');
          const normalizedKey = normalizeTeamName(team1);
          const resultValue = {
            home_score: parseInt(parts[0], 10),
            away_score: parseInt(parts[1], 10),
            status,
          };
          // Store by normalized key and raw lower key to maximize compatibility with existing lookups
          results.set(normalizedKey, resultValue);
          results.set(team1.toLowerCase().trim(), resultValue);
        }
      }
    }
  }

  private static parseMatches(html: string): MatchData[] {
    const year = new Date().getFullYear();

    // Each coupon row carries the fixture in a title attribute next to the
    // qtitulo marker, e.g. qtitulo="" title="ALAVES - GETAFE".
    const rowRegex = /qtitulo=""\s+title="([^"]+?)\s+-\s+([^"]+?)"/gi;
    const allMatches: { home: string; away: string }[] = [];

    let m;
    while ((m = rowRegex.exec(html)) !== null) {
      const home = this.cleanTeamName(m[1]);
      const away = this.cleanTeamName(m[2]);
      if (home && away) {
        allMatches.push({ home, away });
      }
    }

    const matches: MatchData[] = [];
    const count = Math.min(allMatches.length, 15);
    for (let i = 0; i < count; i++) {
      matches.push({
        match_number: i + 1,
        home_team: allMatches[i].home,
        away_team: allMatches[i].away,
        match_date: new Date(year, 0, 1).toISOString(),
      });
    }

    return matches;
  }

  private static cleanTeamName(raw: string): string {
    return raw
      .replace(/&aacute;/gi, 'a').replace(/&eacute;/gi, 'e')
      .replace(/&iacute;/gi, 'i').replace(/&oacute;/gi, 'o')
      .replace(/&uacute;/gi, 'u').replace(/&ntilde;/gi, 'n')
      .replace(/&[a-z]+;/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static async fetchPage(url: string): Promise<string> {
    const maxRetries = env.scraper.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.doFetch(url);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('429') && attempt < maxRetries) {
          // Rate limited - wait with exponential backoff
          const backoffMs = 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
  }

  private static doFetch(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const proxyUrl = env.scraper.proxyUrl;
      const timeout = env.scraper.timeoutMs;

      const headers = this.getBrowserHeaders();

      // Determine if using proxy
      if (proxyUrl) {
        this.fetchWithProxy(url, proxyUrl, headers, timeout, resolve, reject);
      } else {
        this.fetchDirect(parsedUrl, headers, timeout, resolve, reject);
      }
    });
  }

  private static fetchDirect(
    parsedUrl: URL,
    headers: Record<string, string>,
    timeout: number,
    resolve: (value: string) => void,
    reject: (reason: Error) => void
  ): void {
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers,
    };

    const req = https.request(options, (res) => {
      this.handleResponse(res, parsedUrl.hostname, resolve, reject);
    });

    req.on('error', (err) => {
      reject(new Error(`Failed to fetch page: ${err.message}`));
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout fetching page'));
    });

    req.end();
  }

  private static fetchWithProxy(
    targetUrl: string,
    proxyUrl: string,
    headers: Record<string, string>,
    timeout: number,
    resolve: (value: string) => void,
    reject: (reason: Error) => void
  ): void {
    const proxy = new URL(proxyUrl);
    const target = new URL(targetUrl);

    const proxyOptions = {
      hostname: proxy.hostname,
      port: parseInt(proxy.port || '8080', 10),
      method: 'CONNECT',
      path: `${target.hostname}:443`,
      headers: {} as Record<string, string>,
    };

    // Add proxy authentication if provided
    if (proxy.username && proxy.password) {
      const auth = Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64');
      proxyOptions.headers['Proxy-Authorization'] = `Basic ${auth}`;
    }

    const proxyReq = http.request(proxyOptions);

    proxyReq.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Proxy connection failed: ${res.statusCode}`));
        return;
      }

      const tlsOptions = {
        host: target.hostname,
        socket: socket,
        servername: target.hostname,
      };

      const tls = require('tls');
      const tlsSocket = tls.connect(tlsOptions, () => {
        const requestOptions = {
          hostname: target.hostname,
          path: target.pathname + target.search,
          method: 'GET',
          headers,
          createConnection: () => tlsSocket,
        };

        const req = https.request(requestOptions, (response) => {
          this.handleResponse(response, target.hostname, resolve, reject);
        });

        req.on('error', (err: Error) => {
          reject(new Error(`Failed to fetch via proxy: ${err.message}`));
        });

        req.setTimeout(timeout, () => {
          req.destroy();
          reject(new Error('Request timeout via proxy'));
        });

        req.end();
      });

      tlsSocket.on('error', (err: Error) => {
        reject(new Error(`TLS connection failed: ${err.message}`));
      });
    });

    proxyReq.on('error', (err) => {
      reject(new Error(`Proxy request failed: ${err.message}`));
    });

    proxyReq.setTimeout(timeout, () => {
      proxyReq.destroy();
      reject(new Error('Proxy connection timeout'));
    });

    proxyReq.end();
  }

  private static handleResponse(
    res: http.IncomingMessage,
    hostname: string,
    resolve: (value: string) => void,
    reject: (reason: Error) => void
  ): void {
    let body = '';

    // Handle redirects
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      const redirectUrl = res.headers.location.startsWith('http')
        ? res.headers.location
        : `https://${hostname}${res.headers.location}`;
      this.doFetch(redirectUrl).then(resolve).catch(reject);
      return;
    }

    // Handle compressed responses
    const encoding = res.headers['content-encoding'];
    let stream: NodeJS.ReadableStream = res;

    if (encoding === 'gzip') {
      const zlib = require('zlib');
      stream = res.pipe(zlib.createGunzip());
    } else if (encoding === 'deflate') {
      const zlib = require('zlib');
      stream = res.pipe(zlib.createInflate());
    } else if (encoding === 'br') {
      const zlib = require('zlib');
      stream = res.pipe(zlib.createBrotliDecompress());
    }

    stream.on('data', (chunk: Buffer | string) => {
      body += chunk.toString();
    });

    stream.on('end', () => {
      if (res.statusCode === 200) {
        resolve(body);
      } else {
        reject(new Error(`Failed to fetch page: HTTP ${res.statusCode}`));
      }
    });

    stream.on('error', (err: Error) => {
      reject(new Error(`Stream error: ${err.message}`));
    });
  }
}
