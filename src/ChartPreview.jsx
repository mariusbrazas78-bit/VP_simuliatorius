import PortfolioChart from './PortfolioChart.jsx';
import ProfitLossChart from './ProfitLossChart.jsx';
import StockChart from './StockChart.jsx';
import {
  portfolioDemoData,
  profitLossDemoData,
  stockHistoryDemoData,
} from './chartDemoData.js';

const sectionStyle = {
  marginBottom: '24px',
  padding: '24px',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  background: '#fff',
};

export default function ChartPreview() {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
      <h1>Grafikų peržiūra</h1>
      <p>Visi šiame puslapyje rodomi duomenys yra demonstraciniai.</p>

      <section style={sectionStyle}>
        <h2>Akcijos kainos istorija (AAPL)</h2>
        <StockChart history={stockHistoryDemoData} />
      </section>

      <section style={sectionStyle}>
        <h2>Portfelio vertė</h2>
        <PortfolioChart data={portfolioDemoData} />
      </section>

      <section style={sectionStyle}>
        <h2>Pelnas ir nuostolis</h2>
        <ProfitLossChart data={profitLossDemoData} />
      </section>
    </main>
  );
}
