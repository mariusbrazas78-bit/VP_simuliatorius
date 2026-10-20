import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

// All stock, Supabase and trade requests are intercepted. No real trades occur.
const base = 'http://127.0.0.1:5175'
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175', '--strictPort'], {
  stdio: 'pipe',
  env: { ...process.env, VITE_SUPABASE_URL: 'https://test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' },
})
let serverOutput = ''
server.stdout.on('data', (chunk) => { serverOutput += chunk })
server.stderr.on('data', (chunk) => { serverOutput += chunk })
let browser
let page

try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(serverOutput)
    try { ready = (await fetch(base)).ok } catch { /* Server is starting. */ }
    if (ready) break
    await delay(250)
  }
  if (!ready) throw new Error('Vite did not start: ' + serverOutput)

  browser = await chromium.launch(process.platform === 'win32' ? { channel: 'msedge', headless: true } : { headless: true })
  page = await browser.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const state = { balance: 10000, positions: {}, transactions: [], snapshots: [
    { id: 'initial', cash_balance: 10000, positions_value: 0, total_value: 10000, created_at: '2026-10-19T10:00:00Z' },
  ] }
  let quoteUnavailable = false
  let tradeUnavailable = false
  let databaseUnavailable = false
  let failRefreshAfterTrade = false
  let calls = 0
  const prices = { AAPL: 100, MSFT: 200, TSLA: 150 }
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  const reply = (route, body, status = 200) => route.fulfill({ status, headers, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route('https://test.supabase.co/**', async (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') return reply(route, {})
    const url = new URL(request.url())
    if (url.pathname.includes('/rest/v1/')) {
      if (databaseUnavailable) return reply(route, { message: 'DB unavailable' }, 503)
      const table = url.pathname.split('/').at(-1)
      const rows = {
        profiles: { id: 'demo', name: 'Demo', balance: state.balance },
        positions: Object.entries(state.positions).filter(([, quantity]) => quantity > 0).map(([symbol, quantity]) => ({ symbol, quantity })),
        transactions: state.transactions.slice().reverse(),
        snapshots: state.snapshots.slice().reverse(),
      }
      return reply(route, rows[table])
    }
    if (url.pathname === '/functions/v1/trade') {
      calls++
      const body = request.postDataJSON()
      assert.deepEqual(Object.keys(body).sort(), ['quantity', 'symbol', 'type'])
      const { symbol, type, quantity } = body
      if (tradeUnavailable) return reply(route, { error: 'Akcijų kainos šiuo metu nepasiekiamos. Sandoris neatliktas.' }, 503)
      const total = quantity * prices[symbol]
      if (type === 'BUY' && total > state.balance) return reply(route, { error: 'Nepakanka virtualių pinigų.' }, 400)
      if (type === 'SELL' && quantity > (state.positions[symbol] || 0)) return reply(route, { error: 'Nepakanka turimų akcijų.' }, 400)
      state.balance += type === 'BUY' ? -total : total
      state.positions[symbol] = (state.positions[symbol] || 0) + (type === 'BUY' ? quantity : -quantity)
      const id = String(state.transactions.length + 1)
      state.transactions.push({ id, symbol, type, quantity, price: prices[symbol], created_at: new Date().toISOString() })
      const positionsValue = Object.entries(state.positions).reduce((sum, [stock, count]) => sum + count * prices[stock], 0)
      state.snapshots.push({ id, cash_balance: state.balance, positions_value: positionsValue, total_value: state.balance + positionsValue, created_at: new Date().toISOString() })
      if (failRefreshAfterTrade) databaseUnavailable = true
      await delay(100)
      return reply(route, { data: { transactionId: id, balance: state.balance, price: prices[symbol], quantity: state.positions[symbol] } })
    }
    return reply(route, { error: 'Unexpected request' }, 500)
  })
  await page.route('**/api/stock?**', (route) => {
    if (quoteUnavailable) return reply(route, { error: 'API limitas' }, 502)
    const symbol = new URL(route.request().url()).searchParams.get('symbol')
    return reply(route, { symbol, price: prices[symbol], currency: 'EUR', updatedAt: '2026-10-16', history: [
      { date: '2026-10-15', price: prices[symbol] - 1 }, { date: '2026-10-16', price: prices[symbol] },
    ] })
  })

  const nav = (name) => page.getByRole('navigation').getByRole('button', { name, exact: true }).click()
  const waitText = (text) => page.getByText(text, { exact: false }).first().waitFor()
  const buy = () => page.getByRole('button', { name: 'BUY (Pirkti)', exact: true })
  const sell = () => page.getByRole('button', { name: 'SELL (Parduoti)', exact: true })

  await page.goto(base)
  await waitText('Turimų akcijų kol kas nėra.')
  assert.match(await page.locator('.cash-summary strong').textContent(), /10\s*000/)
  await nav('History')
  await waitText('Sandorių kol kas nėra.')
  await nav('Trade')
  await waitText('Kainos duomenų data:')
  assert.deepEqual(await page.locator('#stock-select option').evaluateAll((options) => options.map((option) => option.value)), ['AAPL', 'MSFT', 'TSLA'])
  await page.locator('#share-quantity').fill('2')
  await buy().evaluate((button) => { button.click(); button.click() })
  await waitText('Sandoris atliktas. Faktiškai')
  assert.equal(calls, 1, 'Double click must not submit two trades')
  assert.equal(state.balance, 9800)
  await nav('History')
  assert.equal(await page.locator('tbody tr').count(), 1)
  assert.match(await page.locator('tbody').textContent(), /AAPL.*BUY.*2/s)
  await page.reload()
  await page.locator('.cash-summary strong').waitFor()
  assert.match(await page.locator('.cash-summary strong').textContent(), /9\s*800/)
  await nav('Trade')
  await waitText('Kainos duomenų data:')
  await sell().click()
  await waitText('Sandoris atliktas. Faktiškai')
  assert.equal(state.balance, 9900)
  assert.equal(state.positions.AAPL, 1)
  await page.locator('#share-quantity').fill('100')
  await buy().click()
  await waitText('Nepakanka virtualių pinigų.')
  await page.locator('#share-quantity').fill('2')
  await sell().click()
  await waitText('Nepakanka turimų akcijų.')
  for (const invalid of ['0', '-1', '1.5']) {
    await page.locator('#share-quantity').fill(invalid)
    assert.equal(await buy().isDisabled(), true)
  }
  assert.equal(state.transactions.length, 2)

  quoteUnavailable = true
  await page.locator('#stock-select').selectOption('MSFT')
  await waitText('API limitas')
  assert.equal(await buy().isDisabled(), true)
  quoteUnavailable = false
  await page.getByRole('button', { name: 'Bandyti gauti kainą dar kartą' }).click()
  await waitText('Kainos duomenų data:')
  await page.locator('#share-quantity').fill('1')
  tradeUnavailable = true
  await buy().click()
  await waitText('Sandoris neatliktas.')
  assert.equal(state.transactions.length, 2)
  tradeUnavailable = false
  failRefreshAfterTrade = true
  await buy().click()
  await waitText('Sandoris atliktas, bet duomenų atnaujinti nepavyko.')
  assert.equal(state.transactions.length, 3)
  assert.equal(await buy().isDisabled(), true)
  databaseUnavailable = false
  await page.getByRole('button', { name: 'Atnaujinti duomenis' }).click()
  await nav('Grafikai')
  await waitText('Istorinės dienos uždarymo kainos.')
  await page.locator('svg[aria-label^="Portfelio vertės grafikas"]').waitFor()
  assert.equal(await page.locator('svg[aria-label^="Pelno ir nuostolio grafikas"]').count(), 1)
  assert.deepEqual(errors, [])
  console.log('Browser checks passed: empty states, BUY/SELL, double click, reload, validation, API/DB errors and real-data charts (mocked HTTP).')
} catch (failure) {
  console.error('Browser page:', await page?.locator('body').innerText().catch(() => 'Unavailable'))
  throw failure
} finally {
  await browser?.close()
  server.kill()
}
