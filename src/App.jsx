import Portfolio from './Portfolio.jsx'
import Trade from './Trade.jsx'
import { useState } from 'react'
import './App.css'

function App() {
  const [screen, setScreen] = useState('portfolio')

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
        <button className={screen === 'portfolio' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('portfolio')}>Portfolio</button>
        <button className={screen === 'trade' ? 'screen-tab active' : 'screen-tab'} type="button" onClick={() => setScreen('trade')}>Trade</button>
      </nav>
      {screen === 'portfolio' ? <Portfolio /> : <Trade onBack={() => setScreen('portfolio')} />}
    </main>
  )
}

export default App
