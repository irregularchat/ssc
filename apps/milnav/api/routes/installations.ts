import { Hono } from 'hono'
import type { Bindings } from '../types'
import { queryAll, queryFirst } from '@ssc/cloudflare-utils'
import type { Installation } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// GET /api/installations — List all
app.get('/', async (c) => {
  const data = await queryAll<Installation>(c.env.DB, 'SELECT * FROM installations ORDER BY name')
  return c.json({ data })
})

// GET /api/installations/:slug — Single installation
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const data = await queryFirst<Installation>(c.env.DB, 'SELECT * FROM installations WHERE slug = ?', [slug])
  if (!data) return c.json({ error: 'Installation not found' }, 404)
  return c.json({ data })
})

export default app
