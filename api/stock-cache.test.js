import assert from 'node:assert/strict'
import test from 'node:test'
import { withStockCache } from './stock-cache.js'

async function invoke(handler, symbol = 'AAPL') {
  let status
  let body
  const headers = {}
  await handler({ query: { symbol } }, {
    setHeader(name, value) { headers[name] = value },
    status(value) { status = value; return this },
    json(value) { body = value },
  })
  return { status, body, headers }
}

test('deduplicates concurrent requests and caches successful EUR quotes', async () => {
  let calls = 0
  const handler = withStockCache(async (req, res) => {
    calls++
    await Promise.resolve()
    return res.status(200).json({ symbol: req.query.symbol, currency: 'EUR', price: 100 })
  })
  const results = await Promise.all([invoke(handler), invoke(handler)])
  assert.equal(results[0].body.price, 100)
  assert.equal(results[0].headers['Vercel-CDN-Cache-Control'], 'public, s-maxage=86400')
  assert.deepEqual(results[0], results[1])
  await invoke(handler)
  assert.equal(calls, 1)
})

test('refreshes an expired price instead of keeping it indefinitely', async () => {
  let time = 0
  let calls = 0
  const handler = withStockCache((req, res) => {
    calls++
    res.status(200).json({ symbol: req.query.symbol, currency: 'EUR', price: calls })
  }, { now: () => time, ttlMs: 100 })
  await invoke(handler)
  time = 101
  assert.equal((await invoke(handler)).body.price, 2)
})

test('backs off for all symbols after a provider limit without caching the failure', async () => {
  let time = 0
  let calls = 0
  const handler = withStockCache((req, res) => {
    calls++
    res.status(429).json({ error: 'Provider limit' })
  }, { now: () => time, backoffMs: 100 })
  await invoke(handler)
  assert.equal((await invoke(handler, 'MSFT')).status, 429)
  assert.equal(calls, 1)
  time = 101
  await invoke(handler, 'MSFT')
  assert.equal(calls, 2)
})

test('does not cache ordinary server failures', async () => {
  let calls = 0
  const handler = withStockCache((req, res) => {
    calls++
    res.status(500).json({ error: 'Unavailable' })
  })
  const result = await invoke(handler)
  assert.equal(result.headers['Cache-Control'], 'no-store')
  assert.equal(result.headers['Vercel-CDN-Cache-Control'], 'no-store')
  await invoke(handler)
  assert.equal(calls, 2)
})

test('new instances reuse saved quotes only until their original expiry', async () => {
  let time = 60000
  let calls = 0
  const options = {
    now: () => time,
    ttlMs: 120000,
    initialQuotes: [{ fetchedAt: 0, body: {
      symbol: 'AAPL', currency: 'EUR', price: 100, updatedAt: '2026-10-19',
    } }],
  }
  const provider = (req, res) => {
    calls++
    return res.status(429).json({ error: 'Provider limit' })
  }
  const first = await invoke(withStockCache(provider, options))
  assert.equal(first.status, 200)
  assert.equal(first.headers['Vercel-CDN-Cache-Control'], 'public, s-maxage=60')
  time = 90000
  const restarted = await invoke(withStockCache(provider, options))
  assert.equal(restarted.status, 200)
  assert.equal(restarted.headers['Vercel-CDN-Cache-Control'], 'public, s-maxage=30')
  assert.equal(calls, 0)
  time = 120001
  assert.equal((await invoke(withStockCache(provider, options))).status, 429)
  assert.equal(calls, 1)
})
