/**
 * Execute a parameterized D1 query and return all rows.
 */
export async function queryAll<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results;
}

/**
 * Execute a parameterized D1 query and return the first row or null.
 */
export async function queryFirst<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result ?? null;
}

/**
 * Execute a D1 statement (INSERT, UPDATE, DELETE) and return metadata.
 */
export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Response> {
  return db.prepare(sql).bind(...params).run();
}

/**
 * Run multiple D1 statements in a batch (transaction-like).
 */
export async function batch(
  db: D1Database,
  statements: { sql: string; params?: unknown[] }[]
): Promise<D1Result[]> {
  const prepared = statements.map((s) =>
    db.prepare(s.sql).bind(...(s.params ?? []))
  );
  return db.batch(prepared);
}
