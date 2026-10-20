import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import stockHandler from './api/stock.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.ALPHA_VANTAGE_API_KEY) process.env.ALPHA_VANTAGE_API_KEY = env.ALPHA_VANTAGE_API_KEY

  return {
    plugins: [react(), {
      name: 'local-stock-api',
      configureServer(server) {
        server.middlewares.use('/api/stock', async (req, res, next) => {
          const url = new URL(req.url, 'http://localhost')
          if (url.pathname !== '/' && url.pathname !== '') return next()
          req.query = Object.fromEntries(url.searchParams)
          res.status = (status) => { res.statusCode = status; return res }
          res.json = (body) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }
          try { await stockHandler(req, res) }
          catch { res.status(500).json({ error: 'Nepavyko gauti akcijų kainos.' }) }
        })
      },
    }],
  }
})
