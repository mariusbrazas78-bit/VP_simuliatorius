import { lazy, Suspense, useEffect, useState } from 'react'
import Portfolio from './Portfolio.jsx'
import Trade from './Trade.jsx'
import History from './History.jsx'
import { getTradingData } from './lib/trading'
import './App.css'

const Charts = lazy(() => import('./ChartPreview.jsx'))

function App() {
  const [screen, setScreen] = useState('portfolio')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getTradingData().then((result) => {
      if (active) setData(result)
    }).catch((failure) => {
      if (active) setError(failure.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function refreshTradingData() {
    setLoading(true)
    try {
      const result = await getTradingData()
      setData(result)
      setError('')
    } catch (failure) {
      setError(failure.message)
      throw failure
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setScreen('portfolio')} aria-label="VP Simuliatorius pradžia">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>VP <span className="brand-light">simuliatorius</span></span>
        </a>
        <span className="account-label"><span className="status-dot" /> Mokomoji paskyra</span>
      </header>
      <nav className="screen-nav" aria-label="Pagrindinė navigacija">
        {['portfolio', 'trade', 'history', 'charts'].map((name) => (
          <button key={name} className={screen === name ? 'screen-tab active' : 'screen-tab'}
            aria-pressed={screen === name} type="button" onClick={() => setScreen(name)}>
            {{ portfolio: 'Portfolio', trade: 'Trade', history: 'History', charts: 'Grafikai' }[name]}
          </button>
        ))}
      </nav>
      <div className="mode-banner" role="note">Virtuali prekyba · Bendra demonstracinė paskyra · Pradinis kapitalas 10 000 EUR</div>
      <div className="data-toolbar">
        <button type="button" disabled={loading} onClick={() => { refreshTradingData().catch(() => {}) }}>
          {loading ? 'Įkeliama…' : 'Atnaujinti duomenis'}
        </button>
        <small>Visi komandos nariai naudoja tą patį demonstracinį portfelį.</small>
      </div>
      {loading && <p role="status">Įkeliami paskyros duomenys…</p>}
      {error && <p className="integration-error" role="alert">{error} Duomenų nepavyko atnaujinti.</p>}
      {!loading && !error && data && <>
        {screen === 'portfolio' && <Portfolio {...data} />}
        {screen === 'history' && <History transactions={data.transactions} />}
      </>}
      {screen === 'trade' && <Trade onBack={() => setScreen('portfolio')}
        onTradeCompleted={refreshTradingData} disabled={loading || !!error || !data} />}
      {screen === 'charts' && <Suspense fallback={<p role="status">Įkeliami grafikai…</p>}>
        <Charts snapshots={data?.snapshots || []} loading={loading} error={error} />
      </Suspense>}
    </main>
  )
}

export default App
