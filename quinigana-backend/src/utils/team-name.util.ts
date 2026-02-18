export function normalizeTeamName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findLiveResultByHomeTeam(
  liveResults: Map<string, { home_score: number; away_score: number; status: string }>,
  homeTeam: string
): { home_score: number; away_score: number; status: string } | undefined {
  const normalizedHome = normalizeTeamName(homeTeam);
  if (!normalizedHome) return undefined;

  // 1) Direct key lookup (when map key was stored in normalized format)
  const direct = liveResults.get(normalizedHome);
  if (direct) return direct;

  // 2) Prefix/contains matching for abbreviations (e.g. "atletico de ma")
  let best: { score: number; value: { home_score: number; away_score: number; status: string } } | null = null;
  const homeTokens = normalizedHome.split(' ').filter(Boolean);

  for (const [rawKey, value] of liveResults) {
    const normalizedKey = normalizeTeamName(rawKey);
    if (!normalizedKey) continue;

    if (
      normalizedKey === normalizedHome ||
      normalizedKey.startsWith(normalizedHome) ||
      normalizedHome.startsWith(normalizedKey)
    ) {
      return value;
    }

    // Token overlap score fallback
    const keyTokens = new Set(normalizedKey.split(' ').filter(Boolean));
    let overlap = 0;
    for (const t of homeTokens) {
      if (keyTokens.has(t)) overlap++;
    }

    if (overlap > 0 && (!best || overlap > best.score)) {
      best = { score: overlap, value };
    }
  }

  // Require at least 2 shared tokens when possible, otherwise accept 1 for short names.
  if (best && (best.score >= 2 || homeTokens.length <= 2)) {
    return best.value;
  }

  return undefined;
}
