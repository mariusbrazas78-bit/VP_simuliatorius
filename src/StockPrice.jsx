import { useState } from 'react'
import StockChart from './StockChart.jsx'
import useStockQuote from './useStockQuote'
import { STOCKS } from './lib/stocks'
import { money } from './lib/format'

export default function StockPrice() {
  const [symbol, setSymbol] = useState('AAPL')
  const { quote, loading, error, retry } = useStockQuote(symbol)
  return <section className="stock-price" aria-labelledby="stock-price-title">
    <h2 id="stock-price-title">Akcijos kainos istorija (EUR)</h2>
    <label htmlFor="chart-symbol">Akcija </label>
    <select id="chart-symbol" value={symbol} onChange={(event) => setSymbol(event.target.value)}>
      {STOCKS.map((stock) => <option key={stock.symbol} value={stock.symbol}>{stock.symbol}</option>)}
    </select>
    {loading && <p role="status">Įkeliama kaina…</p>}
    {error && <div><p role="alert">{error}</p><button type="button" onClick={retry}>Bandyti dar kartą</button></div>}
    {quote && <><p><strong>{symbol}</strong>: {money(quote.price)} · Duomenų data: {quote.updatedAt}</p>
      <p>Istorinės dienos uždarymo kainos.</p><StockChart history={Array.isArray(quote.history) ? quote.history : []} currency="EUR" /></>}
  </section>
}
