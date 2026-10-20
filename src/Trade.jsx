import { useRef, useState } from 'react'
import { STOCKS, validateTrade } from './lib/stocks'
import { money } from './lib/format'
import { executeTrade } from './lib/trading'
import useStockQuote from './useStockQuote'
import './Trade.css'

function Trade({ onBack, onTradeCompleted, disabled }) {
  const [symbol, setSymbol] = useState('AAPL')
  const [quantity, setQuantity] = useState('1')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const lock = useRef(false)
  const { quote, loading, error: quoteError, retry } = useStockQuote(symbol)
  const stock = STOCKS.find((item) => item.symbol === symbol)
  const amount = Number(quantity)
  const validQuantity = Number.isSafeInteger(amount) && amount > 0 && amount <= 2147483647
  const total = quote && validQuantity ? Math.round((quote.price * amount + Number.EPSILON) * 100) / 100 : null

  async function submit(type) {
    if (lock.current || disabled) return
    setError('')
    setNotice('')
    try { validateTrade({ symbol, type, quantity: amount }) }
    catch (failure) { setError(failure.message); return }
    if (!quote || loading || quoteError) { setError('Palaukite, kol bus gauta akcijos kaina.'); return }
    lock.current = true
    setPending(true)
    try {
      const result = await executeTrade({ symbol, type, quantity: amount })
      setNotice('Sandoris atliktas. Faktiškai naudota vienos akcijos kaina: ' + money(result.price) + '.')
      try { await onTradeCompleted() }
      catch { setError('Sandoris atliktas, bet duomenų atnaujinti nepavyko. Atnaujinkite duomenis prieš kitą sandorį.') }
    } catch (failure) {
      setError(failure.message)
    } finally {
      lock.current = false
      setPending(false)
    }
  }

  return (
    <section className="trade-page">
      <header className="trade-header"><div><div className="trade-eyebrow">TAVO INVESTAVIMO ERDVĖ</div>
        <h1>Trade</h1><p>Virtualus akcijų pirkimas ir pardavimas. Visos kainos EUR.</p></div>
        <span className="trade-demo-badge"><span /> Virtualūs pinigai</span></header>
      <div className="trade-layout">
        <section className="trade-form-card" aria-labelledby="trade-form-title">
          <div className="trade-card-heading"><div className="trade-heading-icon" aria-hidden="true">↗</div>
            <div><h2 id="trade-form-title">Naujas sandoris</h2><p>Kainos iš bendros akcijų API</p></div></div>
          <fieldset className="trade-fields" disabled={pending || disabled}>
            <legend className="sr-only">Akcija ir kiekis</legend>
            <label className="trade-label" htmlFor="stock-select">Pasirink akciją</label>
            <div className="select-wrap"><select id="stock-select" value={symbol} onChange={(event) => {
              setSymbol(event.target.value); setError(''); setNotice('')
            }}>{STOCKS.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} — {item.name}</option>)}</select></div>
            <div className="selected-stock"><span className={'trade-stock-logo ' + stock.color}>{symbol[0]}</span>
              <span><strong>{symbol}</strong><small>{stock.name}</small></span>
              <span className="selected-price"><small>ISTORINĖ KAINA EUR</small><strong>{quote ? money(quote.price) : '—'}</strong></span></div>
            {loading && <p role="status">Įkeliama akcijos kaina…</p>}
            {quoteError && <div><p role="alert">{quoteError}</p><button type="button" onClick={retry}>Bandyti gauti kainą dar kartą</button></div>}
            {quote && <p className="field-hint">Kainos duomenų data: {quote.updatedAt}</p>}
            <label className="trade-label" htmlFor="share-quantity">Akcijų kiekis</label>
            <input id="share-quantity" className="quantity-input" type="number" min="1" max="2147483647" step="1"
              value={quantity} onChange={(event) => { setQuantity(event.target.value); setError(''); setNotice('') }} />
            <small className="field-hint">Teigiamas sveikasis akcijų kiekis.</small>
            <div className="estimated-total"><span><small>NUMATOMA SANDORIO SUMA</small><strong>{total === null ? '—' : money(total)}</strong></span></div>
            <div className="trade-actions">
              <button className="buy-button" type="button" disabled={loading || !quote || !!quoteError || !validQuantity} onClick={() => submit('BUY')}>BUY <span>(Pirkti)</span></button>
              <button className="sell-button" type="button" disabled={loading || !quote || !!quoteError || !validQuantity} onClick={() => submit('SELL')}>SELL <span>(Parduoti)</span></button>
            </div>
          </fieldset>
          {pending && <p role="status">Vykdomas sandoris…</p>}
          {error && <p className="trade-notice integration-error" role="alert">{error}</p>}
          {notice && <p className="trade-notice" role="status">{notice}</p>}
        </section>
        <aside className="trade-info-card"><span className="info-mark" aria-hidden="true">i</span><h2>Mokomoji prekyba</h2>
          <p>Naudojamos istorinės dienos uždarymo kainos EUR. Galutinę kainą serveris gauna dar kartą vykdydamas sandorį, todėl suma gali skirtis nuo numatomos.</p>
          <p>Serveris patikrina balansą ir akcijų kiekį. Sėkmingas sandoris išsaugomas duomenų bazėje.</p>
          <div className="info-divider" /><div className="info-stat"><span>Pradinis kapitalas</span><strong>10 000 EUR</strong></div>
          <button type="button" className="back-to-portfolio" disabled={pending} onClick={onBack}>← Grįžti į Portfolio</button>
        </aside>
      </div>
      <footer className="trade-footer"><span>VP SIMULIATORIUS</span><span>Investuok ir mokykis savo tempu <b>✳</b></span></footer>
    </section>
  )
}

export default Trade
