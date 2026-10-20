import assert from 'node:assert/strict'
import test from 'node:test'
import { getStockPrices } from './stock-prices.ts'

const endpoint = 'https://example.test/api/stock'

function quotes(change = (quote) => quote) {
  return async (input) => {
    const symbol = new URL(input).searchParams.get('symbol')
    return Response.json(change({
      symbol,
      price: { AAPL: 100, MSFT: 200, TSLA: 150 }[symbol],
      currency: 'EUR',
      updatedAt: '2026-10-16',
    }))
  }
}

test('fetches all three EUR prices from the configured API', async () => {
  const calls = []
  const fetcher = quotes()
  const result = await getStockPrices(endpoint, (url, options) => {
    calls.push(new URL(url))
    assert.equal(options.redirect, 'error')
    assert.ok(options.signal)
    return fetcher(url)
  })
  assert.deepEqual(result, { AAPL: 100, MSFT: 200, TSLA: 150 })
  assert.equal(calls.length, 3)
  assert.ok(calls.every((url) => url.origin === 'https://example.test'))
  assert.ok(calls.every((url) => url.pathname === '/api/stock'))
})

test('rejects missing configuration before fetching', async () => {
  await assert.rejects(getStockPrices(undefined), /NOT_CONFIGURED/)
})

test('rejects unsafe endpoint configuration', async () => {
  for (const url of ['http://example.test', 'https://user:pass@example.test',
    'https://example.test?symbol=OTHER', 'https://example.test#fragment']) {
    await assert.rejects(getStockPrices(url), /INVALID_STOCK_API_URL/)
  }
})

test('rejects provider limits and failed HTTP responses', async () => {
  await assert.rejects(getStockPrices(endpoint, async () =>
    Response.json({ error: 'Rate limit' }, { status: 502 })), /UNAVAILABLE/)
})

test('rejects wrong currency, symbol, price or date for any position', async () => {
  for (const invalid of [
    { currency: 'USD' }, { symbol: 'OTHER' }, { price: 0 },
    { price: -1 }, { price: '100' }, { updatedAt: 'invalid' },
    { updatedAt: null },
  ]) {
    await assert.rejects(getStockPrices(endpoint, quotes((quote) =>
      quote.symbol === 'MSFT' ? { ...quote, ...invalid } : quote)),
    /INVALID_STOCK_QUOTE/)
  }
})

test('rejects network errors and malformed responses', async () => {
  await assert.rejects(getStockPrices(endpoint, async () => {
    throw new Error('Network unavailable')
  }), /Network unavailable/)
  await assert.rejects(getStockPrices(endpoint, async () =>
    new Response('not JSON')), SyntaxError)
})
