const WIDTH = 600;
const HEIGHT = 260;
const PADDING = 36;

export default function ProfitLossChart({ data = [] }) {
  if (!data.length) {
    return <p>Pelno ir nuostolio grafiko duomenų nėra.</p>;
  }

  const values = data.map((point) => Number(point.profitLoss));
  const maxMagnitude = Math.max(...values.map((value) => Math.abs(value)), 1);
  const chartWidth = WIDTH - PADDING * 2;
  const chartHeight = HEIGHT - PADDING * 2;
  const zeroY = PADDING + chartHeight / 2;
  const points = data.map((point, index) => {
    const x = PADDING + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = zeroY - (Number(point.profitLoss) / maxMagnitude) * (chartHeight / 2);
    return `${x},${y}`;
  }).join(' ');
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Pelno ir nuostolio grafikas nuo ${firstPoint.date} iki ${lastPoint.date}`}
        style={{ width: '100%', maxWidth: `${WIDTH}px`, height: 'auto' }}
      >
        <line
          x1={PADDING}
          y1={zeroY}
          x2={WIDTH - PADDING}
          y2={zeroY}
          stroke="#666"
          strokeDasharray="5 5"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <figcaption>
        {firstPoint.date}: {Number(firstPoint.profitLoss).toFixed(2)} €
        {' — '}
        {lastPoint.date}: {Number(lastPoint.profitLoss).toFixed(2)} €
      </figcaption>
    </figure>
  );
}
