import { withStockCache } from './stock-cache.js';
import { savedStockQuotes } from './saved-stock-quotes.js';

const ECB_CACHE_TTL = 6 * 60 * 60 * 1000;
const ecbRateCache = new Map();

async function getEcbRates(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 30);
  const startPeriod = start.toISOString().slice(0, 10);
  const cacheKey = `${startPeriod}:${endDate}`;
  const cached = ecbRateCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < ECB_CACHE_TTL) {
    return cached.rates;
  }

  const url = new URL('https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A');
  url.searchParams.set('startPeriod', startPeriod);
  url.searchParams.set('endPeriod', endDate);
  url.searchParams.set('format', 'csvdata');

  const response = await fetch(url, { headers: { Accept: 'text/csv' } });
  if (!response.ok) {
    throw new Error('Nepavyko gauti ECB valiutos kursų. Pabandykite vėliau.');
  }

  const csv = await response.text();
  const rows = csv.trim().split(/\r?\n/);
  if (rows.length < 2 || !rows[0].startsWith('KEY,')) {
    throw new Error('ECB grąžino netinkamo formato valiutos kursų duomenis.');
  }

  const rates = rows.slice(1).filter(Boolean).map((row) => {
    const columns = row.split(',');
    const date = columns[6];
    const usdPerEur = Number(columns[7]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(usdPerEur) || usdPerEur <= 0) {
      throw new Error('ECB grąžino netinkamą USD/EUR kurso įrašą.');
    }
    return { date, usdPerEur };
  }).sort((a, b) => a.date.localeCompare(b.date));

  if (!rates.length) {
    throw new Error('ECB duomenyse nerasta tinkamų USD/EUR kursų.');
  }

  ecbRateCache.set(cacheKey, { fetchedAt: Date.now(), rates });
  return rates;
}

export function findRateForDate(rates, date) {
  return rates
    .filter((rate) => rate.date <= date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
}

export function convertStockHistory(usdHistory, exchangeRates) {
  if (!Array.isArray(usdHistory) || !usdHistory.length) {
    throw new Error('Akcijos kainų istorija tuščia.');
  }

  return usdHistory.map(({ date, price }) => {
    const usdPrice = Number(price);
    if (!date || !Number.isFinite(usdPrice) || usdPrice <= 0) {
      throw new Error(`Netinkama akcijos kaina arba data: ${date || 'nenurodyta'}.`);
    }

    const rate = findRateForDate(exchangeRates, date);
    if (!rate || !Number.isFinite(rate.usdPerEur) || rate.usdPerEur <= 0) {
      throw new Error(`ECB kursas nerastas arba netinkamas akcijos duomenų datai ${date}.`);
    }

    return {
      date,
      price: Math.round((usdPrice / rate.usdPerEur + Number.EPSILON) * 100) / 100,
      exchangeRateDate: rate.date,
    };
  });
}

export function createEurStockResponse(symbol, usdHistory, exchangeRates) {
  const history = convertStockHistory(usdHistory, exchangeRates);
  const latest = history.at(-1);

  return {
    symbol,
    price: latest.price,
    updatedAt: latest.date,
    currency: 'EUR',
    exchangeRateDate: latest.exchangeRateDate,
    history,
  };
}

export async function handler(req, res) {
    const symbol = String(req.query.symbol || '').toUpperCase();
  
    if (!['AAPL', 'MSFT', 'TSLA'].includes(symbol)) {
      return res.status(400).json({
        error: 'Pasirink AAPL, MSFT arba TSLA',
      });
    }
  
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
    if (!apiKey) {
      return res.status(500).json({
        error: 'Nenustatytas API raktas',
      });
    }
  
    try {
      const url = new URL('https://www.alphavantage.co/query');
      url.searchParams.set('function', 'TIME_SERIES_DAILY');
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('apikey', apiKey);
  
      const response = await fetch(url);
  
      if (!response.ok) {
        throw new Error('API užklausa nepavyko');
      }
  
      const data = await response.json();

      if (data.Information || data.Note) {
        return res.status(429).json({
          error: 'Alpha Vantage laikinai riboja užklausas. Palaukite ir bandykite vėliau.',
        });
      }
  
      const history = data['Time Series (Daily)'];
  
      if (!history) {
        return res.status(502).json({
          error: 'Kainos gauti nepavyko. Patikrink API limitą arba plano galimybes.',
        });
      }
  
      const dates = Object.keys(history).sort();
      const latestDate = dates[dates.length - 1];
      const usdHistory = dates.slice(-30).map((date) => ({
        date,
        price: Number(history[date]['4. close']),
      }));

      let exchangeRates;
      try {
        exchangeRates = await getEcbRates(usdHistory[0].date, latestDate);
      } catch (error) {
        return res.status(502).json({
          error: error.message || 'Nepavyko gauti ECB valiutos kursų.',
        });
      }

      try {
        return res.status(200).json(createEurStockResponse(symbol, usdHistory, exchangeRates));
      } catch (error) {
        return res.status(502).json({ error: error.message });
      }
    } catch (error) {
      return res.status(500).json({
        error: error.message || 'Nepavyko susisiekti su akcijų kainų tiekėju',
      });
    }
  }

export default withStockCache(handler, { initialQuotes: savedStockQuotes });
  
