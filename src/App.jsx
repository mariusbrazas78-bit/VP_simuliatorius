
import { useEffect, useState } from 'react'
import {
  getProfile,
  getPositions,
  getTransactions,
} from './lib/trading'
import './App.css'
import TradeForm from './TradeForm'

const money = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

const stockPrice = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 6,
})

function App() {
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState('')

  const [positions, setPositions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [portfolioError, setPortfolioError] = useState('')

  useEffect(() => {
    let active = true

    getProfile()
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch((error) => {
        if (active) setProfileError(error.message)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    Promise.all([getPositions(), getTransactions()])
      .then(([positionsData, transactionsData]) => {
        if (!active) return

        setPositions(positionsData)
        setTransactions(transactionsData)
      })
      .catch((error) => {
        if (active) setPortfolioError(error.message)
      })
      .finally(() => {
        if (active) setPortfolioLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function refreshTradingData() {
    const [profileData, positionsData, transactionsData] =
      await Promise.all([
        getProfile(),
        getPositions(),
        getTransactions(),
      ])

    setProfile(profileData)
    setPositions(positionsData)
    setTransactions(transactionsData)
    setProfileError('')
    setPortfolioError('')
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          aria-label="VP Simuliatorius pradžia"
        >
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>
            VP <span className="brand-light">simuliatorius</span>
          </span>
        </a>

        <span className="account-label">
          <span className="status-dot" />
          Mokomoji paskyra
        </span>
      </header>

      <section className="welcome" id="home">
        <div className="eyebrow">
          <span className="sparkle" aria-hidden="true">✦</span>
          TAVO INVESTAVIMO ERDVĖ
        </div>

        <h1>
          Virtualios prekybos
          <br className="desktop-break" /> simuliatorius
        </h1>

        <p className="intro">
          Mokomasis akcijų prekybos projektas su virtualiais pinigais.
          <br className="desktop-break" />
          Išbandyk investavimo idėjas nerizikuodamas tikrais pinigais.
        </p>

        <div className="overview">
          <article className="balance-card">
            <div className="balance-topline">
              <span className="balance-label">VIRTUALUS BALANSAS</span>
              <span className="wallet-icon" aria-hidden="true">€</span>
            </div>

            <div className="balance-value">
              {profile ? money.format(Number(profile.balance)) : '—'}
            </div>

            {!profile && !profileError && (
              <p role="status">Įkeliamas balansas…</p>
            )}

            {profileError && (
              <p role="alert">{profileError}</p>
            )}

            <div className="balance-foot">
              <span className="balance-indicator" />
              Laisvi virtualūs pinigai · EUR
            </div>

            <div className="card-decoration" aria-hidden="true">€</div>
          </article>

          <nav className="navigation" aria-label="Pagrindinė navigacija">
            <h2>Greita navigacija</h2>

            <a className="nav-link" href="#portfolio">
              <span
                className="nav-icon portfolio-icon"
                aria-hidden="true"
              >
                <span />
              </span>
              <span className="nav-copy">
                <strong>Portfolio</strong>
                <small>Peržiūrėk savo investicijas</small>
              </span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>

            <a className="nav-link" href="#trade">
              <span className="nav-icon trade-icon" aria-hidden="true">
                ↗
              </span>
              <span className="nav-copy">
                <strong>Trade</strong>
                <small>Pažink virtualią prekybą</small>
              </span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>

            <a className="nav-link" href="#history">
              <span className="nav-icon history-icon" aria-hidden="true">
                ◷
              </span>
              <span className="nav-copy">
                <strong>History</strong>
                <small>Peržiūrėk veiklos istoriją</small>
              </span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>

        <section id="portfolio" style={{ marginTop: 40 }}>
          <h2>Portfolio</h2>

          {portfolioLoading ? (
            <p role="status">Įkeliami duomenys…</p>
          ) : portfolioError ? (
            <p role="alert">{portfolioError}</p>
          ) : positions.length === 0 ? (
            <p>Turimų akcijų kol kas nėra.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th scope="col">Akcija</th>
                  <th scope="col">Kiekis</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr key={position.symbol}>
                    <td>{position.symbol}</td>
                    <td>{position.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section id="trade" style={{ marginTop: 40 }}>
          <h2>Trade</h2>
          <TradeForm onTradeCompleted={refreshTradingData} />
        </section>

        <section id="history" style={{ marginTop: 40 }}>
          <h2>History</h2>

          {portfolioLoading ? (
            <p role="status">Įkeliami duomenys…</p>
          ) : portfolioError ? (
            <p role="alert">{portfolioError}</p>
          ) : transactions.length === 0 ? (
            <p>Sandorių kol kas nėra.</p>
          ) : (
            <>
              <p>Rodoma iki 100 naujausių sandorių. Kainos EUR.</p>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Data (Vilniaus laiku)</th>
                      <th scope="col">Akcija</th>
                      <th scope="col">Veiksmas</th>
                      <th scope="col">Kiekis</th>
                      <th scope="col">Vieneto kaina (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          {new Date(
                            transaction.created_at
                          ).toLocaleString('lt-LT', {
                            timeZone: 'Europe/Vilnius',
                          })}
                        </td>
                        <td>{transaction.symbol}</td>
                        <td>
                          {transaction.type === 'BUY'
                            ? 'Pirkimas'
                            : 'Pardavimas'}
                        </td>
                        <td>{transaction.quantity}</td>
                        <td>
                          {stockPrice.format(Number(transaction.price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <footer className="footer">
          <span>SIMULIATORIUS</span>
          <span>
            Investuok ir mokykis savo tempu
            <span className="footer-star" aria-hidden="true"> ✳</span>
          </span>
        </footer>
      </section>
    </main>
  )
}

export default App
