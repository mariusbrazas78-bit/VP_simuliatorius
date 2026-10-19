import { useEffect, useState } from 'react';
import StockChart from './StockChart.jsx';

const SYMBOLS = ['AAPL', 'MSFT', 'TSLA'];

export default function StockPrice() {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadStock() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/stock?symbol=${encodeURIComponent(selectedSymbol)}`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Nepavyko gauti akcijos kainos. Bandykite vėliau.');
        }

        setStock(data);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Nepavyko susisiekti su akcijų kainų tiekėju.');
          setStock(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadStock();

    return () => controller.abort();
  }, [selectedSymbol]);

  return (
    <section className="stock-price" aria-labelledby="stock-price-title">
      <h2 id="stock-price-title">Akcijų kaina</h2>

      <label htmlFor="stock-symbol">Pasirinkite akciją</label>
      <select
        id="stock-symbol"
        value={selectedSymbol}
        onChange={(event) => setSelectedSymbol(event.target.value)}
      >
        {SYMBOLS.map((symbol) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>

      {loading && <p role="status">Kraunama...</p>}
      {!loading && error && <p role="alert">{error}</p>}
      {!loading && !error && stock && (
        <div>
          <p>
            <strong>{stock.symbol}</strong>: {Number(stock.price).toFixed(2)} {stock.currency}
          </p>
          <p>Duomenų data: {stock.updatedAt}</p>
          <StockChart history={stock.history} currency={stock.currency} />
        </div>
      )}
    </section>
  );
}
