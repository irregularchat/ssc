import type { D1Database } from '@cloudflare/workers-types'
import type { Store, PriceWithStore } from '~/types/database'
import { getStoresByBase } from './stores.server'

// ==========================================
// Prices CRUD
// ==========================================

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
