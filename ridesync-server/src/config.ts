import 'dotenv/config'

function env(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

export const config = {
  port: Number(env('PORT', '4000')),
  mongodbUri: env('MONGODB_URI', ''),
  jwtSecret: env('JWT_SECRET', ''),
  jwtExpiresIn: '7d',
  corsOrigins: env(
    'CORS_ORIGIN',
    'http://localhost:5173,http://localhost:3000,https://ridesync-ten.vercel.app',
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  clientUrl: env('CLIENT_URL', 'http://localhost:5173'),
  nodeEnv: env('NODE_ENV', 'development'),
}

export const isDevSecret = !config.jwtSecret
/** Dev-only fallback. Never use in production — set JWT_SECRET. */
export const jwtSecret = config.jwtSecret || 'ridesync-dev-secret-change-me'
