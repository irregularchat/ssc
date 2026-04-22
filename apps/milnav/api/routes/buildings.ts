import { Hono } from 'hono'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// GET /api/buildings — List buildings for an installation
app.get('/', async (c) => {
  const installation = c.req.query('installation')
  if (!installation) {
    return c.json({ error: 'installation query parameter required' }, 400)
  }

  const category = c.req.query('category')
  const limit = Math.min(parseInt(c.req.query('limit') || '500'), 10000)
  const offset = parseInt(c.req.query('offset') || '0')

  let query = 'SELECT * FROM buildings WHERE installation_id = ?'
  const params: (string | number)[] = [installation]

  if (category && category !== 'all') {
    query += ' AND category = ?'
    params.push(category)
  }

  query += ' ORDER BY building_number ASC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const results = await c.env.DB.prepare(query).bind(...params).all()

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM buildings WHERE installation_id = ?'
  const countParams: (string | number)[] = [installation]
  if (category && category !== 'all') {
    countQuery += ' AND category = ?'
    countParams.push(category)
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>()

  return c.json({
    data: results.results,
    count: results.results.length,
    total: countResult?.total || 0,
    pagination: { limit, offset, hasMore: offset + limit < (countResult?.total || 0) },
  })
})

// GET /api/buildings/search — Search by building number or name
app.get('/search', async (c) => {
  const q = c.req.query('q')
  const installation = c.req.query('installation')

  if (!q) return c.json({ error: 'q query parameter required' }, 400)
  if (!installation) return c.json({ error: 'installation query parameter required' }, 400)

  const searchTerm = `%${q}%`
  const results = await c.env.DB.prepare(`
    SELECT * FROM buildings
    WHERE installation_id = ?
      AND (building_number LIKE ? OR name LIKE ? OR description LIKE ? OR address LIKE ? OR mgrs LIKE ? OR plus_code LIKE ?)
    ORDER BY
      CASE WHEN building_number = ? THEN 0
           WHEN mgrs = ? THEN 0
           WHEN plus_code = ? THEN 0
           WHEN building_number LIKE ? THEN 1
           WHEN mgrs LIKE ? THEN 1
           WHEN plus_code LIKE ? THEN 1
           ELSE 2 END,
      building_number ASC
    LIMIT 20
  `).bind(installation, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, q, q.toUpperCase(), q.toUpperCase(), `${q}%`, `${q.toUpperCase()}%`, `${q.toUpperCase()}%`).all()

  return c.json({ data: results.results, count: results.results.length })
})

// GET /api/buildings/categories — Category counts for an installation
app.get('/categories', async (c) => {
  const installation = c.req.query('installation')
  if (!installation) {
    return c.json({ error: 'installation query parameter required' }, 400)
  }

  const results = await c.env.DB.prepare(`
    SELECT category, COUNT(*) as count
    FROM buildings
    WHERE installation_id = ?
    GROUP BY category
    ORDER BY count DESC
  `).bind(installation).all()

  return c.json({ data: results.results })
})

// GET /api/buildings/:id — Single building
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    'SELECT * FROM buildings WHERE id = ?'
  ).bind(id).first()

  if (!result) return c.json({ error: 'Building not found' }, 404)
  return c.json({ data: result })
})

// GET /api/buildings/:id/w3w — Get what3words address (lazy convert + cache)
app.get('/:id/w3w', async (c) => {
  const id = c.req.param('id')
  const building = await c.env.DB.prepare(
    'SELECT id, building_number, latitude, longitude, w3w_address FROM buildings WHERE id = ?'
  ).bind(id).first<{ id: string; building_number: string; latitude: number; longitude: number; w3w_address: string | null }>()

  if (!building) return c.json({ error: 'Building not found' }, 404)

  // Return cached w3w address if we have it
  if (building.w3w_address) {
    return c.json({
      data: {
        w3w_address: building.w3w_address,
        url: `https://what3words.com/${building.w3w_address}`,
        short_url: `https://w3w.co/${building.w3w_address}`,
      }
    })
  }

  // No API key configured — return null gracefully
  const apiKey = c.env.W3W_API_KEY
  if (!apiKey) {
    return c.json({
      data: { w3w_address: null, error: 'what3words API key not configured' }
    })
  }

  // Call what3words API to convert coordinates
  try {
    const res = await fetch(
      `https://api.what3words.com/v3/convert-to-3wa?key=${apiKey}&coordinates=${building.latitude},${building.longitude}&language=en&format=json`
    )
    if (!res.ok) {
      const err = await res.text()
      return c.json({ data: { w3w_address: null, error: `w3w API error: ${res.status}` } })
    }

    const data = await res.json<{ words: string }>()
    const w3wAddress = data.words

    // Cache in D1 so we never call the API for this building again
    await c.env.DB.prepare(
      'UPDATE buildings SET w3w_address = ? WHERE id = ?'
    ).bind(w3wAddress, building.id).run()

    return c.json({
      data: {
        w3w_address: w3wAddress,
        url: `https://what3words.com/${w3wAddress}`,
        short_url: `https://w3w.co/${w3wAddress}`,
      }
    })
  } catch (err) {
    return c.json({ data: { w3w_address: null, error: 'Failed to fetch w3w address' } })
  }
})

// GET /api/buildings/:id/directions — Navigation deep links
app.get('/:id/directions', async (c) => {
  const id = c.req.param('id')
  const building = await c.env.DB.prepare(
    'SELECT building_number, name, latitude, longitude FROM buildings WHERE id = ?'
  ).bind(id).first<{ building_number: string; name: string | null; latitude: number; longitude: number }>()

  if (!building) return c.json({ error: 'Building not found' }, 404)

  const { latitude, longitude } = building

  return c.json({
    data: {
      building_number: building.building_number,
      name: building.name,
      latitude,
      longitude,
      directions: {
        google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        apple: `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
        waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
      }
    }
  })
})

export default app
