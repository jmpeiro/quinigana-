import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Parse pagination params from query string with safe defaults and limits.
 * @param query - Express req.query object
 * @returns Validated pagination params
 */
export function parsePagination(query: Record<string, any>): PaginationParams {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const rawLimit = parseInt(query.limit as string, 10) || 20;
  const limit = Math.min(Math.max(1, rawLimit), 100); // maxLimit = 100
  return { page, limit };
}

/**
 * Execute a paginated SQL query and return a PaginatedResponse.
 * @param sql - The data query (should NOT include LIMIT/OFFSET — they are appended)
 * @param countSql - The count query (SELECT COUNT(*) as total …)
 * @param params - Shared params for both queries (before pagination params)
 * @param pagination - page & limit
 * @returns PaginatedResponse<T>
 */
export async function paginatedQuery<T>(
  sql: string,
  countSql: string,
  params: any[],
  pagination: PaginationParams
): Promise<PaginatedResponse<T>> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  // Run count and data queries in parallel
  const [countResult, dataResult] = await Promise.all([
    pool.execute<RowDataPacket[]>(countSql, params),
    pool.execute<RowDataPacket[]>(`${sql} LIMIT ? OFFSET ?`, [...params, limit, offset]),
  ]);

  const total = (countResult[0][0] as RowDataPacket).total as number;
  const data = dataResult[0] as T[];

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
