import type { D1Database } from '@cloudflare/workers-types'
import type { Item, Store } from '~/types/database'

// ==========================================
// Admin Dashboard Stats
// ==========================================

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
