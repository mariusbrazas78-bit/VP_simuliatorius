import './Portfolio.css'

const holdings = [
  { symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, purchasePrice: 170, currentPrice: 185, color: 'apple' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 5, purchasePrice: 400, currentPrice: 420, color: 'microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', quantity: 8, purchasePrice: 100, currentPrice: 120, color: 'nvidia' },
]

const money = (amount) => `${amount.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const holdingsCost = holdings.reduce((sum, stock) => sum + stock.quantity * stock.purchasePrice, 0)
const stocksValue = holdings.reduce((sum, stock) => sum + stock.quantity * stock.currentPrice, 0)
const cashBalance = 10_000 - holdingsCost
const portfolioValue = cashBalance + stocksValue
const profitLoss = holdings.reduce((sum, stock) => sum + stock.quantity * (stock.currentPrice - stock.purchasePrice), 0)

function Portfolio() {
  return (
    <main className="portfolio-page">
      <header className="portfolio-header">
        <div>
          <div className="portfolio-eyebrow">TAVO INVESTAVIMO ERDVĖ</div>
          <h1>Portfolio</h1>
          <p>Čia matysi savo virtualias investicijas ir jų vertę.</p>
        </div>
        <span className="demo-badge"><span /> Demonstraciniai duomenys</span>
      </header>

      <section className="portfolio-summary" aria-label="Portfelio suvestinė">
        <article className="summary-card cash-summary">
          <span className="summary-label">LAISVI GRYNIEJI</span>
          <strong>{money(cashBalance)}</strong>
          <small>Pradinis kapitalas − akcijų įsigijimo vertė</small>
        </article>
        <article className="summary-card">
          <span className="summary-label">AKCIJŲ VERTĖ</span>
          <strong>{money(stocksValue)}</strong>
          <small>{holdings.length} pozicijos portfelyje</small>
        </article>
        <article className="summary-card total-summary">
          <span className="summary-label">BENDRA PORTFELIO VERTĖ</span>
          <strong>{money(portfolioValue)}</strong>
          <small>Grynieji pinigai + akcijų vertė</small>
        </article>
        <article className="summary-card pnl-summary">
          <span className="summary-label">PELNAS / NUOSTOLIS (P/L)</span>
          <strong>+{money(profitLoss)}</strong>
          <small>Pagal įsigijimo ir dabartines kainas</small>
        </article>
      </section>

      <section className="holdings-panel" aria-labelledby="holdings-title">
        <div className="holdings-heading">
          <div><h2 id="holdings-title">Turimos akcijos</h2><p>Demonstraciniai duomenys · Pavyzdinės kainos</p></div>
          <span className="holdings-count">{holdings.length} pozicijos</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>AKCIJA</th><th>KIEKIS</th><th>VIENOS AKCIJOS KAINA</th><th>BENDRA VERTĖ</th></tr></thead>
            <tbody>{holdings.map((stock) => {
              const value = stock.quantity * stock.currentPrice
              return <tr key={stock.symbol}>
                <td><div className="stock-name"><span className={`stock-logo ${stock.color}`}>{stock.symbol.slice(0, 1)}</span><span><strong>{stock.symbol}</strong><small>{stock.name}</small></span></div></td>
                <td>{stock.quantity}</td>
                <td>{money(stock.currentPrice)}</td>
                <td><strong>{money(value)}</strong></td>
              </tr>
            })}</tbody>
          </table>
        </div>
        <div className="table-note">Akcijų vertė apskaičiuota pagal dabartinę demonstracinę kainą. P/L: dabartinė vertė − įsigijimo vertė.</div>
      </section>
      <footer className="portfolio-footer"><span>VP SIMULIATORIUS</span><span>Investuok ir mokykis savo tempu <b>✳</b></span></footer>
    </main>
  )
}

export default Portfolio
