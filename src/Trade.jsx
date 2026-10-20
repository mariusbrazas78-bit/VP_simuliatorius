import { useMemo, useState } from 'react'
import StockChart from './StockChart.jsx'
import { tradeStockHistoryDemoData } from './chartDemoData.js'
import './Trade.css'

const stocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185, color: 'apple', history: tradeStockHistoryDemoData.AAPL },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420, color: 'microsoft', history: tradeStockHistoryDemoData.MSFT },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 120, color: 'tsla', history: tradeStockHistoryDemoData.TSLA },
]

const money = (amount) => `${amount.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

function Trade({ onBack }) {
  const [symbol, setSymbol] = useState(stocks[0].symbol)
  const [quantity, setQuantity] = useState('1')
  const [notice, setNotice] = useState('')
  const selectedStock = stocks.find((stock) => stock.symbol === symbol)
  const validQuantity = /^[1-9]\d*$/.test(quantity)
  const total = useMemo(() => validQuantity ? Number(quantity) * selectedStock.price : 0, [quantity, selectedStock, validQuantity])

  const updateQuantity = (value) => {
    // Keep only whole-number digits; zero and empty input remain invalid until corrected.
    setQuantity(value.replace(/[^0-9]/g, ''))
    setNotice('')
  }

  const showDemoNotice = () => {
    if (!validQuantity) {
      setNotice('Įvesk teigiamą sveiką akcijų kiekį.')
      return
    }
    setNotice('Demonstracinis veiksmas – sandoris dar nevykdomas.')
  }

  return (
    <main className="trade-page">
      <header className="trade-header">
        <div>
          <div className="trade-eyebrow">TAVO INVESTAVIMO ERDVĖ</div>
          <h1>Trade</h1>
          <p>Pasirink akciją ir peržiūrėk demonstracinio sandorio sumą.</p>
        </div>
        <span className="trade-demo-badge"><span /> Demonstraciniai duomenys</span>
      </header>

      <div className="trade-layout">
        <section className="trade-form-card" aria-labelledby="trade-form-title">
          <div className="trade-card-heading"><div className="trade-heading-icon" aria-hidden="true">↗</div><div><h2 id="trade-form-title">Naujas sandoris</h2><p>Visi veiksmai yra tik demonstraciniai</p></div></div>

          <label className="trade-label" htmlFor="stock-select">Pasirink akciją</label>
          <div className="select-wrap"><select id="stock-select" value={symbol} onChange={(event) => { setSymbol(event.target.value); setNotice('') }}>
            {stocks.map((stock) => <option key={stock.symbol} value={stock.symbol}>{stock.symbol} — {stock.name}</option>)}
          </select><span className="select-chevron" aria-hidden="true">⌄</span></div>

          <div className="selected-stock">
            <span className={`trade-stock-logo ${selectedStock.color}`}>{selectedStock.symbol.slice(0, 1)}</span>
            <span><strong>{selectedStock.symbol}</strong><small>{selectedStock.name}</small></span>
            <span className="selected-price"><small>DEMONSTRACINĖ KAINA</small><strong>{money(selectedStock.price)}</strong></span>
          </div>

          <label className="trade-label" htmlFor="share-quantity">Akcijų kiekis</label>
          <input id="share-quantity" className="quantity-input" type="number" inputMode="numeric" min="1" step="1" value={quantity} onChange={(event) => updateQuantity(event.target.value)} aria-describedby="quantity-hint" />
          <small className="field-hint" id="quantity-hint">Įvesk teigiamą sveiką skaičių.</small>

          <div className="estimated-total"><span><small>NUMATOMA SANDORIO SUMA</small><strong>{money(total)}</strong></span><span className="calculation">{validQuantity ? `${quantity} × ${money(selectedStock.price)}` : '—'}</span></div>

          <div className="trade-actions"><button className="buy-button" type="button" onClick={showDemoNotice}>BUY <span>(Pirkti)</span></button><button className="sell-button" type="button" onClick={showDemoNotice}>SELL <span>(Parduoti)</span></button></div>
          <div className="trade-notice" role="status" aria-live="polite">{notice || 'Pasirink akciją ir kiekį, kad matytum numatomą sumą.'}</div>
        </section>

        <aside className="trade-info-card">
          <span className="info-mark" aria-hidden="true">i</span>
          <h2>Mokomoji prekyba</h2>
          <p>Šiame ekrane pateikiamos pavyzdinės kainos. Paspaudus BUY arba SELL, sandoris nebus įvykdytas ir tavo portfelis nepasikeis.</p>
          <section className="trade-chart" aria-label={`${selectedStock.symbol} kainos grafikas`}>
            <h3>{selectedStock.symbol} kainos kitimas</h3>
            <p className="trade-chart-note">Demonstraciniai duomenys · EUR</p>
            <StockChart history={selectedStock.history} currency="EUR" />
          </section>
          <div className="info-divider" />
          <div className="info-stat"><span>Pasirinktos akcijos</span><strong>3</strong></div>
          <div className="info-stat"><span>Kainų šaltinis</span><strong>Demonstracinis</strong></div>
          <button type="button" className="back-to-portfolio" onClick={onBack}>← Grįžti į Portfolio</button>
        </aside>
      </div>
      <footer className="trade-footer"><span>VP SIMULIATORIUS</span><span>Investuok ir mokykis savo tempu <b>✳</b></span></footer>
    </main>
  )
}

export default Trade
