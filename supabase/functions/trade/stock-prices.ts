// Julijos API grąžina paskutines istorines uždarymo kainas EUR.
// Adresą nustato serverio administratorius, ne naršyklės užklausa.
export async function getStockPrices(
  endpoint: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Record<string, number>> {
  if (!endpoint) throw new Error('STOCK_API_URL_NOT_CONFIGURED')

  const baseUrl = new URL(endpoint)
  if (
    baseUrl.protocol !== 'https:' ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new Error('INVALID_STOCK_API_URL')
  }

  const entries = await Promise.all(
    ['AAPL', 'MSFT', 'TSLA'].map(async (symbol) => {
      const url = new URL(baseUrl)
      url.searchParams.set('symbol', symbol)

      const response = await fetcher(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      })

      if (!response.ok) throw new Error('STOCK_API_UNAVAILABLE')

      const quote = await response.json()
      if (
        !quote ||
        quote.symbol !== symbol ||
        quote.currency !== 'EUR' ||
        typeof quote.price !== 'number' ||
        !Number.isFinite(quote.price) ||
        quote.price <= 0 ||
        typeof quote.updatedAt !== 'string' ||
        !Number.isFinite(Date.parse(quote.updatedAt))
      ) {
        throw new Error('INVALID_STOCK_QUOTE')
      }

      return [symbol, quote.price] as const
    }),
  )

  return Object.fromEntries(entries)
}
