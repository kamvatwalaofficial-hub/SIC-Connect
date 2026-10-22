import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/providers.jsx';
import App from './app/App.jsx';
import './index.css';

const isDemo = import.meta.env.VITE_DEMO === 'true';
const DemoBanner = isDemo
  ? lazy(() => import('./demo/DemoBanner.jsx').then((m) => ({ default: m.DemoBanner })))
  : null;

// Lets the app run from a sub-path such as /SIC-Connect/ (Vite's `base`); "/" otherwise.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isDemo && (
      <Suspense fallback={null}>
        <DemoBanner />
      </Suspense>
    )}
    <BrowserRouter basename={basename}>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
