import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'
import installationsRouter from './routes/installations'
import buildingsRouter from './routes/buildings'
import submissionsRouter from './routes/submissions'

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Routes
app.route('/api/installations', installationsRouter)
app.route('/api/buildings', buildingsRouter)
app.route('/api/submissions', submissionsRouter)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'milnav' }))

export default app
