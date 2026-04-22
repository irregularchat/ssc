import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { SSC_DEV_ORIGINS } from '@ssc/cloudflare-utils'
import type { Bindings } from './types'
import installationsRouter from './routes/installations'
import buildingsRouter from './routes/buildings'
import submissionsRouter from './routes/submissions'

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/api/*', cors({
  origin: [...SSC_DEV_ORIGINS],
  credentials: true,
}))

// Routes
app.route('/api/installations', installationsRouter)
app.route('/api/buildings', buildingsRouter)
app.route('/api/submissions', submissionsRouter)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'milnav' }))

export default app
