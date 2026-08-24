const app = require('./app');
const config = require('./config/env');
const { connectMongoDB } = require('./config/db.mongo');
const { connectPostgres } = require('./config/db.postgres');
const { seedInitialData } = require('./utils/seedData');

const http = require('http');
const { initializeSocket } = require('./config/socket');
const { initializeCronJobs } = require('./jobs/cronJobs');

let server;

async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectMongoDB();

    // 2. Connect to PostgreSQL (Prisma)
    await connectPostgres();

    // 3. Seed initial sample data if clean database
    await seedInitialData();

    // 4. Create HTTP Server & Bind WebSockets
    server = http.createServer(app);
    initializeSocket(server, config.clientUrl);

    // 5. Initialize Background Cron Jobs
    initializeCronJobs();

    server.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`  DocPulse Healthcare Server running on port ${config.port}`);
      console.log(`  Environment : ${config.env}`);
      console.log(`  Client URL  : ${config.clientUrl}`);
      console.log(`  API Base    : http://localhost:${config.port}/api`);
      console.log(`  WebSockets  : Enabled`);
      console.log(`  Cron Jobs   : Initialized`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('[Server Startup Error]', error);
    process.exit(1);
  }
}

// Graceful Shutdown
const handleShutdown = (signal) => {
  console.log(`\n[Shutdown] ${signal} received. Closing HTTP server gracefully...`);
  if (server) {
    server.close(() => {
      console.log('[Shutdown] HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Promise Rejection]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});

startServer();
