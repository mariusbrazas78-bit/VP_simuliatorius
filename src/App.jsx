import { lazy, Suspense, useState } from 'react'
import Portfolio from './Portfolio.jsx'
import Trade from './Trade.jsx'
import History from './History.jsx'
import './App.css'

const ChartPreview = lazy(() => import('./ChartPreview.jsx'))

function App() {
  const [screen, setScreen] = useState('portfolio')
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
        <div className="nav-group" aria-label="Papildomos funkcijos">
          <button className={screen === 'charts' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('charts')}>Grafikai</button>
        </div>
      </nav>

      {demoScreen && <div className="mode-banner" role="note">DEMO REŽIMAS · Demonstraciniai duomenys · Tikra prekyba nevykdoma</div>}

      {screen === 'portfolio' && <Portfolio />}
      {screen === 'trade' && <Trade onBack={() => setScreen('portfolio')} />}
      {screen === 'history' && <History />}
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
