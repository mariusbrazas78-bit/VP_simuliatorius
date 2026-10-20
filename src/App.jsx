import { lazy, Suspense, useEffect, useState } from 'react'
import Portfolio from './Portfolio.jsx'
import Trade from './Trade.jsx'
import History from './History.jsx'
import './App.css'

const TradeForm = lazy(() => import('./TradeForm.jsx'))
const StockPrice = lazy(() => import('./StockPrice.jsx'))
const ChartPreview = lazy(() => import('./ChartPreview.jsx'))

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
  const [screen, setScreen] = useState('portfolio')
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [positions, setPositions] = useState([])
  const [transactions, setTransactions] = useState([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioError, setPortfolioError] = useState('')

  useEffect(() => {
    if (screen !== 'supabase') return undefined

    let active = true
    setPortfolioLoading(true)
    setPortfolioError('')
    setProfileError('')

    import('./lib/trading.js')
      .then(({ getProfile, getPositions, getTransactions }) =>
        Promise.all([getProfile(), getPositions(), getTransactions()]),
      )
      .then(([profileData, positionsData, transactionsData]) => {
        if (!active) return
        setProfile(profileData)
        setPositions(positionsData)
        setTransactions(transactionsData)
      })
      .catch((error) => {
        if (!active) return
        setProfileError(error.message || 'Nepavyko gauti paskyros duomenų.')
        setPortfolioError(error.message || 'Nepavyko įkelti portfelio duomenų.')
      })
      .finally(() => {
        if (active) setPortfolioLoading(false)
      })

    return () => {
      active = false
    }
  }, [screen])

  async function refreshTradingData() {
    const { getProfile, getPositions, getTransactions } = await import('./lib/trading.js')
    const [profileData, positionsData, transactionsData] = await Promise.all([
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

  const demoScreen = ['portfolio', 'trade', 'history'].includes(screen)

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="VP Simuliatorius pradžia">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>VP <span className="brand-light">simuliatorius</span></span>
        </a>
        <span className="account-label"><span className="status-dot" /> Mokomoji paskyra</span>
      </header>

      <nav className="screen-nav" aria-label="Pagrindinė navigacija">
        <div className="nav-group" aria-label="Demonstraciniai ekranai">
          <span className="nav-group-label">DEMO</span>
          <button className={screen === 'portfolio' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('portfolio')}>Portfolio</button>
          <button className={screen === 'trade' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('trade')}>Trade</button>
          <button className={screen === 'history' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('history')}>History</button>
        </div>
        <div className="nav-group" aria-label="Integracijos">
          <button className={screen === 'supabase' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('supabase')}>Supabase</button>
          <button className={screen === 'api' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('api')}>API</button>
          <button className={screen === 'charts' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('charts')}>Grafikai</button>
        </div>
      </nav>

      {demoScreen && <div className="mode-banner" role="note">DEMO REŽIMAS · Demonstraciniai duomenys · Tikra prekyba nevykdoma</div>}

      {screen === 'portfolio' && <Portfolio />}
      {screen === 'trade' && <Trade onBack={() => setScreen('portfolio')} />}
      {screen === 'history' && <History />}

      {screen === 'supabase' && (
        <section className="live-trading-page" aria-labelledby="live-trading-title">
          <header className="live-trading-header">
            <div>
              <div className="live-trading-eyebrow">SUPABASE INTEGRACIJA</div>
              <h1 id="live-trading-title">Tikra prekyba</h1>
              <p>Šiame ekrane pateikiami Supabase paskyros duomenys ir veikia serverio prekybos forma.</p>
            </div>
            <span className="live-mode-badge">TIKRA INTEGRACIJA</span>
          </header>

          {profileError && <p className="integration-error" role="alert">{profileError}</p>}
          <section className="live-balance-card" aria-label="Supabase virtualus balansas">
            <span>VIRTUALUS BALANSAS · EUR</span>
            {portfolioLoading && !profile ? <p role="status">Įkeliami paskyros duomenys…</p> : profile ? <strong>{money.format(Number(profile.balance))}</strong> : <strong>—</strong>}
          </section>

          <div className="live-trading-grid">
            <section className="live-data-card">
              <h2>Supabase portfelis</h2>
              {portfolioLoading ? <p role="status">Įkeliami duomenys…</p> : portfolioError ? <p role="alert">{portfolioError}</p> : positions.length === 0 ? <p>Turimų akcijų kol kas nėra.</p> : (
                <div className="live-table-wrap"><table><thead><tr><th scope="col">Akcija</th><th scope="col">Kiekis</th></tr></thead><tbody>{positions.map((position) => <tr key={position.symbol}><td>{position.symbol}</td><td>{position.quantity}</td></tr>)}</tbody></table></div>
              )}
            </section>

            <section className="live-data-card live-trade-form-card">
              <h2>Supabase sandoris</h2>
              <Suspense fallback={<p role="status">Įkeliama prekybos forma…</p>}>
                <TradeForm onTradeCompleted={refreshTradingData} />
              </Suspense>
            </section>
          </div>

          <section className="live-data-card live-transactions-card">
            <h2>Supabase sandorių istorija</h2>
            {portfolioLoading ? <p role="status">Įkeliami sandoriai…</p> : portfolioError ? <p role="alert">{portfolioError}</p> : transactions.length === 0 ? <p>Sandorių kol kas nėra.</p> : (
              <>
                <p>Rodoma iki 100 naujausių sandorių. Kainos EUR.</p>
                <div className="live-table-wrap"><table><thead><tr><th scope="col">Data (Vilniaus laiku)</th><th scope="col">Akcija</th><th scope="col">Veiksmas</th><th scope="col">Kiekis</th><th scope="col">Vieneto kaina (EUR)</th></tr></thead><tbody>{transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.created_at).toLocaleString('lt-LT', { timeZone: 'Europe/Vilnius' })}</td>
                    <td>{transaction.symbol}</td>
                    <td>{transaction.type === 'BUY' ? 'Pirkimas' : 'Pardavimas'}</td>
                    <td>{transaction.quantity}</td>
                    <td>{stockPrice.format(Number(transaction.price))}</td>
                  </tr>
                ))}</tbody></table></div>
              </>
            )}
          </section>
        </section>
      )}

      {screen === 'api' && (
        <section className="integration-page">
          <div className="integration-page-heading"><span>JULIJOS INTEGRACIJA</span><h1>Akcijų API</h1><p>Akcijų kainos ja jų istorija pateikiamos per API.</p></div>
          <Suspense fallback={<p role="status">Įkeliamas API ekranas…</p>}><StockPrice /></Suspense>
        </section>
      )}

      {screen === 'charts' && (
        <section className="integration-page">
          <div className="integration-page-heading"><span>GRAFIKŲ PERŽIŪRA</span><h1>Grafikai</h1></div>
          <Suspense fallback={<p role="status">Įkeliami grafikai…</p>}><ChartPreview /></Suspense>
        </section>
      )}
    </main>
  )
}

export default App
