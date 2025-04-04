import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container is missing');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
