import type { D1Database } from '@cloudflare/workers-types'
import type {
  PackingList,
  PackingListWithRelations,
  PackingListItemWithItem,
  Item,
  Store,
  School,
  Base,
  PriceWithStore,
  Tip,
  TipWithVotes,
} from '~/types/database'

export function getDB(context: { cloudflare: { env: { DB: D1Database } } }) {
  return context.cloudflare.env.DB
}

// Packing Lists
export async function getPackingLists(db: D1Database): Promise<PackingListWithRelations[]> {
  const lists = await db
    .prepare(`
      SELECT
        pl.*,
        s.id as school_id, s.name as school_name, s.abbreviation as school_abbreviation,
        b.id as base_id, b.name as base_name, b.abbreviation as base_abbreviation
      FROM packing_lists pl
      LEFT JOIN schools s ON pl.school_id = s.id
      LEFT JOIN bases b ON pl.base_id = b.id
      ORDER BY pl.created_at DESC
    `)
    .all<PackingList & { school_name?: string; base_name?: string }>()

  return lists.results.map((row) => ({
    ...row,
    school: row.school_id ? { id: row.school_id, name: row.school_name! } as School : null,
    base: row.base_id ? { id: row.base_id, name: row.base_name! } as Base : null,
  }))
}

export async function getPackingList(db: D1Database, id: number): Promise<PackingListWithRelations | null> {
  const listRow = await db
    .prepare(`
      SELECT
        pl.*,
        s.id as s_id, s.name as school_name,
        b.id as b_id, b.name as base_name
      FROM packing_lists pl
      LEFT JOIN schools s ON pl.school_id = s.id
      LEFT JOIN bases b ON pl.base_id = b.id
      WHERE pl.id = ?
    `)
    .bind(id)
    .first<PackingList & { s_id?: number; school_name?: string; b_id?: number; base_name?: string }>()

  if (!listRow) return null

  const list: PackingListWithRelations = {
    ...listRow,
    school: listRow.s_id ? { id: listRow.s_id, name: listRow.school_name! } as School : null,
    base: listRow.b_id ? { id: listRow.b_id, name: listRow.base_name! } as Base : null,
  }

  const itemsResult = await db
    .prepare(`
      SELECT
        pli.id as pli_id,
        pli.packing_list_id,
        pli.item_id,
        pli.quantity,
        pli.notes,
        pli.added_by,
        pli.created_at as pli_created_at,
        i.id as item_id,
        i.name as item_name,
        i.description as item_description,
        i.category as item_category,
        i.asin as item_asin,
        i.image_url as item_image_url,
        COALESCE(i.unit_name, 'each') as item_unit_name,
        i.created_at as item_created_at,
        i.updated_at as item_updated_at
      FROM packing_list_items pli
      JOIN items i ON pli.item_id = i.id
      WHERE pli.packing_list_id = ?
      ORDER BY pli.created_at DESC
    `)
    .bind(id)
    .all<{
      pli_id: number
      packing_list_id: number
      item_id: number
      quantity: number
      notes: string | null
      added_by: string | null
      pli_created_at: string
      item_name: string
      item_description: string | null
      item_category: string | null
      item_asin: string | null
      item_image_url: string | null
      item_unit_name: string
      item_created_at: string
      item_updated_at: string
    }>()

  const items: PackingListItemWithItem[] = itemsResult.results.map((row) => ({
    id: row.pli_id,
    packing_list_id: row.packing_list_id,
    item_id: row.item_id,
    quantity: row.quantity,
    notes: row.notes,
    added_by: row.added_by,
    created_at: row.pli_created_at,
    item: {
      id: row.item_id,
      name: row.item_name,
      description: row.item_description,
      category: row.item_category,
      asin: row.item_asin,
      image_url: row.item_image_url,
      unit_name: row.item_unit_name,
      created_at: row.item_created_at,
      updated_at: row.item_updated_at,
    },
  }))

  return {
    ...list,
    items,
  }
}

export async function createPackingList(
  db: D1Database,
  data: Omit<PackingList, 'id' | 'created_at' | 'updated_at'>
): Promise<PackingList> {
  const result = await db
    .prepare(`
      INSERT INTO packing_lists (name, description, type, is_public, contributor_name, school_id, base_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      data.name,
      data.description,
      data.type,
      data.is_public,
      data.contributor_name,
      data.school_id,
      data.base_id
    )
    .first<PackingList>()

  return result!
}

export async function updatePackingList(
  db: D1Database,
  id: number,
  data: Partial<Omit<PackingList, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  await db
    .prepare(`
      UPDATE packing_lists
      SET name = ?, description = ?, type = ?, is_public = ?,
          contributor_name = ?, school_id = ?, base_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(
      data.name,
      data.description,
      data.type,
      data.is_public,
      data.contributor_name,
      data.school_id,
      data.base_id,
      id
    )
    .run()
}

export async function deletePackingList(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM packing_lists WHERE id = ?').bind(id).run()
}

export async function addItemToList(
  db: D1Database,
  listId: number,
  itemId: number,
  quantity: number = 1,
  notes: string | null = null
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes)
      VALUES (?, ?, ?, ?)
    `)
    .bind(listId, itemId, quantity, notes)
    .run()
}

export async function removeItemFromList(
  db: D1Database,
  packingListItemId: number
): Promise<void> {
  await db
    .prepare('DELETE FROM packing_list_items WHERE id = ?')
    .bind(packingListItemId)
    .run()
}

// Items
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

// Stores
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

// Prices
export async function getItemPrices(db: D1Database, itemId: number): Promise<PriceWithStore[]> {
  const result = await db
    .prepare(`
      SELECT
        p.*,
        s.name as store_name, s.address, s.city, s.state,
        COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
        COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
      FROM prices p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN votes v ON p.id = v.price_id
      WHERE p.item_id = ?
      GROUP BY p.id
      ORDER BY p.price ASC
    `)
    .bind(itemId)
    .all<PriceWithStore>()

  return result.results
}

// Shopping Comparison
export interface ShoppingComparisonData {
  items: Array<{
    id: number
    name: string
    quantity: number
    category: string | null
    prices: Array<{
      storeId: number
      storeName: string
      price: number
      votesUp: number
      votesDown: number
    }>
  }>
  stores: Array<{
    id: number
    name: string
    city: string | null
    state: string | null
    totalCost: number
    itemsAvailable: number
    itemsMissing: number
  }>
}

export async function getShoppingComparison(
  db: D1Database,
  listId: number
): Promise<ShoppingComparisonData | null> {
  // Get list items
  const listItems = await db
    .prepare(`
      SELECT pli.item_id, pli.quantity, i.name, i.category
      FROM packing_list_items pli
      JOIN items i ON pli.item_id = i.id
      WHERE pli.packing_list_id = ?
    `)
    .bind(listId)
    .all<{ item_id: number; quantity: number; name: string; category: string | null }>()

  if (listItems.results.length === 0) return null

  const itemIds = listItems.results.map((i) => i.item_id)

  // Get all stores
  const allStores = await db
    .prepare('SELECT id, name, city, state FROM stores ORDER BY name')
    .all<{ id: number; name: string; city: string | null; state: string | null }>()

  // Get prices for all items across all stores
  const pricesResult = await db
    .prepare(`
      SELECT
        p.item_id,
        p.store_id,
        p.price,
        s.name as store_name,
        COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
        COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
      FROM prices p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN votes v ON p.id = v.price_id
      WHERE p.item_id IN (${itemIds.map(() => '?').join(',')})
      GROUP BY p.id
    `)
    .bind(...itemIds)
    .all<{
      item_id: number
      store_id: number
      price: number
      store_name: string
      votes_up: number
      votes_down: number
    }>()

  // Build items with prices
  const items = listItems.results.map((item) => {
    const itemPrices = pricesResult.results.filter((p) => p.item_id === item.item_id)
    return {
      id: item.item_id,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      prices: itemPrices.map((p) => ({
        storeId: p.store_id,
        storeName: p.store_name,
        price: p.price,
        votesUp: p.votes_up,
        votesDown: p.votes_down,
      })),
    }
  })

  // Calculate store totals
  const stores = allStores.results.map((store) => {
    let totalCost = 0
    let itemsAvailable = 0
    let itemsMissing = 0

    items.forEach((item) => {
      const storePrice = item.prices.find((p) => p.storeId === store.id)
      if (storePrice) {
        totalCost += storePrice.price * item.quantity
        itemsAvailable++
      } else {
        itemsMissing++
      }
    })

    return {
      id: store.id,
      name: store.name,
      city: store.city,
      state: store.state,
      totalCost,
      itemsAvailable,
      itemsMissing,
    }
  })

  // Sort stores by total cost (only those with items)
  const storesWithItems = stores
    .filter((s) => s.itemsAvailable > 0)
    .sort((a, b) => a.totalCost - b.totalCost)

  return { items, stores: storesWithItems }
}

// Create/Update Prices
export async function createPrice(
  db: D1Database,
  data: {
    itemId: number
    storeId: number
    price: number
    inStock: boolean
    packageQty?: number // How many units in package (default 1)
    packageName?: string | null // Display name like "6-pack"
  }
): Promise<{ id: number }> {
  const packageQty = data.packageQty ?? 1
  const packageName = data.packageName ?? null

  // Check if price already exists for this item/store/package combination
  const existing = await db
    .prepare('SELECT id FROM prices WHERE item_id = ? AND store_id = ? AND COALESCE(package_qty, 1) = ?')
    .bind(data.itemId, data.storeId, packageQty)
    .first<{ id: number }>()

  if (existing) {
    // Update existing price
    await db
      .prepare(`
        UPDATE prices
        SET price = ?, in_stock = ?, package_qty = ?, package_name = ?, last_verified = datetime('now')
        WHERE id = ?
      `)
      .bind(data.price, data.inStock ? 1 : 0, packageQty, packageName, existing.id)
      .run()
    return { id: existing.id }
  }

  // Create new price
  const result = await db
    .prepare(`
      INSERT INTO prices (item_id, store_id, price, in_stock, package_qty, package_name, last_verified)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      RETURNING id
    `)
    .bind(data.itemId, data.storeId, data.price, data.inStock ? 1 : 0, packageQty, packageName)
    .first<{ id: number }>()

  return { id: result!.id }
}

export async function getItem(db: D1Database, id: number): Promise<Item | null> {
  const result = await db
    .prepare('SELECT * FROM items WHERE id = ?')
    .bind(id)
    .first<Item>()
  return result
}

// Voting
export async function voteOnPrice(
  db: D1Database,
  priceId: number,
  voteType: 'up' | 'down',
  voterIp: string | null = null
): Promise<void> {
  await db
    .prepare(`
      INSERT OR IGNORE INTO votes (price_id, vote_type, voter_ip)
      VALUES (?, ?, ?)
    `)
    .bind(priceId, voteType, voterIp)
    .run()
}

// Schools & Bases
export async function getSchools(db: D1Database, { limit = 100, offset = 0, all = false } = {}): Promise<School[]> {
  if (all) {
    const result = await db.prepare('SELECT * FROM schools ORDER BY name').all<School>()
    return result.results
  }
  const result = await db
    .prepare('SELECT * FROM schools ORDER BY name LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<School>()
  return result.results
}

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

// Enhanced shopping comparison with installation filter
export interface PriceInfo {
  price: number
  storeId: number
  storeName: string
  storeType: string | null
  isOnline: boolean
  packageQty: number // How many units per package (default 1)
  packageName: string | null // Display name like "6-pack"
  priceType: string // 'regular', 'sale', 'military'
  militaryDiscountPct: number | null
  hasMilitaryDiscount: boolean // Store offers military discount
  votesUp: number
  votesDown: number
}

export interface ShoppingComparisonItem {
  id: number
  name: string
  quantity: number
  category: string | null
  unitName: string // 'each', 'pair', 'pack', etc.
  priority: number // 1=Required, 2=Recommended, 3=Optional
  bestPrice: PriceInfo | null
  allPrices: PriceInfo[]
}

export interface ShoppingComparisonDataV2 {
  items: ShoppingComparisonItem[]
  stores: Store[]
  totalBestPrice: number
  categories: string[]
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

// Admin Dashboard Stats
export interface AdminStats {
  storeCount: number
  itemCount: number
  listCount: number
  priceCount: number
  voteCount: number
  storesWithMilitaryDiscount: number
}

export async function getAdminStats(db: D1Database): Promise<AdminStats> {
  const [stores, items, lists, prices, votes, militaryStores] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM stores').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM items').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM packing_lists').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM prices').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM votes').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM stores WHERE COALESCE(accepts_military_discount, 0) = 1').first<{ count: number }>(),
  ])

  return {
    storeCount: stores?.count ?? 0,
    itemCount: items?.count ?? 0,
    listCount: lists?.count ?? 0,
    priceCount: prices?.count ?? 0,
    voteCount: votes?.count ?? 0,
    storesWithMilitaryDiscount: militaryStores?.count ?? 0,
  }
}

export async function getItemsWithoutPrices(db: D1Database, limit: number = 10): Promise<Item[]> {
  const result = await db
    .prepare(`
      SELECT i.*
      FROM items i
      LEFT JOIN prices p ON i.id = p.item_id
      WHERE p.id IS NULL
      ORDER BY i.name
      LIMIT ?
    `)
    .bind(limit)
    .all<Item>()

  return result.results
}

export async function getItemsWithoutPricesCount(db: D1Database): Promise<number> {
  const result = await db
    .prepare(`
      SELECT COUNT(*) as count
      FROM items i
      LEFT JOIN prices p ON i.id = p.item_id
      WHERE p.id IS NULL
    `)
    .first<{ count: number }>()

  return result?.count ?? 0
}

export async function getStoresWithoutPrices(db: D1Database, limit: number = 10): Promise<Store[]> {
  const result = await db
    .prepare(`
      SELECT s.*
      FROM stores s
      LEFT JOIN prices p ON s.id = p.store_id
      WHERE p.id IS NULL
      ORDER BY s.name
      LIMIT ?
    `)
    .bind(limit)
    .all<Store>()

  return result.results
}

export async function getStoresWithoutPricesCount(db: D1Database): Promise<number> {
  const result = await db
    .prepare(`
      SELECT COUNT(*) as count
      FROM stores s
      LEFT JOIN prices p ON s.id = p.store_id
      WHERE p.id IS NULL
    `)
    .first<{ count: number }>()

  return result?.count ?? 0
}

export interface RecentPrice {
  item_name: string
  store_name: string
  price: number
  created_at: string
}

export async function getRecentPrices(db: D1Database, limit: number = 5): Promise<RecentPrice[]> {
  const result = await db
    .prepare(`
      SELECT
        i.name as item_name,
        s.name as store_name,
        p.price,
        p.created_at
      FROM prices p
      JOIN items i ON p.item_id = i.id
      JOIN stores s ON p.store_id = s.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `)
    .bind(limit)
    .all<RecentPrice>()

  return result.results
}

export interface LowVotePrice {
  id: number
  item_name: string
  store_name: string
  price: number
  vote_score: number
}

export async function getLowVotePrices(db: D1Database, limit: number = 5): Promise<LowVotePrice[]> {
  const result = await db
    .prepare(`
      SELECT
        p.id,
        i.name as item_name,
        s.name as store_name,
        p.price,
        (
          COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0)
        ) as vote_score
      FROM prices p
      JOIN items i ON p.item_id = i.id
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN votes v ON p.id = v.price_id
      GROUP BY p.id
      HAVING vote_score < 0
      ORDER BY vote_score ASC
      LIMIT ?
    `)
    .bind(limit)
    .all<LowVotePrice>()

  return result.results
}

// Admin Items with Filters
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
// Bases CRUD
// ==========================================

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

export async function getStoresByBaseId(db: D1Database, baseId: number): Promise<Store[]> {
  const result = await db
    .prepare('SELECT * FROM stores WHERE base_id = ? ORDER BY name')
    .bind(baseId)
    .all<Store>()
  return result.results
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

// ==========================================
// Schools CRUD
// ==========================================

export interface SchoolFilters {
  branch?: string
  search?: string
  sort?: 'name' | 'branch' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SchoolWithListCount extends School {
  list_count: number
}

export interface SchoolsWithFiltersResult {
  schools: SchoolWithListCount[]
  total: number
  page: number
  totalPages: number
}

export async function getSchoolsWithFilters(
  db: D1Database,
  filters: SchoolFilters
): Promise<SchoolsWithFiltersResult> {
  const {
    branch,
    search,
    sort = 'name',
    direction = 'asc',
    page = 1,
    limit = 25,
  } = filters

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (branch) {
    conditions.push('s.branch = ?')
    params.push(branch)
  }

  if (search) {
    conditions.push('(s.name LIKE ? OR s.abbreviation LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const validSorts = ['name', 'branch', 'created_at']
  const sortCol = validSorts.includes(sort) ? sort : 'name'
  const sortDir = direction === 'desc' ? 'DESC' : 'ASC'

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM schools s ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>()

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  const schoolsResult = await db
    .prepare(`
      SELECT
        s.*,
        (SELECT COUNT(*) FROM packing_lists WHERE school_id = s.id) as list_count
      FROM schools s
      ${whereClause}
      ORDER BY s.${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `)
    .bind(...params, limit, offset)
    .all<SchoolWithListCount>()

  return {
    schools: schoolsResult.results,
    total,
    page,
    totalPages,
  }
}

export async function getSchoolById(db: D1Database, id: number): Promise<School | null> {
  const result = await db
    .prepare('SELECT * FROM schools WHERE id = ?')
    .bind(id)
    .first<School>()
  return result
}

export async function createSchool(
  db: D1Database,
  data: Omit<School, 'id' | 'created_at' | 'updated_at'>
): Promise<School> {
  const result = await db
    .prepare(`
      INSERT INTO schools (name, abbreviation, branch, location, website, description)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      data.name,
      data.abbreviation,
      data.branch,
      data.location,
      data.website,
      data.description
    )
    .first<School>()

  return result!
}

export async function updateSchool(
  db: D1Database,
  id: number,
  data: Partial<Omit<School, 'id' | 'created_at' | 'updated_at'>>
): Promise<School> {
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
      UPDATE schools
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    .bind(...values)
    .first<School>()

  return result!
}

export async function deleteSchool(db: D1Database, id: number): Promise<void> {
  // First, set school_id to null for any packing lists referencing this school
  await db.prepare('UPDATE packing_lists SET school_id = NULL WHERE school_id = ?').bind(id).run()
  // Then delete the school
  await db.prepare('DELETE FROM schools WHERE id = ?').bind(id).run()
}

export async function getPackingListsBySchoolId(
  db: D1Database,
  schoolId: number
): Promise<PackingList[]> {
  const result = await db
    .prepare('SELECT * FROM packing_lists WHERE school_id = ? ORDER BY name')
    .bind(schoolId)
    .all<PackingList>()
  return result.results
}

export async function getDistinctSchoolBranches(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT branch FROM schools
      WHERE branch IS NOT NULL AND branch != ''
      ORDER BY branch
    `)
    .all<{ branch: string }>()
  return result.results.map((r) => r.branch)
}

// ==========================================
// Item CRUD & Merge
// ==========================================

export async function getItemById(db: D1Database, id: number): Promise<Item | null> {
  const result = await db
    .prepare('SELECT * FROM items WHERE id = ?')
    .bind(id)
    .first<Item>()
  return result
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
// Packing Lists Admin CRUD
// ==========================================

export interface PackingListFilters {
  schoolId?: number
  baseId?: number
  type?: string
  isPublic?: boolean
  search?: string
  sort?: 'name' | 'type' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PackingListWithItemCount extends PackingList {
  item_count: number
  school_name?: string | null
  base_name?: string | null
}

export interface PackingListsWithFiltersResult {
  lists: PackingListWithItemCount[]
  total: number
  page: number
  totalPages: number
}

export async function getPackingListsWithFilters(
  db: D1Database,
  filters: PackingListFilters
): Promise<PackingListsWithFiltersResult> {
  const {
    schoolId,
    baseId,
    type,
    isPublic,
    search,
    sort = 'name',
    direction = 'asc',
    page = 1,
    limit = 25,
  } = filters

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (schoolId !== undefined) {
    conditions.push('pl.school_id = ?')
    params.push(schoolId)
  }

  if (baseId !== undefined) {
    conditions.push('pl.base_id = ?')
    params.push(baseId)
  }

  if (type) {
    conditions.push('pl.type = ?')
    params.push(type)
  }

  if (isPublic !== undefined) {
    conditions.push('pl.is_public = ?')
    params.push(isPublic ? 1 : 0)
  }

  if (search) {
    conditions.push('pl.name LIKE ?')
    params.push(`%${search}%`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const validSorts = ['name', 'type', 'created_at']
  const sortCol = validSorts.includes(sort) ? sort : 'name'
  const sortDir = direction === 'desc' ? 'DESC' : 'ASC'

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM packing_lists pl ${whereClause}`)
    .bind(...params)
    .first<{ count: number }>()

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  const listsResult = await db
    .prepare(`
      SELECT
        pl.*,
        COALESCE(s.name, NULL) as school_name,
        COALESCE(b.name, NULL) as base_name,
        (SELECT COUNT(*) FROM packing_list_items WHERE packing_list_id = pl.id) as item_count
      FROM packing_lists pl
      LEFT JOIN schools s ON pl.school_id = s.id
      LEFT JOIN bases b ON pl.base_id = b.id
      ${whereClause}
      ORDER BY pl.${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `)
    .bind(...params, limit, offset)
    .all<PackingListWithItemCount>()

  return {
    lists: listsResult.results,
    total,
    page,
    totalPages,
  }
}

export async function getPackingListWithItems(
  db: D1Database,
  id: number
): Promise<(PackingListWithRelations & { items: PackingListItemWithItem[] }) | null> {
  const listRow = await db
    .prepare(`
      SELECT
        pl.*,
        s.id as s_id, s.name as school_name,
        b.id as b_id, b.name as base_name
      FROM packing_lists pl
      LEFT JOIN schools s ON pl.school_id = s.id
      LEFT JOIN bases b ON pl.base_id = b.id
      WHERE pl.id = ?
    `)
    .bind(id)
    .first<PackingList & { s_id?: number; school_name?: string; b_id?: number; base_name?: string }>()

  if (!listRow) return null

  const list: PackingListWithRelations = {
    ...listRow,
    school: listRow.s_id ? { id: listRow.s_id, name: listRow.school_name! } as School : null,
    base: listRow.b_id ? { id: listRow.b_id, name: listRow.base_name! } as Base : null,
  }

  const itemsResult = await db
    .prepare(`
      SELECT
        pli.id as pli_id,
        pli.packing_list_id,
        pli.item_id,
        pli.quantity,
        pli.notes,
        pli.added_by,
        COALESCE(pli.priority, 1) as priority,
        pli.source,
        pli.created_at as pli_created_at,
        i.id as i_id,
        i.name as item_name,
        i.description as item_description,
        i.category as item_category,
        i.asin as item_asin,
        i.image_url as item_image_url,
        COALESCE(i.unit_name, 'each') as item_unit_name,
        i.created_at as item_created_at,
        i.updated_at as item_updated_at
      FROM packing_list_items pli
      JOIN items i ON pli.item_id = i.id
      WHERE pli.packing_list_id = ?
      ORDER BY pli.priority ASC, pli.created_at DESC
    `)
    .bind(id)
    .all<{
      pli_id: number
      packing_list_id: number
      item_id: number
      quantity: number
      notes: string | null
      added_by: string | null
      priority: number
      source: string | null
      pli_created_at: string
      i_id: number
      item_name: string
      item_description: string | null
      item_category: string | null
      item_asin: string | null
      item_image_url: string | null
      item_unit_name: string
      item_created_at: string
      item_updated_at: string
    }>()

  const items: PackingListItemWithItem[] = itemsResult.results.map((row) => ({
    id: row.pli_id,
    packing_list_id: row.packing_list_id,
    item_id: row.item_id,
    quantity: row.quantity,
    notes: row.notes,
    added_by: row.added_by,
    priority: row.priority,
    source: row.source,
    created_at: row.pli_created_at,
    item: {
      id: row.i_id,
      name: row.item_name,
      description: row.item_description,
      category: row.item_category,
      asin: row.item_asin,
      image_url: row.item_image_url,
      unit_name: row.item_unit_name,
      created_at: row.item_created_at,
      updated_at: row.item_updated_at,
    },
  }))

  return {
    ...list,
    items,
  }
}

export async function updatePackingListDetails(
  db: D1Database,
  id: number,
  data: Partial<Omit<PackingList, 'id' | 'created_at' | 'updated_at'>>
): Promise<PackingList> {
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
  if (data.type !== undefined) {
    fields.push('type = ?')
    values.push(data.type)
  }
  if (data.is_public !== undefined) {
    fields.push('is_public = ?')
    values.push(data.is_public)
  }
  if (data.contributor_name !== undefined) {
    fields.push('contributor_name = ?')
    values.push(data.contributor_name)
  }
  if (data.school_id !== undefined) {
    fields.push('school_id = ?')
    values.push(data.school_id)
  }
  if (data.base_id !== undefined) {
    fields.push('base_id = ?')
    values.push(data.base_id)
  }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  const result = await db
    .prepare(`
      UPDATE packing_lists
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `)
    .bind(...values)
    .first<PackingList>()

  return result!
}

export async function deletePackingListById(db: D1Database, id: number): Promise<void> {
  // Delete associated items first
  await db.prepare('DELETE FROM packing_list_items WHERE packing_list_id = ?').bind(id).run()
  // Then delete the list
  await db.prepare('DELETE FROM packing_lists WHERE id = ?').bind(id).run()
}

export async function bulkUpdatePublicStatus(
  db: D1Database,
  ids: number[],
  isPublic: boolean
): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  await db
    .prepare(
      `UPDATE packing_lists SET is_public = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`
    )
    .bind(isPublic ? 1 : 0, ...ids)
    .run()
}

export async function deletePackingListsBulk(db: D1Database, ids: number[]): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  // Delete associated items first
  await db
    .prepare(`DELETE FROM packing_list_items WHERE packing_list_id IN (${placeholders})`)
    .bind(...ids)
    .run()
  // Then delete the lists
  await db
    .prepare(`DELETE FROM packing_lists WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run()
}

export async function getDistinctListTypes(db: D1Database): Promise<string[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT type FROM packing_lists
      WHERE type IS NOT NULL AND type != ''
      ORDER BY type
    `)
    .all<{ type: string }>()
  return result.results.map((r) => r.type)
}

// Packing List Item management
export async function updatePackingListItem(
  db: D1Database,
  id: number,
  data: { quantity?: number; priority?: number; notes?: string | null }
): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.quantity !== undefined) {
    fields.push('quantity = ?')
    values.push(data.quantity)
  }
  if (data.priority !== undefined) {
    fields.push('priority = ?')
    values.push(data.priority)
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?')
    values.push(data.notes)
  }

  if (fields.length === 0) return

  values.push(id)

  await db
    .prepare(`UPDATE packing_list_items SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()
}

export async function addItemToPackingList(
  db: D1Database,
  listId: number,
  itemId: number,
  quantity: number = 1,
  priority: number = 1,
  notes: string | null = null
): Promise<{ id: number }> {
  // Check if item already exists in list
  const existing = await db
    .prepare('SELECT id FROM packing_list_items WHERE packing_list_id = ? AND item_id = ?')
    .bind(listId, itemId)
    .first<{ id: number }>()

  if (existing) {
    // Update quantity and priority
    await db
      .prepare(
        'UPDATE packing_list_items SET quantity = quantity + ?, priority = ?, notes = COALESCE(?, notes) WHERE id = ?'
      )
      .bind(quantity, priority, notes, existing.id)
      .run()
    return { id: existing.id }
  }

  const result = await db
    .prepare(`
      INSERT INTO packing_list_items (packing_list_id, item_id, quantity, priority, notes)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
    `)
    .bind(listId, itemId, quantity, priority, notes)
    .first<{ id: number }>()

  return { id: result!.id }
}

export async function removeItemFromPackingList(
  db: D1Database,
  packingListItemId: number
): Promise<void> {
  await db.prepare('DELETE FROM packing_list_items WHERE id = ?').bind(packingListItemId).run()
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
// Admin Prices with Filters
// ==========================================

export interface PriceFilters {
  itemQuery?: string
  storeQuery?: string
  inStock?: boolean
  daysAgo?: number
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest'
  page?: number
  limit?: number
}

export interface PriceWithDetails {
  id: number
  item_id: number
  store_id: number
  price: number
  in_stock: number
  package_qty: number
  package_name: string | null
  military_discount_pct: number | null
  last_verified: string
  created_at: string
  // Joined fields
  item_name: string
  store_name: string
  upvotes: number
  downvotes: number
  vote_score: number
}

export interface PricesWithFiltersResult {
  prices: PriceWithDetails[]
  total: number
  page: number
  totalPages: number
}

export async function getPricesWithFilters(
  db: D1Database,
  filters: PriceFilters
): Promise<PricesWithFiltersResult> {
  const {
    itemQuery,
    storeQuery,
    inStock,
    daysAgo,
    sortBy = 'newest',
    page = 1,
    limit = 25,
  } = filters

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (itemQuery) {
    conditions.push('i.name LIKE ?')
    params.push(`%${itemQuery}%`)
  }

  if (storeQuery) {
    conditions.push('s.name LIKE ?')
    params.push(`%${storeQuery}%`)
  }

  if (inStock !== undefined) {
    conditions.push('p.in_stock = ?')
    params.push(inStock ? 1 : 0)
  }

  if (daysAgo !== undefined && daysAgo > 0) {
    conditions.push("p.last_verified >= datetime('now', '-' || ? || ' days')")
    params.push(daysAgo)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Determine sort
  let orderBy: string
  switch (sortBy) {
    case 'price_asc':
      orderBy = 'p.price ASC'
      break
    case 'price_desc':
      orderBy = 'p.price DESC'
      break
    case 'oldest':
      orderBy = 'p.last_verified ASC'
      break
    case 'newest':
    default:
      orderBy = 'p.last_verified DESC'
      break
  }

  // Get total count
  const countResult = await db
    .prepare(`
      SELECT COUNT(*) as count
      FROM prices p
      JOIN items i ON p.item_id = i.id
      JOIN stores s ON p.store_id = s.id
      ${whereClause}
    `)
    .bind(...params)
    .first<{ count: number }>()

  const total = countResult?.count ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  // Get prices with full details
  const pricesResult = await db
    .prepare(`
      SELECT
        p.id,
        p.item_id,
        p.store_id,
        p.price,
        p.in_stock,
        COALESCE(p.package_qty, 1) as package_qty,
        p.package_name,
        p.military_discount_pct,
        p.last_verified,
        p.created_at,
        i.name as item_name,
        s.name as store_name,
        COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as vote_score
      FROM prices p
      JOIN items i ON p.item_id = i.id
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN votes v ON p.id = v.price_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `)
    .bind(...params, limit, offset)
    .all<PriceWithDetails>()

  return {
    prices: pricesResult.results,
    total,
    page,
    totalPages,
  }
}

export async function getPriceById(
  db: D1Database,
  id: number
): Promise<PriceWithDetails | null> {
  const result = await db
    .prepare(`
      SELECT
        p.id,
        p.item_id,
        p.store_id,
        p.price,
        p.in_stock,
        COALESCE(p.package_qty, 1) as package_qty,
        p.package_name,
        p.military_discount_pct,
        p.last_verified,
        p.created_at,
        i.name as item_name,
        s.name as store_name,
        COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as vote_score
      FROM prices p
      JOIN items i ON p.item_id = i.id
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN votes v ON p.id = v.price_id
      WHERE p.id = ?
      GROUP BY p.id
    `)
    .bind(id)
    .first<PriceWithDetails>()

  return result
}

export async function updatePrice(
  db: D1Database,
  id: number,
  data: {
    price?: number
    in_stock?: number
    package_qty?: number
    package_name?: string | null
    military_discount_pct?: number | null
  }
): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.price !== undefined) {
    fields.push('price = ?')
    values.push(data.price)
  }
  if (data.in_stock !== undefined) {
    fields.push('in_stock = ?')
    values.push(data.in_stock)
  }
  if (data.package_qty !== undefined) {
    fields.push('package_qty = ?')
    values.push(data.package_qty)
  }
  if (data.package_name !== undefined) {
    fields.push('package_name = ?')
    values.push(data.package_name)
  }
  if (data.military_discount_pct !== undefined) {
    fields.push('military_discount_pct = ?')
    values.push(data.military_discount_pct)
  }

  if (fields.length === 0) return

  fields.push("last_verified = datetime('now')")
  values.push(id)

  await db
    .prepare(`UPDATE prices SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()
}

export async function deletePrice(db: D1Database, id: number): Promise<void> {
  // Delete associated votes first
  await db.prepare('DELETE FROM votes WHERE price_id = ?').bind(id).run()
  // Then delete the price
  await db.prepare('DELETE FROM prices WHERE id = ?').bind(id).run()
}

export async function bulkVerifyPrices(
  db: D1Database,
  ids: number[]
): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  await db
    .prepare(`UPDATE prices SET last_verified = datetime('now') WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run()
}

export async function getVotesForPrice(
  db: D1Database,
  priceId: number
): Promise<{ upvotes: number; downvotes: number; score: number }> {
  const result = await db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
      FROM votes
      WHERE price_id = ?
    `)
    .bind(priceId)
    .first<{ upvotes: number; downvotes: number }>()

  const upvotes = result?.upvotes ?? 0
  const downvotes = result?.downvotes ?? 0

  return {
    upvotes,
    downvotes,
    score: upvotes - downvotes,
  }
}

export async function bulkDeletePrices(
  db: D1Database,
  ids: number[]
): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(',')
  // Delete associated votes first
  await db
    .prepare(`DELETE FROM votes WHERE price_id IN (${placeholders})`)
    .bind(...ids)
    .run()
  // Then delete the prices
  await db
    .prepare(`DELETE FROM prices WHERE id IN (${placeholders})`)
    .bind(...ids)
    .run()
}

export async function getShoppingComparisonV2(
  db: D1Database,
  listId: number,
  baseId: number | null
): Promise<ShoppingComparisonDataV2 | null> {
  // Get list items with unit info and priority
  const listItems = await db
    .prepare(`
      SELECT
        pli.item_id,
        pli.quantity,
        COALESCE(pli.priority, 1) as priority,
        i.name,
        i.category,
        COALESCE(i.unit_name, 'each') as unit_name
      FROM packing_list_items pli
      JOIN items i ON pli.item_id = i.id
      WHERE pli.packing_list_id = ?
    `)
    .bind(listId)
    .all<{ item_id: number; quantity: number; priority: number; name: string; category: string | null; unit_name: string }>()

  if (listItems.results.length === 0) return null

  const itemIds = listItems.results.map((i) => i.item_id)

  // Get stores for this base (or online only)
  const stores = await getStoresByBase(db, baseId)
  const storeIds = stores.map((s) => s.id)

  if (storeIds.length === 0) {
    return {
      items: listItems.results.map((item) => ({
        id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        unitName: item.unit_name,
        priority: item.priority,
        bestPrice: null,
        allPrices: [],
      })),
      stores: [],
      totalBestPrice: 0,
      categories: [...new Set(listItems.results.map((i) => i.category).filter(Boolean))] as string[],
    }
  }

  // Get prices for items at these stores (including package info and military discount)
  const pricesResult = await db
    .prepare(`
      SELECT
        p.item_id,
        p.store_id,
        p.price,
        COALESCE(p.package_qty, 1) as package_qty,
        p.package_name,
        COALESCE(p.price_type, 'regular') as price_type,
        p.military_discount_pct,
        s.name as store_name,
        s.store_type,
        s.is_online,
        COALESCE(s.accepts_military_discount, 0) as accepts_military_discount,
        s.military_discount_pct as store_military_discount_pct,
        COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
        COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
      FROM prices p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN votes v ON p.id = v.price_id
      WHERE p.item_id IN (${itemIds.map(() => '?').join(',')})
        AND p.store_id IN (${storeIds.map(() => '?').join(',')})
      GROUP BY p.id
      ORDER BY p.price ASC
    `)
    .bind(...itemIds, ...storeIds)
    .all<{
      item_id: number
      store_id: number
      price: number
      package_qty: number
      package_name: string | null
      price_type: string
      military_discount_pct: number | null
      store_name: string
      store_type: string | null
      is_online: number
      accepts_military_discount: number
      store_military_discount_pct: number | null
      votes_up: number
      votes_down: number
    }>()

  // Build items with best price and all prices
  // Sort prices by effective price per unit (for better comparison)
  let totalBestPrice = 0
  const items: ShoppingComparisonItem[] = listItems.results.map((item) => {
    const itemPrices: PriceInfo[] = pricesResult.results
      .filter((p) => p.item_id === item.item_id)
      .map((p) => ({
        price: p.price,
        storeId: p.store_id,
        storeName: p.store_name,
        storeType: p.store_type,
        isOnline: p.is_online === 1,
        packageQty: p.package_qty,
        packageName: p.package_name,
        priceType: p.price_type,
        militaryDiscountPct: p.military_discount_pct,
        hasMilitaryDiscount: p.accepts_military_discount === 1,
        votesUp: p.votes_up,
        votesDown: p.votes_down,
      }))
      // Sort by effective cost to buy required quantity (packages needed * package price)
      .sort((a, b) => {
        const packagesNeededA = Math.ceil(item.quantity / a.packageQty)
        const packagesNeededB = Math.ceil(item.quantity / b.packageQty)
        return (packagesNeededA * a.price) - (packagesNeededB * b.price)
      })

    const bestPrice = itemPrices.length > 0 ? itemPrices[0] : null
    if (bestPrice) {
      // Calculate total based on packages needed
      const packagesNeeded = Math.ceil(item.quantity / bestPrice.packageQty)
      totalBestPrice += bestPrice.price * packagesNeeded
    }

    return {
      id: item.item_id,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      unitName: item.unit_name,
      priority: item.priority,
      bestPrice,
      allPrices: itemPrices,
    }
  })

  const categories = [...new Set(listItems.results.map((i) => i.category).filter(Boolean))] as string[]

  return { items, stores, totalBestPrice, categories }
}

// ============================================
// SCHOOL-BASE RELATIONSHIPS (Many-to-Many)
// ============================================

export interface SchoolBaseRow {
  id: number
  school_id: number
  base_id: number
  is_primary: number
  notes: string | null
  created_at: string
  base_name: string
  base_abbreviation: string | null
  base_state: string | null
}

// Get all bases where a school is located
export async function getSchoolBases(db: D1Database, schoolId: number): Promise<SchoolBaseRow[]> {
  const result = await db
    .prepare(`
      SELECT
        sb.*,
        b.name as base_name,
        b.abbreviation as base_abbreviation,
        b.state as base_state
      FROM school_bases sb
      JOIN bases b ON sb.base_id = b.id
      WHERE sb.school_id = ?
      ORDER BY sb.is_primary DESC, b.name ASC
    `)
    .bind(schoolId)
    .all<SchoolBaseRow>()
  return result.results
}

// Get all schools at a specific base
export async function getBaseSchools(db: D1Database, baseId: number): Promise<(School & { is_primary: number; notes: string | null })[]> {
  const result = await db
    .prepare(`
      SELECT
        s.*,
        sb.is_primary,
        sb.notes
      FROM school_bases sb
      JOIN schools s ON sb.school_id = s.id
      WHERE sb.base_id = ?
      ORDER BY sb.is_primary DESC, s.name ASC
    `)
    .bind(baseId)
    .all<School & { is_primary: number; notes: string | null }>()
  return result.results
}

// Add a base to a school
export async function addSchoolBase(
  db: D1Database,
  schoolId: number,
  baseId: number,
  isPrimary: boolean = false,
  notes: string | null = null
): Promise<void> {
  // If setting as primary, first clear other primaries
  if (isPrimary) {
    await db
      .prepare(`UPDATE school_bases SET is_primary = 0 WHERE school_id = ?`)
      .bind(schoolId)
      .run()
  }

  await db
    .prepare(`
      INSERT INTO school_bases (school_id, base_id, is_primary, notes)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(school_id, base_id) DO UPDATE SET
        is_primary = excluded.is_primary,
        notes = excluded.notes
    `)
    .bind(schoolId, baseId, isPrimary ? 1 : 0, notes)
    .run()
}

// Remove a base from a school
export async function removeSchoolBase(db: D1Database, schoolId: number, baseId: number): Promise<void> {
  await db
    .prepare(`DELETE FROM school_bases WHERE school_id = ? AND base_id = ?`)
    .bind(schoolId, baseId)
    .run()
}

// Set primary location for a school
export async function setSchoolPrimaryBase(db: D1Database, schoolId: number, baseId: number): Promise<void> {
  await db.batch([
    db.prepare(`UPDATE school_bases SET is_primary = 0 WHERE school_id = ?`).bind(schoolId),
    db.prepare(`UPDATE school_bases SET is_primary = 1 WHERE school_id = ? AND base_id = ?`).bind(schoolId, baseId),
  ])
}

// ============================================
// PACKING LIST INHERITANCE
// ============================================

// Get child lists that inherit from a parent list
export async function getChildLists(db: D1Database, parentListId: number): Promise<PackingList[]> {
  const result = await db
    .prepare(`
      SELECT pl.*, b.name as base_name, s.name as school_name
      FROM packing_lists pl
      LEFT JOIN bases b ON pl.base_id = b.id
      LEFT JOIN schools s ON pl.school_id = s.id
      WHERE pl.parent_list_id = ?
      ORDER BY b.name ASC
    `)
    .bind(parentListId)
    .all<PackingList & { base_name: string | null; school_name: string | null }>()
  return result.results
}

// Create a child list that inherits from a parent
export async function createChildList(
  db: D1Database,
  parentListId: number,
  baseId: number,
  name: string,
  description: string | null = null
): Promise<number> {
  // Get parent list info
  const parent = await db
    .prepare(`SELECT school_id, type, is_public, contributor_name FROM packing_lists WHERE id = ?`)
    .bind(parentListId)
    .first<{ school_id: number | null; type: string | null; is_public: number; contributor_name: string | null }>()

  if (!parent) throw new Error('Parent list not found')

  // Create child list
  const result = await db
    .prepare(`
      INSERT INTO packing_lists (name, description, type, is_public, contributor_name, school_id, base_id, parent_list_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(name, description, parent.type, parent.is_public, parent.contributor_name, parent.school_id, baseId, parentListId)
    .run()

  const childListId = result.meta.last_row_id as number

  // Copy all items from parent as "inherited"
  await db
    .prepare(`
      INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, added_by, priority, source, override_type)
      SELECT ?, item_id, quantity, notes, added_by, priority, source, 'inherited'
      FROM packing_list_items
      WHERE packing_list_id = ?
    `)
    .bind(childListId, parentListId)
    .run()

  return childListId
}

// Get effective items for a list (merging parent + child overrides)
export async function getEffectiveListItems(
  db: D1Database,
  listId: number
): Promise<PackingListItemWithItem[]> {
  // Get the list to check if it has a parent
  const list = await db
    .prepare(`SELECT parent_list_id FROM packing_lists WHERE id = ?`)
    .bind(listId)
    .first<{ parent_list_id: number | null }>()

  if (!list) return []

  // If no parent, just return the list's items directly
  if (!list.parent_list_id) {
    const result = await db
      .prepare(`
        SELECT
          pli.*,
          i.id as item_id,
          i.name as item_name,
          i.description as item_description,
          i.category as item_category,
          i.asin as item_asin,
          i.image_url as item_image_url,
          COALESCE(i.unit_name, 'each') as item_unit_name,
          i.created_at as item_created_at,
          i.updated_at as item_updated_at
        FROM packing_list_items pli
        JOIN items i ON pli.item_id = i.id
        WHERE pli.packing_list_id = ?
        ORDER BY i.category, i.name
      `)
      .bind(listId)
      .all()

    return result.results.map((row: any) => ({
      id: row.id,
      packing_list_id: row.packing_list_id,
      item_id: row.item_id,
      quantity: row.quantity,
      notes: row.notes,
      added_by: row.added_by,
      priority: row.priority,
      source: row.source,
      override_type: row.override_type,
      created_at: row.created_at,
      item: {
        id: row.item_id,
        name: row.item_name,
        description: row.item_description,
        category: row.item_category,
        asin: row.item_asin,
        image_url: row.item_image_url,
        unit_name: row.item_unit_name,
        created_at: row.item_created_at,
        updated_at: row.item_updated_at,
      },
    }))
  }

  // For child lists: get parent items + apply child overrides
  // Child items with override_type='removed' are excluded
  // Child items with override_type='added' are included
  // Child items with override_type='modified' replace parent values
  const result = await db
    .prepare(`
      WITH parent_items AS (
        SELECT pli.*, i.*
        FROM packing_list_items pli
        JOIN items i ON pli.item_id = i.id
        WHERE pli.packing_list_id = ?
      ),
      child_items AS (
        SELECT pli.*, i.*
        FROM packing_list_items pli
        JOIN items i ON pli.item_id = i.id
        WHERE pli.packing_list_id = ?
      )
      SELECT
        COALESCE(c.id, p.id) as id,
        ? as packing_list_id,
        COALESCE(c.item_id, p.item_id) as item_id,
        COALESCE(c.quantity, p.quantity) as quantity,
        COALESCE(c.notes, p.notes) as notes,
        COALESCE(c.added_by, p.added_by) as added_by,
        COALESCE(c.priority, p.priority) as priority,
        COALESCE(c.source, p.source) as source,
        COALESCE(c.override_type, 'inherited') as override_type,
        COALESCE(c.created_at, p.created_at) as created_at,
        COALESCE(c.name, p.name) as item_name,
        COALESCE(c.description, p.description) as item_description,
        COALESCE(c.category, p.category) as item_category,
        COALESCE(c.asin, p.asin) as item_asin,
        COALESCE(c.image_url, p.image_url) as item_image_url,
        COALESCE(c.unit_name, p.unit_name, 'each') as item_unit_name
      FROM parent_items p
      LEFT JOIN child_items c ON p.item_id = c.item_id
      WHERE COALESCE(c.override_type, 'inherited') != 'removed'

      UNION

      -- Items added only in child (not in parent)
      SELECT
        c.id,
        c.packing_list_id,
        c.item_id,
        c.quantity,
        c.notes,
        c.added_by,
        c.priority,
        c.source,
        c.override_type,
        c.created_at,
        c.name as item_name,
        c.description as item_description,
        c.category as item_category,
        c.asin as item_asin,
        c.image_url as item_image_url,
        COALESCE(c.unit_name, 'each') as item_unit_name
      FROM child_items c
      WHERE c.override_type = 'added'
        AND c.item_id NOT IN (SELECT item_id FROM parent_items)

      ORDER BY item_category, item_name
    `)
    .bind(list.parent_list_id, listId, listId)
    .all()

  return result.results.map((row: any) => ({
    id: row.id,
    packing_list_id: row.packing_list_id,
    item_id: row.item_id,
    quantity: row.quantity,
    notes: row.notes,
    added_by: row.added_by,
    priority: row.priority,
    source: row.source,
    override_type: row.override_type,
    created_at: row.created_at,
    item: {
      id: row.item_id,
      name: row.item_name,
      description: row.item_description,
      category: row.item_category,
      asin: row.item_asin,
      image_url: row.item_image_url,
      unit_name: row.item_unit_name,
      created_at: '',
      updated_at: '',
    },
  }))
}

// Add item override in child list (add, remove, or modify)
export async function addChildListItemOverride(
  db: D1Database,
  listId: number,
  itemId: number,
  overrideType: 'added' | 'removed' | 'modified',
  data?: { quantity?: number; notes?: string; priority?: number }
): Promise<void> {
  if (overrideType === 'removed') {
    // Mark item as removed in child
    await db
      .prepare(`
        INSERT INTO packing_list_items (packing_list_id, item_id, quantity, override_type)
        VALUES (?, ?, 0, 'removed')
        ON CONFLICT DO UPDATE SET override_type = 'removed'
      `)
      .bind(listId, itemId)
      .run()
  } else if (overrideType === 'added') {
    // Add new item to child
    await db
      .prepare(`
        INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, priority, override_type)
        VALUES (?, ?, ?, ?, ?, 'added')
      `)
      .bind(listId, itemId, data?.quantity || 1, data?.notes || null, data?.priority || 2)
      .run()
  } else if (overrideType === 'modified') {
    // Modify inherited item in child
    await db
      .prepare(`
        UPDATE packing_list_items
        SET quantity = COALESCE(?, quantity),
            notes = COALESCE(?, notes),
            priority = COALESCE(?, priority),
            override_type = 'modified'
        WHERE packing_list_id = ? AND item_id = ?
      `)
      .bind(data?.quantity, data?.notes, data?.priority, listId, itemId)
      .run()
  }
}

// Get schools with their base locations
export async function getSchoolsWithBases(db: D1Database): Promise<(School & { bases: SchoolBaseRow[] })[]> {
  const schools = await db.prepare(`SELECT * FROM schools ORDER BY name`).all<School>()

  const schoolsWithBases = await Promise.all(
    schools.results.map(async (school) => {
      const bases = await getSchoolBases(db, school.id)
      return { ...school, bases }
    })
  )

  return schoolsWithBases
}

// Get packing lists for a school, optionally filtered by base
export async function getSchoolPackingLists(
  db: D1Database,
  schoolId: number,
  baseId?: number
): Promise<PackingList[]> {
  if (baseId) {
    // Get location-specific list if exists, otherwise generic
    const specific = await db
      .prepare(`
        SELECT * FROM packing_lists
        WHERE school_id = ? AND base_id = ? AND is_public = 1
        ORDER BY created_at DESC
      `)
      .bind(schoolId, baseId)
      .all<PackingList>()

    if (specific.results.length > 0) {
      return specific.results
    }

    // Fall back to generic (no base_id)
    const generic = await db
      .prepare(`
        SELECT * FROM packing_lists
        WHERE school_id = ? AND base_id IS NULL AND is_public = 1
        ORDER BY created_at DESC
      `)
      .bind(schoolId)
      .all<PackingList>()

    return generic.results
  }

  // No base specified - return all lists for school
  const all = await db
    .prepare(`
      SELECT * FROM packing_lists
      WHERE school_id = ? AND is_public = 1
      ORDER BY base_id IS NULL DESC, created_at DESC
    `)
    .bind(schoolId)
    .all<PackingList>()

  return all.results
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

// ─── TIPS (Life Pro Tips) ──────────────────────────────────────────────

export async function getTipsForList(
  db: D1Database,
  packingListId: number
): Promise<TipWithVotes[]> {
  const results = await db.prepare(`
    SELECT
      t.*,
      i.name as item_name,
      pl.name as list_name,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
    FROM tips t
    LEFT JOIN items i ON t.item_id = i.id
    JOIN packing_lists pl ON t.packing_list_id = pl.id
    LEFT JOIN tip_votes tv ON t.id = tv.tip_id
    WHERE t.packing_list_id = ? AND t.approved = 1
    GROUP BY t.id
    ORDER BY (COALESCE(SUM(CASE WHEN tv.vote_type = 'up' THEN 1 ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN tv.vote_type = 'down' THEN 1 ELSE 0 END), 0)) DESC, t.created_at DESC
  `).bind(packingListId).all<TipWithVotes>()
  return results.results
}

export async function getTipById(
  db: D1Database,
  tipId: number
): Promise<TipWithVotes | null> {
  const result = await db.prepare(`
    SELECT
      t.*,
      i.name as item_name,
      pl.name as list_name,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
    FROM tips t
    LEFT JOIN items i ON t.item_id = i.id
    JOIN packing_lists pl ON t.packing_list_id = pl.id
    LEFT JOIN tip_votes tv ON t.id = tv.tip_id
    WHERE t.id = ?
    GROUP BY t.id
  `).bind(tipId).first<TipWithVotes>()
  return result
}

export async function createTip(
  db: D1Database,
  data: {
    packing_list_id: number
    item_id?: number | null
    title: string
    body: string
    compliance_status: 'allowed' | 'tolerated' | 'not_allowed'
    contributor_name?: string | null
  }
): Promise<Tip> {
  const result = await db.prepare(`
    INSERT INTO tips (packing_list_id, item_id, title, body, compliance_status, contributor_name)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(
    data.packing_list_id,
    data.item_id ?? null,
    data.title,
    data.body,
    data.compliance_status,
    data.contributor_name ?? null
  ).first<Tip>()
  return result!
}

export async function voteOnTip(
  db: D1Database,
  tipId: number,
  voteType: 'up' | 'down',
  voterIp?: string | null
): Promise<void> {
  await db.prepare(`
    INSERT OR IGNORE INTO tip_votes (tip_id, vote_type, voter_ip)
    VALUES (?, ?, ?)
  `).bind(tipId, voteType, voterIp ?? null).run()
}

export async function deleteTip(
  db: D1Database,
  tipId: number
): Promise<void> {
  await db.prepare('DELETE FROM tips WHERE id = ?').bind(tipId).run()
}

export async function updateTipApproval(
  db: D1Database,
  tipId: number,
  approved: number
): Promise<void> {
  await db.prepare('UPDATE tips SET approved = ? WHERE id = ?').bind(approved, tipId).run()
}

export async function getTipsForAdmin(
  db: D1Database,
  filters: {
    search?: string
    compliance_status?: string
    approved?: string
    packing_list_id?: number
    page?: number
    per_page?: number
  }
): Promise<{ tips: TipWithVotes[]; total: number }> {
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (filters.search) {
    conditions.push('(t.title LIKE ? OR t.body LIKE ?)')
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }
  if (filters.compliance_status) {
    conditions.push('t.compliance_status = ?')
    params.push(filters.compliance_status)
  }
  if (filters.approved !== undefined && filters.approved !== '') {
    conditions.push('t.approved = ?')
    params.push(parseInt(filters.approved))
  }
  if (filters.packing_list_id) {
    conditions.push('t.packing_list_id = ?')
    params.push(filters.packing_list_id)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const page = filters.page || 1
  const perPage = filters.per_page || 25
  const offset = (page - 1) * perPage

  // Count query — bind order: ...condition params
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM tips t ${whereClause}
  `).bind(...params).first<{ total: number }>()

  // Data query — bind order: ...condition params, perPage, offset
  const results = await db.prepare(`
    SELECT
      t.*,
      i.name as item_name,
      pl.name as list_name,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as votes_up,
      COALESCE(SUM(CASE WHEN tv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as votes_down
    FROM tips t
    LEFT JOIN items i ON t.item_id = i.id
    JOIN packing_lists pl ON t.packing_list_id = pl.id
    LEFT JOIN tip_votes tv ON t.id = tv.tip_id
    ${whereClause}
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, perPage, offset).all<TipWithVotes>()

  return { tips: results.results, total: countResult?.total || 0 }
}

export async function getTipCountForList(
  db: D1Database,
  packingListId: number
): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM tips WHERE packing_list_id = ? AND approved = 1'
  ).bind(packingListId).first<{ count: number }>()
  return result?.count || 0
}

