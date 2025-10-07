// =============================================================================
// Alasela Operations - Database Connection Utility
// =============================================================================
// GZANSP Compliant: No 'any' types, placeholder-only config
// Database: PostgreSQL 14+
// =============================================================================

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// =============================================================================
// CONFIGURATION (Placeholder-only, resolved from environment)
// =============================================================================

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

function getDatabaseConfig(): DatabaseConfig {
  const {
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_MAX_CONNECTIONS,
    DB_IDLE_TIMEOUT,
    DB_CONNECT_TIMEOUT,
  } = process.env;

  if (!DB_HOST) throw new Error('DB_HOST environment variable is required');
  if (!DB_PORT) throw new Error('DB_PORT environment variable is required');
  if (!DB_NAME) throw new Error('DB_NAME environment variable is required');
  if (!DB_USER) throw new Error('DB_USER environment variable is required');
  if (!DB_PASSWORD) throw new Error('DB_PASSWORD environment variable is required');

  return {
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    max: DB_MAX_CONNECTIONS ? parseInt(DB_MAX_CONNECTIONS, 10) : 20,
    idleTimeoutMillis: DB_IDLE_TIMEOUT ? parseInt(DB_IDLE_TIMEOUT, 10) : 30000,
    connectionTimeoutMillis: DB_CONNECT_TIMEOUT ? parseInt(DB_CONNECT_TIMEOUT, 10) : 2000,
  };
}

// =============================================================================
// CONNECTION POOL (Singleton)
// =============================================================================

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool(config);

    pool.on('error', (err: Error) => {
      console.error('Unexpected database error:', err);
    });

    pool.on('connect', () => {
      console.log('New database connection established');
    });
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// =============================================================================
// QUERY EXECUTION HELPERS
// =============================================================================

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    console.log('Query executed', {
      text: text.substring(0, 100),
      duration,
      rows: result.rowCount,
    });
    
    return result;
  } catch (error) {
    console.error('Query error', {
      text: text.substring(0, 100),
      error,
    });
    throw error;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

// =============================================================================
// TRANSACTION SUPPORT
// =============================================================================

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// =============================================================================
// PREPARED STATEMENT HELPERS
// =============================================================================

export function buildInsertQuery(
  table: string,
  data: Record<string, unknown>,
  returning: string = '*'
): { text: string; values: unknown[] } {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const columns = keys.join(', ');
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  
  const text = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING ${returning}`;
  
  return { text, values };
}

export function buildUpdateQuery(
  table: string,
  data: Record<string, unknown>,
  whereClause: string,
  whereValues: unknown[],
  returning: string = '*'
): { text: string; values: unknown[] } {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ');
  
  const text = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`;
  const allValues = [...values, ...whereValues];
  
  return { text, values: allValues };
}

export function buildSelectQuery(
  table: string,
  columns: string = '*',
  whereClause?: string,
  orderBy?: string,
  limit?: number,
  offset?: number
): { text: string; values: unknown[] } {
  let text = `SELECT ${columns} FROM ${table}`;
  const values: unknown[] = [];
  
  if (whereClause) {
    text += ` WHERE ${whereClause}`;
  }
  
  if (orderBy) {
    text += ` ORDER BY ${orderBy}`;
  }
  
  if (limit !== undefined) {
    values.push(limit);
    text += ` LIMIT $${values.length}`;
  }
  
  if (offset !== undefined) {
    values.push(offset);
    text += ` OFFSET $${values.length}`;
  }
  
  return { text, values };
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function paginatedQuery<T extends QueryResultRow>(
  baseQuery: string,
  countQuery: string,
  params: unknown[],
  page: number = 1,
  limit: number = 20
): Promise<PaginationResult<T>> {
  const offset = (page - 1) * limit;
  
  const [dataResult, countResult] = await Promise.all([
    query<T>(`${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
    queryOne<{ count: string }>(countQuery, params),
  ]);
  
  const total = parseInt(countResult?.count || '0', 10);
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public detail?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(error: unknown): DatabaseError {
  if (error instanceof Error) {
    const pgError = error as { code?: string; detail?: string };
    
    return new DatabaseError(
      error.message,
      pgError.code || 'UNKNOWN_ERROR',
      pgError.detail
    );
  }
  
  return new DatabaseError('Unknown database error', 'UNKNOWN_ERROR');
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0]?.health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
