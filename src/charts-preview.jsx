import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ChartPreview from './ChartPreview.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChartPreview />
  </StrictMode>,
);
