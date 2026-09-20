import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppRoutes } from './app/routes';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

/**
 * Server-Side Rendering (SSR) Entrypoint for Vite & Express
 * Renders the DocPulse application into an HTML string with static routing context
 *
 * @param {string} url - Request URL path (e.g. '/doctors', '/doctors/123')
 * @param {object} context - Routing and hydration context
 * @returns {{ html: string }} Pre-rendered HTML string
 */
export function render(url = '/', context = {}) {
  const html = ReactDOMServer.renderToString(
    <StaticRouter location={url} context={context}>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </StaticRouter>
  );

  return { html };
}

export default render;
