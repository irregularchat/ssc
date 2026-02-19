import { Hono } from 'hono'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// POST /api/submissions — Submit a new building
app.post('/', async (c) => {
  const body = await c.req.json()

  const { installation_id, building_number, latitude, longitude } = body
  if (!installation_id || !building_number || latitude == null || longitude == null) {
    return c.json({ error: 'installation_id, building_number, latitude, longitude are required' }, 400)
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return c.json({ error: 'Invalid coordinates' }, 400)
  }

  // Verify installation exists
  const installation = await c.env.DB.prepare(
    'SELECT id FROM installations WHERE id = ?'
  ).bind(installation_id).first()
  if (!installation) {
    return c.json({ error: 'Installation not found' }, 404)
  }

  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO submissions (id, installation_id, building_number, name, description, latitude, longitude, category, submitted_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    id,
    installation_id,
    building_number,
    body.name || null,
    body.description || null,
    latitude,
    longitude,
    body.category || null,
    body.submitted_by || null,
  ).run()

  return c.json({ data: { id, status: 'pending' }, message: 'Submission received — it will be reviewed before going live.' }, 201)
})

// GET /api/submissions — List submissions (admin)
app.get('/', async (c) => {
  const status = c.req.query('status') || 'pending'
  const results = await c.env.DB.prepare(
    'SELECT * FROM submissions WHERE status = ? ORDER BY created_at DESC LIMIT 100'
  ).bind(status).all()
  return c.json({ data: results.results })
})

// PUT /api/submissions/:id — Approve or reject (admin)
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { status, reviewer_notes } = body

  if (!status || !['approved', 'rejected'].includes(status)) {
    return c.json({ error: 'status must be "approved" or "rejected"' }, 400)
  }

  const submission = await c.env.DB.prepare(
    'SELECT * FROM submissions WHERE id = ?'
  ).bind(id).first<{
    id: string; installation_id: string; building_number: string; name: string | null;
    description: string | null; latitude: number; longitude: number; category: string | null;
  }>()

  if (!submission) return c.json({ error: 'Submission not found' }, 404)

  // Update submission status
  await c.env.DB.prepare(`
    UPDATE submissions SET status = ?, reviewer_notes = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(status, reviewer_notes || null, id).run()

  // If approved, insert into buildings table
  if (status === 'approved') {
    const buildingId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO buildings (id, installation_id, building_number, name, description, latitude, longitude, category, verified, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'community')
    `).bind(
      buildingId,
      submission.installation_id,
      submission.building_number,
      submission.name,
      submission.description,
      submission.latitude,
      submission.longitude,
      submission.category,
    ).run()
  }

  return c.json({ data: { id, status }, message: `Submission ${status}` })
})

export default app
