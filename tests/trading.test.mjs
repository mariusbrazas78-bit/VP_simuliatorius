import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { getStockQuote, validateQuote, validateTrade } from '../src/lib/stocks.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('accepts only supported symbols and BUY/SELL', () => {
  validateTrade({ symbol: 'TSLA', type: 'SELL', quantity: 1 })
  assert.throws(() => validateTrade({ symbol: 'NVDA', type: 'BUY', quantity: 1 }))
  assert.throws(() => validateTrade({ symbol: 'AAPL', type: 'TRANSFER', quantity: 1 }))
})

test('rejects fractions, zero, negative, unsafe and nonnumeric quantities', () => {
  for (const quantity of [0, -1, 1.5, '2', NaN, Infinity, 2147483648, null]) {
    assert.throws(() => validateTrade({ symbol: 'AAPL', type: 'BUY', quantity }))
  }
})

test('rejects prices with wrong currency, symbol or missing update time', () => {
  const quote = { symbol: 'AAPL', price: 100, currency: 'EUR', updatedAt: '2026-10-16' }
  assert.equal(validateQuote(quote, 'AAPL'), quote)
  for (const change of [{ currency: 'USD' }, { symbol: 'TSLA' }, { price: 0 }, { price: '100' }, { updatedAt: null }]) {
    assert.throws(() => validateQuote({ ...quote, ...change }, 'AAPL'))
  }
})

test('passes selected symbol and abort signal to the API', async () => {
  const controller = new AbortController()
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/stock?symbol=TSLA')
    assert.equal(options.signal, controller.signal)
    return Response.json({ symbol: 'TSLA', price: 150, currency: 'EUR', updatedAt: '2026-10-16' })
  }
  assert.equal((await getStockQuote('TSLA', { signal: controller.signal })).price, 150)
})

test('shows the provider error instead of inventing a price', async () => {
  globalThis.fetch = async () => Response.json({ error: 'API limitas' }, { status: 502 })
  await assert.rejects(getStockQuote('AAPL'), /API limitas/)
})

test('reports unavailable local API for an HTML response', async () => {
  globalThis.fetch = async () => new Response('<html></html>')
  await assert.rejects(getStockQuote('AAPL'), /Kainų API nepasiekiama/)
})
