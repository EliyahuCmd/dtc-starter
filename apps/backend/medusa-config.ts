import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Redis is used only when REDIS_URL is set; otherwise Medusa falls back
// to its in-memory defaults (fine for local development).
const REDIS_URL = process.env.REDIS_URL

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    ...(REDIS_URL ? { redisUrl: REDIS_URL } : {}),
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: REDIS_URL
    ? [
        {
          resolve: '@medusajs/medusa/event-bus-redis',
          options: { redisUrl: REDIS_URL },
        },
      ]
    : [],
})
