const WIDTH = 600;
const HEIGHT = 260;
const PADDING = 36;

export default function StockChart({ history = [], currency = 'USD' }) {
  if (!history.length) {
    return <p>Grafikui duomenų nėra</p>;
  }

  const prices = history.map((point) => Number(point.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const chartWidth = WIDTH - PADDING * 2;
  const chartHeight = HEIGHT - PADDING * 2;
  const points = history.map((point, index) => {
    const x = PADDING + (index / Math.max(history.length - 1, 1)) * chartWidth;
    const y = HEIGHT - PADDING - ((Number(point.price) - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const firstPoint = history[0];
  const lastPoint = history[history.length - 1];

  return (
    <figure className="stock-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Akcijos kainos grafikas nuo ${firstPoint.date} iki ${lastPoint.date}`}
        style={{ width: '100%', maxWidth: `${WIDTH}px`, height: 'auto' }}
      >
        <line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          stroke="#999"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <figcaption>
        <span>{firstPoint.date}: {Number(firstPoint.price).toFixed(2)} {currency}</span>
        {' — '}
        <span>{lastPoint.date}: {Number(lastPoint.price).toFixed(2)} {currency}</span>
      </figcaption>
    </figure>
  );
}
