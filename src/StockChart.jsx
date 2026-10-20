import { useEffect, useRef, useState } from 'react';

const MAX_WIDTH = 600;
const HEIGHT = 260;
const PADDING = { top: 16, right: 12, bottom: 42, left: 72 };
const CURRENCY_SYMBOLS = { EUR: '€', USD: '$' };

export default function StockChart({ history = [], currency = 'USD' }) {
  const figureRef = useRef(null);
  const [width, setWidth] = useState(MAX_WIDTH);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.min(MAX_WIDTH, Math.round(entry.contentRect.width));
      if (nextWidth > 0) setWidth(nextWidth);
    });

    observer.observe(figure);
    return () => observer.disconnect();
  }, []);

  if (!history.length) {
    return <p>Grafikui duomenų nėra</p>;
  }

  const prices = history.map((point) => Number(point.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const dataRange = maxPrice - minPrice;
  const rangePadding = dataRange === 0 ? Math.max(Math.abs(maxPrice) * 0.05, 1) : dataRange * 0.1;
  const domainMin = Math.max(0, minPrice - rangePadding);
  const domainMax = maxPrice + rangePadding;
  const valueRange = domainMax - domainMin || 1;
  const plotLeft = PADDING.left;
  const plotRight = Math.max(plotLeft + 1, width - PADDING.right);
  const plotTop = PADDING.top;
  const plotBottom = HEIGHT - PADDING.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const yForPrice = (price) => plotBottom - ((price - domainMin) / valueRange) * plotHeight;
  const xForIndex = (index) => plotLeft + (index / Math.max(history.length - 1, 1)) * plotWidth;
  const points = history.map((point, index) => `${xForIndex(index)},${yForPrice(Number(point.price))}`).join(' ');
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, index) => domainMin + (valueRange * index) / tickCount);
  const maxDateLabels = width < 360
    ? 2
    : Math.min(history.length, Math.floor(plotWidth / 54) + 1, 5);
  const xLabelIndexes = [...new Set(
    Array.from({ length: maxDateLabels }, (_, index) => (
      Math.round((index * (history.length - 1)) / Math.max(maxDateLabels - 1, 1))
    )),
  )];
  const currencySymbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const firstPoint = history[0];
  const lastPoint = history[history.length - 1];

  return (
    <figure className="stock-chart" ref={figureRef}>
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Akcijos kainos grafikas ${currency}, nuo ${firstPoint.date} iki ${lastPoint.date}`}
        style={{ width: '100%', maxWidth: `${MAX_WIDTH}px`, height: 'auto' }}
      >
        {yTicks.map((tick, index) => {
          const y = yForPrice(tick);
          return (
            <g key={index}>
              <line
                x1={plotLeft}
                y1={y}
                x2={plotRight}
                y2={y}
                stroke="#e8eee9"
                strokeWidth="1"
              />
              <text
                x={plotLeft - 8}
                y={y + 4}
                textAnchor="end"
                fill="#718078"
                fontSize="10"
              >
                {currencySymbol}{tick.toFixed(2)}
              </text>
            </g>
          );
        })}

        <line x1={plotLeft} y1={plotTop} x2={plotLeft} y2={plotBottom} stroke="#9aa79f" />
        <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke="#9aa79f" />

        <polyline
          points={points}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {xLabelIndexes.map((index) => (
          <text
            key={index}
            x={xForIndex(index)}
            y={HEIGHT - 14}
            textAnchor={index === 0 ? 'start' : index === history.length - 1 ? 'end' : 'middle'}
            fill="#718078"
            fontSize="10"
          >
            {/^\d{4}-\d{2}-\d{2}$/.test(history[index].date)
              ? history[index].date.slice(5)
              : history[index].date}
          </text>
        ))}
      </svg>
      <figcaption>
        <span>{firstPoint.date}: {currencySymbol}{Number(firstPoint.price).toFixed(2)}</span>
        {' — '}
        <span>{lastPoint.date}: {currencySymbol}{Number(lastPoint.price).toFixed(2)}</span>
      </figcaption>
    </figure>
  );
}
