import type { D1Database } from '@cloudflare/workers-types'
import type { Base } from '~/types/database'

// ==========================================
// Bases CRUD
// ==========================================

export async function getBases(db: D1Database): Promise<Base[]> {
  const result = await db.prepare('SELECT * FROM bases ORDER BY name').all<Base>()
  return result.results
}

export async function getBasesWithStoreCount(db: D1Database): Promise<(Base & { store_count: number })[]> {
  const result = await db
    .prepare(`
      SELECT b.*, COUNT(s.id) as store_count
      FROM bases b
      LEFT JOIN stores s ON s.base_id = b.id
      GROUP BY b.id
      ORDER BY b.branch, b.name
    `)
    .all<Base & { store_count: number }>()
  return result.results
}

export interface BaseFilters {
  branch?: string
  state?: string
  region?: string
  search?: string
  sort?: 'name' | 'branch' | 'state' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface BaseWithStoreCount extends Base {
  store_count: number
}

export interface BasesWithFiltersResult {
  bases: BaseWithStoreCount[]
  total: number
  page: number
  totalPages: number
}

export async function getBasesWithFilters(
  db: D1Database,
  filters: BaseFilters
): Promise<BasesWithFiltersResult> {
  const {
    branch,
    state,
    region,
    search,
    sort = 'name',
    direction = 'asc',
    page = 1,
    limit = 25,
  } = filters

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (branch) {
    conditions.push('b.branch = ?')
    params.push(branch)
  }

  if (state) {
    conditions.push('b.state = ?')
    params.push(state)
  }

  if (region) {
    conditions.push('b.region = ?')
    params.push(region)
  }

  if (search) {
    conditions.push('(b.name LIKE ? OR b.abbreviation LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const validSorts = ['name', 'branch', 'state', 'created_at']
  const sortCol = validSorts.includes(sort) ? sort : 'name'
  const sortDir = direction === 'desc' ? 'DESC' : 'ASC'

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM bases b ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>()

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  const basesResult = await db
    .prepare(`
      SELECT
        b.*,
        (SELECT COUNT(*) FROM stores WHERE base_id = b.id) as store_count
      FROM bases b
      ${whereClause}
      ORDER BY b.${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `)
    .bind(...params, limit, offset)
    .all<BaseWithStoreCount>()

  return {
    bases: basesResult.results,
    total,
    page,
    totalPages,
  }
}

export async function getBaseById(db: D1Database, id: number): Promise<Base | null> {
  const result = await db
    .prepare('SELECT * FROM bases WHERE id = ?')
    .bind(id)
    .first<Base>()
  return result
}

export async function createBase(
  db: D1Database,
  data: Omit<Base, 'id' | 'created_at' | 'updated_at'>
): Promise<Base> {
  const result = await db
    .prepare(`
      INSERT INTO bases (name, abbreviation, branch, location, state, region, website, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      data.name,
      data.abbreviation,
      data.branch,
      data.location,
      data.state,
      data.region,
      data.website,
      data.description
    )
    .first<Base>()

  return result!
}

export async function updateBase(
  db: D1Database,
  id: number,
  data: Partial<Omit<Base, 'id' | 'created_at' | 'updated_at'>>
): Promise<Base> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.abbreviation !== undefined) {
    fields.push('abbreviation = ?')
    values.push(data.abbreviation)
  }
  if (data.branch !== undefined) {
    fields.push('branch = ?')
    values.push(data.branch)
  }
  if (data.location !== undefined) {
    fields.push('location = ?')
    values.push(data.location)
  }
  if (data.state !== undefined) {
    fields.push('state = ?')
    values.push(data.state)
  }
  if (data.region !== undefined) {
    fields.push('region = ?')
    values.push(data.region)
  }
  if (data.website !== undefined) {
    fields.push('website = ?')
    values.push(data.website)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const result = await db
    .prepare(`
      UPDATE bases
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    .bind(...values)
    .first<Base>()

  return result!
}

export async function deleteBase(db: D1Database, id: number): Promise<void> {
  // First, set base_id to null for any stores referencing this base
  await db.prepare('UPDATE stores SET base_id = NULL WHERE base_id = ?').bind(id).run()
  // Also set base_id to null for any packing lists
  await db.prepare('UPDATE packing_lists SET base_id = NULL WHERE base_id = ?').bind(id).run()
  // Then delete the base
  await db.prepare('DELETE FROM bases WHERE id = ?').bind(id).run()
}

export async function getDistinctBaseStates(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT state FROM bases
      WHERE state IS NOT NULL AND state != ''
      ORDER BY state
    `)
    .all<{ state: string }>()
  return result.results.map((r) => r.state)
}

export async function getDistinctBaseBranches(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT branch FROM bases
      WHERE branch IS NOT NULL AND branch != ''
      ORDER BY branch
    `)
    .all<{ branch: string }>()
  return result.results.map((r) => r.branch)
}

export async function getDistinctBaseRegions(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT region FROM bases
      WHERE region IS NOT NULL AND region != ''
      ORDER BY region
    `)
    .all<{ region: string }>()
  return result.results.map((r) => r.region)
}
