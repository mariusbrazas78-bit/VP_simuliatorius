import PortfolioChart from './PortfolioChart.jsx'
import ProfitLossChart from './ProfitLossChart.jsx'
import StockPrice from './StockPrice.jsx'
import { dateTime } from './lib/format'

export default function ChartPreview({ snapshots = [], loading = false, error = '' }) {
  const data = snapshots.map((snapshot) => ({
    date: dateTime(snapshot.created_at),
    value: Number(snapshot.total_value),
    profitLoss: Number(snapshot.total_value) - 10000,
  }))
  return <section className="integration-page">
    <div className="integration-page-heading"><span>EUR · API IR DUOMENŲ BAZĖS DUOMENYS</span><h1>Grafikai</h1></div>
    <div className="chart-panel"><StockPrice /></div>
    <div className="chart-panel"><h2>Portfelio vertė (EUR)</h2>
      {loading ? <p role="status">Įkeliami duomenys…</p> : error ? <p role="alert">{error}</p> : <PortfolioChart data={data} />}</div>
    <div className="chart-panel"><h2>Pelnas / nuostolis (EUR)</h2><p>Portfelio vertė − pradinis 10 000 EUR kapitalas.</p>
      {loading ? <p role="status">Įkeliami duomenys…</p> : error ? <p role="alert">{error}</p> : <ProfitLossChart data={data} />}</div>
    <p>Iki 500 naujausių portfelio įrašų. Datos Vilniaus laiku. Vertė išsaugoma po sėkmingo sandorio.</p>
  </section>
}
