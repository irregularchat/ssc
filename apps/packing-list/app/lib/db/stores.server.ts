import type { D1Database } from '@cloudflare/workers-types'
import type { Store } from '~/types/database'

// ==========================================
// Stores CRUD
// ==========================================

export async function getStores(db: D1Database, { limit = 100, offset = 0, all = false } = {}): Promise<Store[]> {
  if (all) {
    const result = await db.prepare('SELECT * FROM stores ORDER BY name').all<Store>()
    return result.results
  }
  const result = await db
    .prepare('SELECT * FROM stores ORDER BY name LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<Store>()
  return result.results
}

export async function getNearbyStores(
  db: D1Database,
  lat: number,
  lng: number,
  radiusMiles: number = 25
): Promise<Store[]> {
  // Simple bounding box query (for SQLite without spatial extensions)
  const latDelta = radiusMiles / 69.0
  const lngDelta = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180))

  const result = await db
    .prepare(`
      SELECT * FROM stores
      WHERE lat BETWEEN ? AND ?
        AND lng BETWEEN ? AND ?
      ORDER BY name
    `)
    .bind(lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta)
    .all<Store>()

  return result.results
}

// Stores by installation
export async function getStoresByBase(db: D1Database, baseId: number | null): Promise<Store[]> {
  if (baseId === null) {
    // Return online stores only
    const result = await db
      .prepare('SELECT * FROM stores WHERE is_online = 1 ORDER BY name')
      .all<Store>()
    return result.results
  }

  // Return stores for base + all online stores
  const result = await db
    .prepare(`
      SELECT * FROM stores
      WHERE base_id = ? OR is_online = 1
      ORDER BY is_online ASC, store_type, name
    `)
    .bind(baseId)
    .all<Store>()
  return result.results
}

// Admin Stores with Filters
export interface StoreFilters {
  baseId?: number | null
  state?: string
  storeType?: string
  isOnline?: boolean
  hasMilitaryDiscount?: boolean
  search?: string
  sort?: 'name' | 'city' | 'state' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface StoreWithPriceCount extends Store {
  price_count: number
  base_name?: string | null
}

export interface StoresWithFiltersResult {
  stores: StoreWithPriceCount[]
  total: number
  page: number
  totalPages: number
}

export async function getStoresWithFilters(
  db: D1Database,
  filters: StoreFilters
): Promise<StoresWithFiltersResult> {
  const {
    baseId,
    state,
    storeType,
    isOnline,
    hasMilitaryDiscount,
    search,
    sort = 'name',
    direction = 'asc',
    page = 1,
    limit = 25,
  } = filters

  // Build WHERE clauses
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (baseId !== undefined && baseId !== null) {
    conditions.push('s.base_id = ?')
    params.push(baseId)
  }

  if (state) {
    conditions.push('s.state = ?')
    params.push(state)
  }

  if (storeType) {
    conditions.push('s.store_type = ?')
    params.push(storeType)
  }

  if (isOnline !== undefined) {
    conditions.push('s.is_online = ?')
    params.push(isOnline ? 1 : 0)
  }

  if (hasMilitaryDiscount !== undefined) {
    conditions.push('COALESCE(s.accepts_military_discount, 0) = ?')
    params.push(hasMilitaryDiscount ? 1 : 0)
  }

  if (search) {
    conditions.push('s.name LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Validate sort column
  const validSorts = ['name', 'city', 'state', 'created_at']
  const sortCol = validSorts.includes(sort) ? sort : 'name'
  const sortDir = direction === 'desc' ? 'DESC' : 'ASC'

  // Get total count
  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM stores s ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>()

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  // Get stores with price count and base name
  const storesResult = await db
    .prepare(`
      SELECT
        s.*,
        COALESCE(b.name, NULL) as base_name,
        (SELECT COUNT(*) FROM prices WHERE store_id = s.id) as price_count
      FROM stores s
      LEFT JOIN bases b ON s.base_id = b.id
      ${whereClause}
      ORDER BY s.${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `)
    .bind(...params, limit, offset)
    .all<StoreWithPriceCount>()

  return {
    stores: storesResult.results,
    total,
    page,
    totalPages,
  }
}

export async function getDistinctStoreStates(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT state FROM stores
      WHERE state IS NOT NULL AND state != ''
      ORDER BY state
    `)
    .all<{ state: string }>()
  return result.results.map((r) => r.state)
}

export async function getDistinctStoreTypes(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT store_type FROM stores
      WHERE store_type IS NOT NULL AND store_type != ''
      ORDER BY store_type
    `)
    .all<{ store_type: string }>()
  return result.results.map((r) => r.store_type)
}

export async function deleteStore(db: D1Database, id: number): Promise<void> {
  // Delete associated prices first
  await db.prepare('DELETE FROM prices WHERE store_id = ?').bind(id).run()
  // Then delete the store
  await db.prepare('DELETE FROM stores WHERE id = ?').bind(id).run()
}

export async function deleteStoresBulk(db: D1Database, ids: number[]): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  // Delete associated prices first
  await db
    .prepare(`DELETE FROM prices WHERE store_id IN (${placeholders})`)
    .bind(...ids)
    .run()
  // Then delete the stores
  await db
    .prepare(`DELETE FROM stores WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run()
}

// Store CRUD operations
export async function getStoreById(db: D1Database, id: number): Promise<Store | null> {
  const result = await db
    .prepare('SELECT * FROM stores WHERE id = ?')
    .bind(id)
    .first<Store>()
  return result
}

export async function createStore(
  db: D1Database,
  data: Omit<Store, 'id' | 'created_at' | 'updated_at'>
): Promise<Store> {
  const result = await db
    .prepare(`
      INSERT INTO stores (
        name, address, city, state, zip, phone, website,
        lat, lng, is_online, store_type, base_id,
        accepts_military_discount, military_discount_pct
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      data.name,
      data.address,
      data.city,
      data.state,
      data.zip,
      data.phone,
      data.website,
      data.lat,
      data.lng,
      data.is_online,
      data.store_type,
      data.base_id,
      data.accepts_military_discount ?? 0,
      data.military_discount_pct
    )
    .first<Store>()

  return result!
}

export async function updateStore(
  db: D1Database,
  id: number,
  data: Partial<Omit<Store, 'id' | 'created_at' | 'updated_at'>>
): Promise<Store> {
  // Build dynamic update query
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.address !== undefined) {
    fields.push('address = ?')
    values.push(data.address)
  }
  if (data.city !== undefined) {
    fields.push('city = ?')
    values.push(data.city)
  }
  if (data.state !== undefined) {
    fields.push('state = ?')
    values.push(data.state)
  }
  if (data.zip !== undefined) {
    fields.push('zip = ?')
    values.push(data.zip)
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?')
    values.push(data.phone)
  }
  if (data.website !== undefined) {
    fields.push('website = ?')
    values.push(data.website)
  }
  if (data.lat !== undefined) {
    fields.push('lat = ?')
    values.push(data.lat)
  }
  if (data.lng !== undefined) {
    fields.push('lng = ?')
    values.push(data.lng)
  }
  if (data.is_online !== undefined) {
    fields.push('is_online = ?')
    values.push(data.is_online)
  }
  if (data.store_type !== undefined) {
    fields.push('store_type = ?')
    values.push(data.store_type)
  }
  if (data.base_id !== undefined) {
    fields.push('base_id = ?')
    values.push(data.base_id)
  }
  if (data.accepts_military_discount !== undefined) {
    fields.push('accepts_military_discount = ?')
    values.push(data.accepts_military_discount)
  }
  if (data.military_discount_pct !== undefined) {
    fields.push('military_discount_pct = ?')
    values.push(data.military_discount_pct)
  }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const result = await db
    .prepare(`
      UPDATE stores
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    .bind(...values)
    .first<Store>()

  return result!
}

export async function getStorePriceCount(db: D1Database, storeId: number): Promise<number> {
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM prices WHERE store_id = ?')
    .bind(storeId)
    .first<{ count: number }>()
  return result?.count ?? 0
}

// Store Merge Functions
export async function getStoresByIds(
  db: D1Database,
  ids: number[]
): Promise<(Store & { price_count: number })[]> {
  if (ids.length === 0) return []

  const placeholders = ids.map(() => '?').join(',')
  const result = await db
    .prepare(`
      SELECT
        s.*,
        (SELECT COUNT(*) FROM prices WHERE store_id = s.id) as price_count
      FROM stores s
      WHERE s.id IN (${placeholders})
      ORDER BY s.name
    `)
    .bind(...ids)
    .all<Store & { price_count: number }>()

  return result.results
}

export async function mergeStores(
  db: D1Database,
  primaryId: number,
  mergeIds: number[]
): Promise<{ pricesMoved: number; storesDeleted: number }> {
  if (mergeIds.length === 0) {
    return { pricesMoved: 0, storesDeleted: 0 }
  }

  const placeholders = mergeIds.map(() => '?').join(',')

  // Get count of prices to be moved
  const priceCountResult = await db
    .prepare(`SELECT COUNT(*) as count FROM prices WHERE store_id IN (${placeholders})`)
    .bind(...mergeIds)
    .first<{ count: number }>()

  const pricesMoved = priceCountResult?.count ?? 0

  // Move all prices from merge stores to primary store
  // Use a batch to ensure atomicity
  const updateStmt = db.prepare(
    `UPDATE prices SET store_id = ? WHERE store_id IN (${placeholders})`
  )
  const deleteStmt = db.prepare(
    `DELETE FROM stores WHERE id IN (${placeholders})`
  )

  // Execute both operations in a batch for atomicity
  await db.batch([
    updateStmt.bind(primaryId, ...mergeIds),
    deleteStmt.bind(...mergeIds),
  ])

  return {
    pricesMoved,
    storesDeleted: mergeIds.length,
  }
}

export async function getStoresByBaseId(db: D1Database, baseId: number): Promise<Store[]> {
  const result = await db
    .prepare('SELECT * FROM stores WHERE base_id = ? ORDER BY name')
    .bind(baseId)
    .all<Store>()
  return result.results
}
