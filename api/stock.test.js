import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import handler, {
  convertStockHistory,
  createEurStockResponse,
  findRateForDate,
} from './stock.js';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.ALPHA_VANTAGE_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) {
    delete process.env.ALPHA_VANTAGE_API_KEY;
  } else {
    process.env.ALPHA_VANTAGE_API_KEY = originalApiKey;
  }
});

test('112 USD, esant 1.12 USD už EUR, yra 100 EUR', () => {
  const [converted] = convertStockHistory(
    [{ date: '2026-01-05', price: 112 }],
    [{ date: '2026-01-05', usdPerEur: 1.12 }],
  );

  assert.equal(converted.price, 100);
});

test('parenkamas paskutinis kursas iki kainos datos, net jei kursai nesurikiuoti', () => {
  const rate = findRateForDate([
    { date: '2026-01-05', usdPerEur: 1.1 },
    { date: '2026-01-02', usdPerEur: 1.2 },
    { date: '2026-01-07', usdPerEur: 1.3 },
  ], '2026-01-06');

  assert.deepEqual(rate, { date: '2026-01-05', usdPerEur: 1.1 });
});

test('kainų istorijos taškai naudoja savo datos kursą arba paskutinį ankstesnį kursą', () => {
  const result = convertStockHistory(
    [
      { date: '2026-01-01', price: 120 },
      { date: '2026-01-02', price: 112 },
      { date: '2026-01-03', price: 112 }, // Savaitgalis: taikomas penktadienio kursas.
    ],
    [
      { date: '2026-01-01', usdPerEur: 1.2 },
      { date: '2026-01-02', usdPerEur: 1.12 },
    ],
  );

  assert.deepEqual(result, [
    { date: '2026-01-01', price: 100, exchangeRateDate: '2026-01-01' },
    { date: '2026-01-02', price: 100, exchangeRateDate: '2026-01-02' },
    { date: '2026-01-03', price: 100, exchangeRateDate: '2026-01-02' },
  ]);
});

test('naujausias API kainos laukas sutampa su paskutiniu istorijos tašku ir nurodo EUR bei kurso datą', () => {
  const result = createEurStockResponse(
    'AAPL',
    [
      { date: '2026-01-02', price: 120 },
      { date: '2026-01-03', price: 112 },
    ],
    [{ date: '2026-01-02', usdPerEur: 1.12 }],
  );

  assert.equal(result.currency, 'EUR');
  assert.equal(result.price, result.history.at(-1).price);
  assert.equal(result.updatedAt, result.history.at(-1).date);
  assert.equal(result.exchangeRateDate, result.history.at(-1).exchangeRateDate);
});

test('trūkstamas ankstesnis kursas ar nulinis kursas negali sukurti klaidingos kainos', () => {
  assert.throws(
    () => convertStockHistory([{ date: '2026-01-02', price: 112 }], []),
    /ECB kursas nerastas/,
  );
  assert.throws(
    () => convertStockHistory(
      [{ date: '2026-01-02', price: 112 }],
      [{ date: '2026-01-02', usdPerEur: 0 }],
    ),
    /ECB kursas nerastas arba netinkamas/,
  );
  assert.throws(
    () => convertStockHistory(
      [{ date: '2026-01-02', price: Number.NaN }],
      [{ date: '2026-01-02', usdPerEur: 1.12 }],
    ),
    /Netinkama akcijos kaina/,
  );
});

test('handler grąžina aiškią klaidą netinkamai ECB eilutei', async () => {
  process.env.ALPHA_VANTAGE_API_KEY = 'test-only-not-a-real-key';
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.hostname === 'www.alphavantage.co') {
      return {
        ok: true,
        json: async () => ({
          'Time Series (Daily)': { '2026-01-02': { '4. close': '112.0000' } },
        }),
      };
    }
    return {
      ok: true,
      text: async () => 'KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE\nEXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-01-02,0',
    };
  };

  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  await handler({ query: { symbol: 'AAPL' } }, response);

  assert.equal(response.statusCode, 502);
  assert.match(response.body.error, /netinkamą USD\/EUR kurso įrašą/);
});
