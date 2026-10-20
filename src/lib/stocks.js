export const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', color: 'apple' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', color: 'microsoft' },
  { symbol: 'TSLA', name: 'Tesla Inc.', color: 'tesla' },
]

export function validateTrade({ symbol, type, quantity }) {
  if (!STOCKS.some((stock) => stock.symbol === symbol)) {
    throw new Error('Nepalaikomas akcijos simbolis.')
  }
  if (!['BUY', 'SELL'].includes(type)) {
    throw new Error('Veiksmas turi būti BUY arba SELL.')
  }
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 2147483647) {
    throw new Error('Kiekis turi būti teigiamas sveikasis skaičius.')
  }
}

export function validateQuote(quote, symbol) {
  if (!quote || quote.symbol !== symbol || quote.currency !== 'EUR' ||
      typeof quote.price !== 'number' || !Number.isFinite(quote.price) ||
      quote.price <= 0 || typeof quote.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(quote.updatedAt))) {
    throw new Error('Kainų API grąžino netinkamus EUR duomenis.')
  }
  return quote
}

export async function getStockQuote(symbol, { signal } = {}) {
  if (!STOCKS.some((stock) => stock.symbol === symbol)) {
    throw new Error('Nepalaikomas akcijos simbolis.')
  }
  const response = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`, { signal })
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('Kainų API nepasiekiama. Vietiniam API paleidimui naudokite Vercel aplinką.')
  }
  if (!response.ok) {
    throw new Error(data?.error || 'Nepavyko gauti akcijos kainos.')
  }
  return validateQuote(data, symbol)
}
