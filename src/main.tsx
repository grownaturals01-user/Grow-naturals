import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Design Token Stylesheets (100% Custom CSS Tokens — Zero Tailwind / Bootstrap)
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pos.css';
import './styles/print.css';
import './styles/create-sales-invoice.css';
import './styles/dashboard-modern.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element to mount the application.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
