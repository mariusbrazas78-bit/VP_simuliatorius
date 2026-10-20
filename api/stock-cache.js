// Best-effort cache per server instance; never persists API keys.
export function withStockCache(handler, {
  ttlMs = 24 * 60 * 60 * 1000,
  backoffMs = 15 * 60 * 1000,
  now = Date.now,
  initialQuotes = [],
} = {}) {
  const cache = new Map()
  const pending = new Map()
  let limitedUntil = 0

  for (const { fetchedAt, body } of initialQuotes) {
    if (Number.isFinite(fetchedAt) && fetchedAt <= now() && fetchedAt + ttlMs > now() &&
        ['AAPL', 'MSFT', 'TSLA'].includes(body?.symbol) && body.currency === 'EUR' &&
        Number.isFinite(body.price) && body.price > 0 && Number.isFinite(Date.parse(body.updatedAt))) {
      cache.set(body.symbol, { body, expiresAt: fetchedAt + ttlMs })
    }
  }

  return async function cachedHandler(req, res) {
    // CDN storage survives function instance shutdowns. Never cache errors.
    const send = (status, body, remainingMs = ttlMs) => {
      const valid = status === 200 && body?.currency === 'EUR' &&
        Number.isFinite(body.price) && body.price > 0
      res.setHeader?.('Cache-Control', valid
        ? 'public, max-age=0, must-revalidate'
        : 'no-store')
      res.setHeader?.('Vercel-CDN-Cache-Control', valid
        ? `public, s-maxage=${Math.max(0, Math.floor(remainingMs / 1000))}`
        : 'no-store')
      return res.status(status).json(body)
    }
    const symbol = String(req.query.symbol || '').toUpperCase()
    if (!['AAPL', 'MSFT', 'TSLA'].includes(symbol)) {
      res.setHeader?.('Cache-Control', 'no-store')
      return handler(req, res)
    }

    const cached = cache.get(symbol)
    if (cached && cached.expiresAt > now()) return send(200, cached.body, cached.expiresAt - now())
    if (limitedUntil > now()) {
      return send(429, {
        error: 'Kainų tiekėjo užklausų limitas pasiektas. Palaukite ir bandykite vėliau.',
      })
    }

    let request = pending.get(symbol)
    if (!request) {
      request = (async () => {
        let status = 200
        let body
        await handler(req, {
          status(value) { status = value; return this },
          json(value) { body = value; return value },
        })
        if (status === 200 && body?.symbol === symbol && body?.currency === 'EUR' &&
            Number.isFinite(body.price) && body.price > 0) {
          cache.set(symbol, { body, expiresAt: now() + ttlMs })
        }
        if (status === 429) limitedUntil = now() + backoffMs
        return { status, body }
      })()
      pending.set(symbol, request)
    }

    try {
      const result = await request
      return send(result.status, result.body)
    } finally {
      if (pending.get(symbol) === request) pending.delete(symbol)
    }
  }
}
