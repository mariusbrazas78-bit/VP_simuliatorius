import { dateTime, money } from './lib/format'
import './History.css'

function History({ transactions }) {
  return (
    <section className="history-page">
      <header className="history-header"><div><div className="history-eyebrow">TAVO INVESTAVIMO ERDVĖ</div>
        <h1>History</h1><p>Duomenų bazėje išsaugoti virtualūs sandoriai.</p></div></header>
      <section className="history-panel" aria-labelledby="history-title">
        <div className="history-panel-heading"><div><h2 id="history-title">Sandorių istorija</h2>
          <p>Iki 100 naujausių įrašų · EUR · Vilniaus laiku</p></div>
          <span className="history-count">{transactions.length} sandoriai</span></div>
        {transactions.length === 0 ? <div className="history-empty">Sandorių kol kas nėra.</div> :
          <div className="history-table-wrap"><table className="history-table">
            <thead><tr><th scope="col">DATA</th><th scope="col">AKCIJA</th><th scope="col">TIPAS</th><th scope="col">KIEKIS</th>
              <th scope="col">VIENETO KAINA (EUR)</th><th scope="col">SUMA (EUR)</th></tr></thead>
            <tbody>{transactions.map((transaction) => <tr key={transaction.id}>
              <td>{dateTime(transaction.created_at)}</td><td><span className="history-symbol">{transaction.symbol}</span></td>
              <td><span className={'transaction-type ' + transaction.type.toLowerCase()}>{transaction.type}</span></td>
              <td>{transaction.quantity}</td><td>{money(transaction.price)}</td>
              <td><strong>{money(Math.round((Number(transaction.price) * transaction.quantity + Number.EPSILON) * 100) / 100)}</strong></td>
            </tr>)}</tbody>
          </table></div>}
        <div className="history-note">Sandorio suma: kiekis × faktiškai naudota vienos akcijos kaina, suapvalinta iki centų.</div>
      </section>
      <footer className="history-footer"><span>VP SIMULIATORIUS</span><span>Investuok ir mokykis savo tempu <b>✳</b></span></footer>
    </section>
  )
}

export default History
