require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/appError');
const { generalLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.clientUrl || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP Logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Global Rate Limiting
app.use('/api', generalLimiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input Sanitization & Injection Awareness (XSS, NoSQL, SQL)
const { sanitizeInputs } = require('./middleware/sanitizationMiddleware');
app.use(sanitizeInputs);

const path = require('path');
const fs = require('fs');

// API Base Route
app.use('/api', apiRoutes);

// Server-Side Rendering (SSR) Doctor Profile & Directory Routes
const ReactDOMServer = require('react-dom/server');
const { renderDoctorProfileSSR } = require('./ssr/ssrRenderer');
const { renderDoctorDirectoryHtml, SsrDoctorDirectory } = require('./ssr/reactSsrEngine');

// Primary SSR Endpoints for Doctor Directory & Homepage
app.get(['/', '/doctors', '/ssr', '/ssr/doctors'], async (req, res, next) => {
  try {
    const html = await renderDoctorDirectoryHtml();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// Primary SSR Endpoints for Doctor Detail Profiles
app.get(['/doctor/:id', '/doctors/:id', '/ssr/doctor/:id'], async (req, res, next) => {
  try {
    const html = await renderDoctorProfileSSR(req.params.id);
    if (!html) {
      return res.status(404).send('Doctor Profile Not Found');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// Static client build serving with Vite SSR hydration support
const clientDistPath = path.resolve(__dirname, '../client/dist');
const serverEntryPath = path.resolve(__dirname, '../client/dist/server/entry-server.js');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, { index: false }));

  app.get('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    try {
      const templatePath = path.join(clientDistPath, 'index.html');
      if (fs.existsSync(templatePath)) {
        let template = fs.readFileSync(templatePath, 'utf-8');
        if (fs.existsSync(serverEntryPath)) {
          try {
            const { render } = require(serverEntryPath);
            const { html: appHtml } = render(req.originalUrl);
            const html = template.replace('<!--ssr-outlet-->', appHtml);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.status(200).send(html);
          } catch (ssrErr) {
            console.warn('[SSR Middleware Warning]', ssrErr.message);
          }
        }
        return res.sendFile(templatePath);
      }
      next();
    } catch (err) {
      next(err);
    }
  });
}


// Handle 404 for Unmatched API Routes
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server.`, 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
