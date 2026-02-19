import { Hono } from 'hono'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// GET /api/installations — List all
app.get('/', async (c) => {
  const results = await c.env.DB.prepare(
    'SELECT * FROM installations ORDER BY name'
  ).all()
  return c.json({ data: results.results })
})

// GET /api/installations/:slug — Single installation
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const result = await c.env.DB.prepare(
    'SELECT * FROM installations WHERE slug = ?'
  ).bind(slug).first()

  if (!result) return c.json({ error: 'Installation not found' }, 404)
  return c.json({ data: result })
})

export default app
