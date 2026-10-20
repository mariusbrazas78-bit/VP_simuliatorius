import { STOCKS } from './lib/stocks'
import { dateTime, money } from './lib/format'
import './Portfolio.css'

function Portfolio({ profile, positions, snapshots }) {
  const latest = snapshots.at(-1)
  return (
    <section className="portfolio-page">
      <header className="portfolio-header">
        <div><div className="portfolio-eyebrow">TAVO INVESTAVIMO ERDVĖ</div>
          <h1>Portfolio</h1><p>Tavo virtualios investicijos ir išsaugota portfelio vertė.</p></div>
        <span className="demo-badge"><span /> Duomenys iš Supabase</span>
      </header>
      <section className="portfolio-summary" aria-label="Portfelio suvestinė">
        <article className="summary-card cash-summary"><span className="summary-label">LAISVI PINIGAI</span>
          <strong>{money(profile.balance)}</strong><small>Dabartinis virtualus balansas</small></article>
        <article className="summary-card"><span className="summary-label">AKCIJŲ VERTĖ</span>
          <strong>{latest ? money(latest.positions_value) : '—'}</strong><small>Paskutinio išsaugoto vertinimo metu</small></article>
        <article className="summary-card total-summary"><span className="summary-label">PORTFELIO VERTĖ</span>
          <strong>{latest ? money(latest.total_value) : '—'}</strong><small>Pinigai ir akcijos paskutinio vertinimo metu</small></article>
        <article className="summary-card pnl-summary"><span className="summary-label">PELNAS / NUOSTOLIS (P/L)</span>
          <strong>{latest ? money(Number(latest.total_value) - 10000) : '—'}</strong><small>Išsaugota portfelio vertė − 10 000 EUR</small></article>
      </section>
      <p className="valuation-note">{latest
        ? 'Paskutinis vertinimas: ' + dateTime(latest.created_at) + ' (Vilniaus laiku). Vertė atnaujinama po sandorio pagal istorines EUR kainas.'
        : 'Portfelio vertės duomenų kol kas nėra.'}</p>
      <section className="holdings-panel" aria-labelledby="holdings-title">
        <div className="holdings-heading"><div><h2 id="holdings-title">Turimos akcijos</h2><p>Duomenų bazėje saugomos pozicijos</p></div>
          <span className="holdings-count">{positions.length} pozicijos</span></div>
        {positions.length === 0 ? <p className="empty-state">Turimų akcijų kol kas nėra.</p> :
          <div className="table-scroll"><table><thead><tr><th scope="col">AKCIJA</th><th scope="col">KIEKIS</th></tr></thead>
            <tbody>{positions.map((position) => {
              const stock = STOCKS.find((item) => item.symbol === position.symbol)
              return <tr key={position.symbol}><td><div className="stock-name">
                <span className={'stock-logo ' + (stock?.color || '')}>{position.symbol[0]}</span>
                <span><strong>{position.symbol}</strong><small>{stock?.name}</small></span>
              </div></td><td>{position.quantity}</td></tr>
            })}</tbody></table></div>}
        <div className="table-note">Prekiaujama AAPL, MSFT ir TSLA. Pradinis demonstracinės paskyros kapitalas – 10 000 EUR.</div>
      </section>
      <footer className="portfolio-footer"><span>VP SIMULIATORIUS</span><span>Investuok ir mokykis savo tempu <b>✳</b></span></footer>
    </section>
  )
}

export default Portfolio
