import http from 'http'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { config, isDevSecret } from './config'
import { getStore, initStore } from './db'
import { authRouter } from './routes/auth'
import { tripsRouter } from './routes/trips'
import { usersRouter } from './routes/users'
import { notificationsRouter } from './routes/notifications'
import { attachSocket } from './socket'

const startedAt = Date.now()

export function createApp() {
  const app = express()
  app.use(cors({ origin: config.corsOrigins, credentials: true }))
  app.use(express.json({ limit: '256kb' }))

  app.get('/health', async (_req: Request, res: Response) => {
    const store = getStore()
    res.json({
      status: 'ok',
      service: 'ridesync-server',
      mode: store.mode,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      users: await store.countUsers(),
      trips: await store.countTrips(),
    })
  })

  app.use('/api/auth', authRouter())
  app.use('/api/trips', tripsRouter())
  app.use('/api/users', usersRouter())
  app.use('/api/notifications', notificationsRouter())

  app.use((_req: Request, res: Response) => res.status(404).json({ error: 'Not found.' }))
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[ridesync] error', err)
    res.status(500).json({ error: 'Internal server error.' })
  })
  return app
}

async function main(): Promise<void> {
  const store = await initStore()
  if (isDevSecret) {
    console.warn('[ridesync] WARNING: JWT_SECRET is not set — using a dev-only fallback secret. Set JWT_SECRET in production.')
  }
  const app = createApp()
  const server = http.createServer(app)
  attachSocket(server)
  server.listen(config.port, () => {
    console.log(`[ridesync] listening on http://localhost:${config.port} (mode: ${store.mode})`)
    console.log(`[ridesync] health: http://localhost:${config.port}/health`)
    console.log(`[ridesync] CORS origins: ${config.corsOrigins.join(', ')}`)
    if (store.mode === 'memory') {
      console.log('[ridesync] demo login: demo@ridesync.app / ridesync123 — Manali convoy code A1B2C9')
    }
  })
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[ridesync] failed to start', err)
    process.exit(1)
  })
}
