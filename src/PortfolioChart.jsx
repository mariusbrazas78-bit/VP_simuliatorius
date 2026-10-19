const WIDTH = 600;
const HEIGHT = 260;
const PADDING = 36;

export default function PortfolioChart({ data = [] }) {
  if (!data.length) {
    return <p>Portfelio grafiko duomenų nėra.</p>;
  }

  const values = data.map((point) => Number(point.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const chartWidth = WIDTH - PADDING * 2;
  const chartHeight = HEIGHT - PADDING * 2;
  const points = data.map((point, index) => {
    const x = PADDING + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = HEIGHT - PADDING - ((Number(point.value) - minValue) / valueRange) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Portfelio vertės grafikas nuo ${firstPoint.date} iki ${lastPoint.date}`}
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
        {firstPoint.date}: ${Number(firstPoint.value).toFixed(2)} USD
        {' — '}
        {lastPoint.date}: ${Number(lastPoint.value).toFixed(2)} USD
      </figcaption>
    </figure>
  );
}
