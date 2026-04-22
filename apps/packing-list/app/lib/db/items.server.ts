import type { D1Database } from '@cloudflare/workers-types'
import type { Item } from '~/types/database'

// ==========================================
// Items CRUD
// ==========================================

export async function getItems(db: D1Database, { limit = 100, offset = 0, all = false } = {}): Promise<Item[]> {
  if (all) {
    const result = await db.prepare('SELECT * FROM items ORDER BY name').all<Item>()
    return result.results
  }
  const result = await db
    .prepare('SELECT * FROM items ORDER BY name LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<Item>()
  return result.results
}

export async function getItem(db: D1Database, id: number): Promise<Item | null> {
  const result = await db
    .prepare('SELECT * FROM items WHERE id = ?')
    .bind(id)
    .first<Item>()
  return result
}

export async function getItemById(db: D1Database, id: number): Promise<Item | null> {
  const result = await db
    .prepare('SELECT * FROM items WHERE id = ?')
    .bind(id)
    .first<Item>()
  return result
}

export async function createItem(
  db: D1Database,
  data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'unit_name'> & {
    unit_name?: string
    weight_oz?: number | null
    brand_preference?: string | null
  }
): Promise<Item> {
  const unitName = data.unit_name ?? 'each'
  const result = await db
    .prepare(`
      INSERT INTO items (name, description, category, asin, image_url, unit_name, weight_oz, brand_preference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      data.name,
      data.description,
      data.category,
      data.asin,
      data.image_url,
      unitName,
      data.weight_oz ?? null,
      data.brand_preference ?? null
    )
    .first<Item>()

  return result!
}

export async function updateItem(
  db: D1Database,
  id: number,
  data: Partial<Omit<Item, 'id' | 'created_at' | 'updated_at'>>
): Promise<Item> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }
  if (data.category !== undefined) {
    fields.push('category = ?')
    values.push(data.category)
  }
  if (data.asin !== undefined) {
    fields.push('asin = ?')
    values.push(data.asin)
  }
  if (data.image_url !== undefined) {
    fields.push('image_url = ?')
    values.push(data.image_url)
  }
  if (data.unit_name !== undefined) {
    fields.push('unit_name = ?')
    values.push(data.unit_name)
  }
  if (data.weight_oz !== undefined) {
    fields.push('weight_oz = ?')
    values.push(data.weight_oz)
  }
  if (data.brand_preference !== undefined) {
    fields.push('brand_preference = ?')
    values.push(data.brand_preference)
  }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const result = await db
    .prepare(`
      UPDATE items
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    .bind(...values)
    .first<Item>()

  return result!
}

export async function deleteItem(db: D1Database, id: number): Promise<void> {
  // Delete associated prices first
  await db.prepare('DELETE FROM prices WHERE item_id = ?').bind(id).run()
  // Delete packing list item references
  await db.prepare('DELETE FROM packing_list_items WHERE item_id = ?').bind(id).run()
  // Then delete the item
  await db.prepare('DELETE FROM items WHERE id = ?').bind(id).run()
}

export async function deleteItemsBulk(db: D1Database, ids: number[]): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  // Delete associated prices first
  await db
    .prepare(`DELETE FROM prices WHERE item_id IN (${placeholders})`)
    .bind(...ids)
    .run()
  // Delete packing list item references
  await db
    .prepare(`DELETE FROM packing_list_items WHERE item_id IN (${placeholders})`)
    .bind(...ids)
    .run()
  // Then delete the items
  await db
    .prepare(`DELETE FROM items WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run()
}

export async function updateItemsCategory(
  db: D1Database,
  ids: number[],
  category: string
): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  await db
    .prepare(`UPDATE items SET category = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`)
    .bind(category, ...ids)
    .run()
}

export async function getItemsByIds(
  db: D1Database,
  ids: number[]
): Promise<(Item & { price_count: number; list_count: number })[]> {
  if (ids.length === 0) return []

  const placeholders = ids.map(() => '?').join(',')
  const result = await db
    .prepare(`
      SELECT
        i.*,
        (SELECT COUNT(*) FROM prices WHERE item_id = i.id) as price_count,
        (SELECT COUNT(*) FROM packing_list_items WHERE item_id = i.id) as list_count
      FROM items i
      WHERE i.id IN (${placeholders})
      ORDER BY i.name
    `)
    .bind(...ids)
    .all<Item & { price_count: number; list_count: number }>()

  return result.results
}

// ==========================================
// Admin Items with Filters
// ==========================================

export interface ItemFilters {
  category?: string
  unitName?: string
  hasAsin?: boolean
  hasImage?: boolean
  search?: string
  sort?: 'name' | 'category' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ItemWithCounts extends Item {
  price_count: number
  list_count: number
}

export interface ItemsWithFiltersResult {
  items: ItemWithCounts[]
  total: number
  page: number
  totalPages: number
}

export async function getItemsWithFilters(
  db: D1Database,
  filters: ItemFilters
): Promise<ItemsWithFiltersResult> {
  const {
    category,
    unitName,
    hasAsin,
    hasImage,
    search,
    sort = 'name',
    direction = 'asc',
    page = 1,
    limit = 25,
  } = filters

  // Build WHERE clauses
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (category) {
    conditions.push('i.category = ?')
    params.push(category)
  }

  if (unitName) {
    conditions.push("COALESCE(i.unit_name, 'each') = ?")
    params.push(unitName)
  }

  if (hasAsin === true) {
    conditions.push("i.asin IS NOT NULL AND i.asin != ''")
  } else if (hasAsin === false) {
    conditions.push("(i.asin IS NULL OR i.asin = '')")
  }

  if (hasImage === true) {
    conditions.push("i.image_url IS NOT NULL AND i.image_url != ''")
  } else if (hasImage === false) {
    conditions.push("(i.image_url IS NULL OR i.image_url = '')")
  }

  if (search) {
    conditions.push('i.name LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Validate sort column
  const validSorts = ['name', 'category', 'created_at']
  const sortCol = validSorts.includes(sort) ? sort : 'name'
  const sortDir = direction === 'desc' ? 'DESC' : 'ASC'

  // Get total count
  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM items i ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>()

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  // Get items with price count and list count
  const itemsResult = await db
    .prepare(`
      SELECT
        i.*,
        (SELECT COUNT(*) FROM prices WHERE item_id = i.id) as price_count,
        (SELECT COUNT(*) FROM packing_list_items WHERE item_id = i.id) as list_count
      FROM items i
      ${whereClause}
      ORDER BY i.${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `)
    .bind(...params, limit, offset)
    .all<ItemWithCounts>()

  return {
    items: itemsResult.results,
    total,
    page,
    totalPages,
  }
}

export async function getDistinctCategories(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT category FROM items
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `)
    .all<{ category: string }>()
  return result.results.map((r) => r.category)
}

export async function getDistinctUnitNames(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT COALESCE(unit_name, 'each') as unit_name FROM items
      ORDER BY unit_name
    `)
    .all<{ unit_name: string }>()
  return result.results.map((r) => r.unit_name)
}

export async function searchItems(
  db: D1Database,
  query: string,
  limit: number = 20
): Promise<Item[]> {
  const result = await db
    .prepare(`
      SELECT * FROM items
      WHERE name LIKE ?
      ORDER BY name
      LIMIT ?
    `)
    .bind(`%${query}%`, limit)
    .all<Item>()
  return result.results
}

// ==========================================
// Enhanced Item Search (Multi-Column, Token-Split)
// ==========================================

export interface ItemSearchResult extends Item {
  list_count: number
  price_count: number
  best_price: number | null
  has_local_price: number // 0 or 1 from SQLite
}

export async function searchItemsEnhanced(
  db: D1Database,
  query: string,
  options?: {
    baseId?: number | null
    category?: string | null
    limit?: number
  }
): Promise<ItemSearchResult[]> {
  const { baseId, category, limit = 30 } = options ?? {}

  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  const tokens = normalizedQuery.split(/\s+/).filter(t => t.length > 1)
  if (tokens.length === 0) return []

  // Build WHERE: each token must match name OR description OR category
  const tokenConditions: string[] = []
  const tokenParams: string[] = []

  for (const token of tokens) {
    tokenConditions.push(`(
      LOWER(i.name) LIKE ? OR
      LOWER(COALESCE(i.description, '')) LIKE ? OR
      LOWER(COALESCE(i.category, '')) LIKE ?
    )`)
    tokenParams.push(`%${token}%`, `%${token}%`, `%${token}%`)
  }

  let categoryClause = ''
  const categoryParams: string[] = []
  if (category) {
    categoryClause = 'AND i.category = ?'
    categoryParams.push(category)
  }

  // Build local price subquery based on whether base is selected
  const localPriceExpr = baseId
    ? `(SELECT COUNT(*) FROM prices p2
        JOIN stores s2 ON p2.store_id = s2.id
        WHERE p2.item_id = i.id AND (s2.base_id = ? OR s2.is_online = 1)) > 0`
    : '0'
  const localPriceParams: number[] = baseId ? [baseId] : []

  const sql = `
    SELECT
      i.*,
      (SELECT COUNT(*) FROM packing_list_items WHERE item_id = i.id) as list_count,
      (SELECT COUNT(*) FROM prices WHERE item_id = i.id) as price_count,
      (SELECT MIN(price) FROM prices WHERE item_id = i.id) as best_price,
      (${localPriceExpr}) as has_local_price
    FROM items i
    WHERE (${tokenConditions.join(' AND ')})
    ${categoryClause}
    ORDER BY
      CASE WHEN LOWER(i.name) = ? THEN 0
           WHEN LOWER(i.name) LIKE ? THEN 1
           ELSE 2
      END,
      list_count DESC,
      i.name ASC
    LIMIT ?
  `

  // IMPORTANT: Bind order must match ? placeholder order in SQL text (left-to-right, top-to-bottom)
  // 1. localPriceParams — SELECT clause subquery (s2.base_id = ?)
  // 2. tokenParams — WHERE clause (name/description/category LIKE ?)
  // 3. categoryParams — WHERE clause (i.category = ?)
  // 4. normalizedQuery — ORDER BY (LOWER(i.name) = ?)
  // 5. %normalizedQuery% — ORDER BY (LOWER(i.name) LIKE ?)
  // 6. limit — LIMIT ?
  const allParams = [
    ...localPriceParams,    // SELECT clause subquery comes first in SQL
    ...tokenParams,         // WHERE clause token conditions
    ...categoryParams,      // WHERE clause category filter
    normalizedQuery,        // ORDER BY exact match
    `%${normalizedQuery}%`, // ORDER BY partial match
    limit,
  ]

  const result = await db
    .prepare(sql)
    .bind(...allParams)
    .all<ItemSearchResult>()

  return result.results
}

// ==========================================
// Item Price Count & Lists Containing Item
// ==========================================

export async function getItemPriceCount(db: D1Database, itemId: number): Promise<number> {
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM prices WHERE item_id = ?')
    .bind(itemId)
    .first<{ count: number }>()
  return result?.count ?? 0
}

export async function getPackingListsContainingItem(
  db: D1Database,
  itemId: number
): Promise<{ id: number; name: string }[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT pl.id, pl.name
      FROM packing_lists pl
      JOIN packing_list_items pli ON pl.id = pli.packing_list_id
      WHERE pli.item_id = ?
      ORDER BY pl.name
    `)
    .bind(itemId)
    .all<{ id: number; name: string }>()
  return result.results
}

// ==========================================
// Item Merge
// ==========================================

export async function mergeItems(
  db: D1Database,
  primaryId: number,
  mergeIds: number[]
): Promise<{ pricesMoved: number; listEntriesMoved: number; itemsDeleted: number }> {
  if (mergeIds.length === 0) {
    return { pricesMoved: 0, listEntriesMoved: 0, itemsDeleted: 0 }
  }

  const placeholders = mergeIds.map(() => '?').join(',')

  // Get count of prices to be moved
  const priceCountResult = await db
    .prepare(`SELECT COUNT(*) as count FROM prices WHERE item_id IN (${placeholders})`)
    .bind(...mergeIds)
    .first<{ count: number }>()
  const pricesMoved = priceCountResult?.count ?? 0

  // Get count of list entries to be moved
  const listCountResult = await db
    .prepare(`SELECT COUNT(*) as count FROM packing_list_items WHERE item_id IN (${placeholders})`)
    .bind(...mergeIds)
    .first<{ count: number }>()
  const listEntriesMoved = listCountResult?.count ?? 0

  // Move all prices from merge items to primary item
  // Move all packing list entries from merge items to primary item
  // Delete the merge items
  const updatePricesStmt = db.prepare(
    `UPDATE prices SET item_id = ? WHERE item_id IN (${placeholders})`
  )
  const updateListEntriesStmt = db.prepare(
    `UPDATE packing_list_items SET item_id = ? WHERE item_id IN (${placeholders})`
  )
  const deleteItemsStmt = db.prepare(
    `DELETE FROM items WHERE id IN (${placeholders})`
  )

  // Execute all operations in a batch for atomicity
  await db.batch([
    updatePricesStmt.bind(primaryId, ...mergeIds),
    updateListEntriesStmt.bind(primaryId, ...mergeIds),
    deleteItemsStmt.bind(...mergeIds),
  ])

  return {
    pricesMoved,
    listEntriesMoved,
    itemsDeleted: mergeIds.length,
  }
}

// ==========================================
// Item Stats
// ==========================================

export async function getItemStats(db: D1Database): Promise<{
  totalItems: number
  itemsWithPrices: number
  itemsWithoutPrices: number
  totalCategories: number
}> {
  const [total, withPrices, categories] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM items').first<{ count: number }>(),
    db.prepare('SELECT COUNT(DISTINCT item_id) as count FROM prices').first<{ count: number }>(),
    db.prepare("SELECT COUNT(DISTINCT category) as count FROM items WHERE category IS NOT NULL AND category != ''").first<{ count: number }>(),
  ])

  return {
    totalItems: total?.count ?? 0,
    itemsWithPrices: withPrices?.count ?? 0,
    itemsWithoutPrices: (total?.count ?? 0) - (withPrices?.count ?? 0),
    totalCategories: categories?.count ?? 0,
  }
}

// ==========================================
// Items Needing Prices at Base
// ==========================================

export async function getItemsNeedingPricesAtBase(
  db: D1Database,
  baseId: number,
  limit: number = 5
): Promise<Item[]> {
  const result = await db
    .prepare(`
      SELECT i.*
      FROM items i
      WHERE i.id NOT IN (
        SELECT DISTINCT p.item_id
        FROM prices p
        JOIN stores s ON p.store_id = s.id
        WHERE s.base_id = ? OR s.is_online = 1
      )
      AND i.id IN (
        SELECT DISTINCT item_id FROM packing_list_items
      )
      ORDER BY (SELECT COUNT(*) FROM packing_list_items WHERE item_id = i.id) DESC
      LIMIT ?
    `)
    .bind(baseId, limit)
    .all<Item>()

  return result.results
}

// ==========================================
// Item Name Normalization & Dedup
// ==========================================

/**
 * Normalize an item name for dedup comparison.
 * Lowercase, remove articles, remove parentheticals,
 * normalize dashes, remove special chars, collapse spaces.
 */
export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(a|an|the)\b/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[-\u2013\u2014]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Find potential duplicate items by tokenizing the name
 * and searching for items that share significant tokens.
 */
export async function findDuplicateItems(
  db: D1Database,
  name: string,
  limit: number = 5
): Promise<Item[]> {
  const normalized = normalizeItemName(name)
  const tokens = normalized.split(' ').filter(t => t.length > 2)

  if (tokens.length === 0) return []

  const conditions = tokens.map(() => 'LOWER(name) LIKE ?').join(' OR ')
  const params = tokens.map(t => `%${t}%`)

  const result = await db
    .prepare(`
      SELECT * FROM items
      WHERE ${conditions}
      ORDER BY name
      LIMIT ?
    `)
    .bind(...params, limit)
    .all<Item>()

  return result.results
}

/**
 * Create an item with duplicate detection.
 * Returns the existing item if an exact normalized match is found.
 */
export async function createItemWithDedup(
  db: D1Database,
  data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'unit_name'> & {
    unit_name?: string
    weight_oz?: number | null
    brand_preference?: string | null
    skipDedupCheck?: boolean
  }
): Promise<{ item: Item; duplicates?: Item[] }> {
  if (!data.skipDedupCheck) {
    const duplicates = await findDuplicateItems(db, data.name)
    const exactMatch = duplicates.find(
      d => normalizeItemName(d.name) === normalizeItemName(data.name)
    )
    if (exactMatch) {
      return { item: exactMatch, duplicates }
    }
  }

  const item = await createItem(db, data)
  return { item }
}
