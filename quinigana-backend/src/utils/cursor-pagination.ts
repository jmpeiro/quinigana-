import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

// ───── Shared types (aligned with contracts) ─────

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  direction: 'next' | 'prev';
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  total: number;
}

// ───── Cursor encoding / decoding ─────

interface CursorPayload {
  id: number;
  ts: number; // unix ms
}

/**
 * Encode an (id, timestamp) pair into a URL-safe base64 cursor.
 */
export function encodeCursor(id: number, timestamp: Date | string | number): string {
  const ts = typeof timestamp === 'number'
    ? timestamp
    : new Date(timestamp).getTime();
  const payload: CursorPayload = { id, ts };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Decode a base64url cursor back to its payload. Returns `null` on invalid input.
 */
export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const payload = JSON.parse(json) as CursorPayload;
    if (typeof payload.id !== 'number' || typeof payload.ts !== 'number') return null;
    return payload;
  } catch {
    return null;
  }
}

// ───── Query builder ─────

export interface CursorQueryOptions {
  /** Base table alias used in ORDER BY / WHERE, e.g. 'j' for jornadas */
  alias: string;
  /** Column used for the timestamp component of the cursor (default: `${alias}.created_at`) */
  timestampColumn?: string;
  /** Column used for the id component (default: `${alias}.id`) */
  idColumn?: string;
  /** Sort direction for the timestamp column (default: 'DESC') */
  sortDirection?: 'ASC' | 'DESC';
}

export interface CursorQueryResult {
  /** WHERE clause fragment (empty string when no cursor) */
  whereClause: string;
  /** ORDER BY clause */
  orderByClause: string;
  /** LIMIT clause */
  limitClause: string;
  /** Parameter values to append to the query params array */
  params: any[];
}

/**
 * Build MySQL WHERE / ORDER BY / LIMIT clauses for cursor-based pagination.
 *
 * The cursor encodes (id, timestamp). Depending on sort direction and navigation
 * direction we generate the correct comparison operator.
 */
export function buildCursorQuery(
  pagination: CursorPaginationParams,
  options: CursorQueryOptions
): CursorQueryResult {
  const {
    alias,
    timestampColumn = `${alias}.created_at`,
    idColumn = `${alias}.id`,
    sortDirection = 'DESC',
  } = options;

  const { cursor, limit, direction } = pagination;
  const params: any[] = [];
  let whereClause = '';

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      const ts = new Date(decoded.ts).toISOString().slice(0, 19).replace('T', ' ');

      // When going "next" in DESC order we want rows *before* the cursor (< ts)
      // When going "prev" in DESC order we want rows *after* the cursor (> ts)
      const isForward = direction === 'next';
      const descForward = sortDirection === 'DESC' ? isForward : !isForward;
      const op = descForward ? '<' : '>';

      whereClause = `(${timestampColumn} ${op} ? OR (${timestampColumn} = ? AND ${idColumn} ${op} ?))`;
      params.push(ts, ts, decoded.id);
    }
  }

  // ORDER BY: when navigating "prev" we reverse the sort so we can pick the
  // right page, then we re-reverse the results in code.
  const effectiveSort = direction === 'prev'
    ? (sortDirection === 'DESC' ? 'ASC' : 'DESC')
    : sortDirection;

  const orderByClause = `${timestampColumn} ${effectiveSort}, ${idColumn} ${effectiveSort}`;
  const limitClause = `LIMIT ?`;
  params.push(limit + 1); // fetch one extra to detect hasMore

  return { whereClause, orderByClause, limitClause, params };
}

// ───── Helper to parse cursor params from Express query ─────

export function parseCursorPagination(query: Record<string, any>): CursorPaginationParams {
  const rawLimit = parseInt(query.limit as string, 10) || 20;
  const limit = Math.min(Math.max(1, rawLimit), 100);
  const direction = query.direction === 'prev' ? 'prev' : 'next';
  const cursor = typeof query.cursor === 'string' && query.cursor.length > 0
    ? query.cursor
    : undefined;
  return { cursor, limit, direction };
}

// ───── Generic paginated cursor query executor ─────

/**
 * Execute a cursor-paginated SQL query.
 *
 * @param baseSql      SELECT ... FROM ... WHERE <your filters>
 *                     (must NOT include ORDER BY / LIMIT)
 * @param countSql     SELECT COUNT(*) as total FROM ... WHERE <your filters>
 * @param baseParams   Parameters for the base & count queries
 * @param pagination   Parsed cursor pagination params
 * @param options      Cursor column configuration
 * @param timestampField  Name of the timestamp field on the result rows (default 'created_at')
 * @param idField         Name of the id field on the result rows (default 'id')
 */
export async function cursorPaginatedQuery<T extends Record<string, any>>(
  baseSql: string,
  countSql: string,
  baseParams: any[],
  pagination: CursorPaginationParams,
  options: CursorQueryOptions,
  timestampField: string = 'created_at',
  idField: string = 'id'
): Promise<CursorPaginatedResponse<T>> {
  const { whereClause, orderByClause, limitClause, params: cursorParams } =
    buildCursorQuery(pagination, options);

  // Build the full data query
  const cursorWhere = whereClause
    ? (baseSql.toUpperCase().includes('WHERE') ? ` AND ${whereClause}` : ` WHERE ${whereClause}`)
    : '';
  const dataSql = `${baseSql}${cursorWhere} ORDER BY ${orderByClause} ${limitClause}`;
  const dataParams = [...baseParams, ...cursorParams];

  // Run count and data in parallel
  const [countResult, dataResult] = await Promise.all([
    pool.execute<RowDataPacket[]>(countSql, baseParams),
    pool.execute<RowDataPacket[]>(dataSql, dataParams),
  ]);

  const total = Number((countResult[0][0] as RowDataPacket).total);
  let rows = dataResult[0] as T[];

  const hasMore = rows.length > pagination.limit;
  if (hasMore) rows = rows.slice(0, pagination.limit);

  // Reverse when navigating backwards
  if (pagination.direction === 'prev') rows.reverse();

  // Build cursors
  let nextCursor: string | null = null;
  let prevCursor: string | null = null;

  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const firstRow = rows[0];

    if (hasMore || pagination.direction === 'prev') {
      nextCursor = encodeCursor(lastRow[idField], lastRow[timestampField]);
    }
    if (pagination.cursor) {
      prevCursor = encodeCursor(firstRow[idField], firstRow[timestampField]);
    }
  }

  return { data: rows, nextCursor, prevCursor, total };
}
