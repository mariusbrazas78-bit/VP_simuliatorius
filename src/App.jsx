import './App.css'

function App() {
  return (
    <main className="dashboard">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="VP Simuliatorius pradžia">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>VP <span className="brand-light">simuliatorius</span></span>
        </a>
        <span className="account-label"><span className="status-dot" /> Mokomoji paskyra</span>
      </header>

      <section className="welcome" id="home">
        <div className="eyebrow"><span className="sparkle">✦</span> TAVO INVESTAVIMO ERDVĖ</div>
        <h1>Virtualios prekybos<br className="desktop-break" /> simuliatorius</h1>
        <p className="intro">Mokomasis akcijų prekybos projektas su virtualiais pinigais.<br className="desktop-break" /> Išbandyk investavimo idėjas nerizikuodamas tikrais pinigais.</p>

        <div className="overview">
          <article className="balance-card">
            <div className="balance-topline">
              <span className="balance-label">VIRTUALUS BALANSAS</span>
              <span className="wallet-icon" aria-hidden="true">€</span>
            </div>
            <div className="balance-value">10 000 <span>€</span></div>
            <div className="balance-foot"><span className="balance-indicator" /> Pradinis kapitalas</div>
            <div className="card-decoration" aria-hidden="true">€</div>
          </article>

          <nav className="navigation" aria-label="Pagrindinė navigacija">
            <h2>Greita navigacija</h2>
            <a className="nav-link" href="#portfolio">
              <span className="nav-icon portfolio-icon" aria-hidden="true"><span /></span>
              <span className="nav-copy"><strong>Portfolio</strong><small>Peržiūrėk savo investicijas</small></span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>
            <a className="nav-link" href="#trade">
              <span className="nav-icon trade-icon" aria-hidden="true">↗</span>
              <span className="nav-copy"><strong>Trade</strong><small>Pažink virtualią prekybą</small></span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>
            <a className="nav-link" href="#history">
              <span className="nav-icon history-icon" aria-hidden="true">◷</span>
              <span className="nav-copy"><strong>History</strong><small>Peržiūrėk veiklos istoriją</small></span>
              <span className="arrow" aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>

        <footer className="footer"><span>SIMULIATORIUS</span><span>Investuok ir mokykis savo tempu <span className="footer-star">✳</span></span></footer>
      </section>
    </main>
  )
}

export default App
