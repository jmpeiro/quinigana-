/**
 * Cache configuration.
 * TTL values are in seconds.
 */
export const cacheConfig = {
  /** Default TTL in seconds (5 minutes) */
  defaultTTL: 300,

  /** Check period for expired keys in seconds (60 seconds) */
  checkPeriod: 60,

  /** Max number of keys (-1 = unlimited) */
  maxKeys: -1,

  /** Use clones for stored values (safer but slower) */
  useClones: true,
};

/**
 * Cache keys used throughout the application.
 */
export enum CacheKey {
  STANDINGS = 'standings',
  RANKINGS = 'rankings',
  DASHBOARD = 'dashboard',
  JORNADA_LIST = 'jornada_list',
  LEAGUE_STANDINGS = 'league_standings',
}
