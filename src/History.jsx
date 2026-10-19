import { demoTransactions } from './historyData.js'
import './History.css'

const money = (amount) => `${amount.toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const dateFormat = new Intl.DateTimeFormat('lt-LT', { year: 'numeric', month: 'short', day: 'numeric' })

function History() {
  return (
    <main className="history-page">
      <header className="history-header">
        <div>
          <div className="history-eyebrow">TAVO INVESTAVIMO ERDVĖ</div>
          <h1>History</h1>
          <p>Peržiūrėk savo sandorių istoriją.</p>
        </div>
      </header>

      <section className="history-panel" aria-labelledby="history-title">
        <div className="history-panel-heading">
          <div><h2 id="history-title">Sandorių istorija</h2><p>Demonstraciniai duomenys</p></div>
          {demoTransactions.length > 0 && <span className="history-count">{demoTransactions.length} sandoriai</span>}
        </div>
        {demoTransactions.length === 0 ? (
          <div className="history-empty">Sandorių istorija tuščia.</div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead><tr><th>DATA</th><th>AKCIJOS SIMBOLIS</th><th>SANDORIO TIPAS</th><th>KIEKIS</th><th>VIENOS AKCIJOS KAINA</th><th>BENDRA SANDORIO SUMA</th></tr></thead>
              <tbody>{demoTransactions.map((transaction) => {
                const total = transaction.quantity * transaction.price
                return (
                  <tr key={transaction.id}>
                    <td>{dateFormat.format(new Date(`${transaction.date}T12:00:00`))}</td>
                    <td><span className="history-symbol">{transaction.symbol}</span></td>
                    <td><span className={`transaction-type ${transaction.type.toLowerCase()}`}>{transaction.type}</span></td>
                    <td>{transaction.quantity}</td>
                    <td>{money(transaction.price)}</td>
                    <td><strong>{money(total)}</strong></td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        )}
        <div className="history-note">Sandorių sumos apskaičiuojamos pagal kiekį ir vienos akcijos kainą.</div>
      </section>

      <footer className="history-footer"><span>VP SIMULIATORIUS</span><span>Investuok ir mokykis savo tempu <b>✳</b></span></footer>
    </main>
  )
}

export default History
