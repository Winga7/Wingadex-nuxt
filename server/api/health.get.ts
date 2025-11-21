/**
 * Health check endpoint
 * GET /api/health
 */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: config.databaseUrl ? 'configured' : 'not configured',
    auth: config.authSecret ? 'configured' : 'not configured',
    message: 'Wingadex API is running! 🚀'
  }
})

