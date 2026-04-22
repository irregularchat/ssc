import type { D1Database } from '@cloudflare/workers-types'

export function getDB(context: { cloudflare: { env: { DB: D1Database } } }) {
  return context.cloudflare.env.DB
}

// Re-export everything from domain modules so existing route imports don't break
export * from './db/lists.server'
export * from './db/items.server'
export * from './db/stores.server'
export * from './db/prices.server'
export * from './db/schools.server'
export * from './db/bases.server'
export * from './db/tips.server'
export * from './db/admin.server'
