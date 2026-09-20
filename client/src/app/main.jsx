import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');

if (container && container.hasChildNodes()) {
  ReactDOM.hydrateRoot(
    container,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

