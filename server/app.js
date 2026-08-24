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

// Server-Side Rendering (SSR) Doctor Profile Route
const { renderDoctorProfileSSR } = require('./ssr/ssrRenderer');
app.get('/ssr/doctor/:id', async (req, res, next) => {
  try {
    const html = await renderDoctorProfileSSR(req.params.id);
    if (!html) {
      return res.status(404).send('Doctor Profile Not Found');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

// Static client build serving
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Handle 404 for Unmatched API Routes
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server.`, 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
