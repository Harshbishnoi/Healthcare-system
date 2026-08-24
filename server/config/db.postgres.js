const { PrismaClient } = require('@prisma/client');
const config = require('./env');

let prisma;

try {
  prisma = new PrismaClient({
    log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
} catch (error) {
  console.warn('[Prisma] Client initialization warning:', error.message);
  // Create resilient stub if client not yet generated
  prisma = {
    userAuditLog: { create: async () => ({}), findMany: async () => [] },
    appointmentRecord: { create: async () => ({}), findMany: async () => [], findUnique: async () => null, update: async () => ({}) },
    doctorMetric: { upsert: async () => ({}), findUnique: async () => null, findMany: async () => [] },
    consultationAudit: { create: async () => ({}), findMany: async () => [] },
    platformMetric: { create: async () => ({}), findFirst: async () => null, findMany: async () => [] },
    $transaction: async (cb) => (typeof cb === 'function' ? cb(prisma) : cb),
    $queryRaw: async () => [],
    $connect: async () => {},
    $disconnect: async () => {},
  };
}

const connectPostgres = async () => {
  try {
    if (prisma.$connect) {
      await prisma.$connect();
      console.log('[PostgreSQL/Prisma] Relational database connection ready.');
    }
  } catch (err) {
    console.warn(`[PostgreSQL/Prisma] Connection notice: ${err.message}`);
  }
};

module.exports = {
  prisma,
  connectPostgres,
};
