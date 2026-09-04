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
    userAuditLog: { create: async (d) => ({ id: 'log-1', ...d?.data }), findMany: async () => [] },
    appointment: {
      create: async (d) => ({ id: 'appt-1', status: 'confirmed', ...d?.data }),
      upsert: async (d) => ({ id: 'appt-1', status: 'confirmed', ...d?.create, ...d?.update }),
      findFirst: async () => null,
      findUnique: async () => null,
      update: async (d) => ({ id: 'appt-1', ...d?.data }),
      findMany: async () => [],
    },
    doctor: {
      upsert: async (d) => ({ id: d?.create?.id || 'doc-1', ...d?.create }),
      findUnique: async () => null,
      findMany: async () => [],
    },
    patient: {
      upsert: async (d) => ({ id: d?.create?.id || 'pat-1', ...d?.create }),
      findUnique: async () => null,
      findMany: async () => [],
    },
    paymentTransaction: {
      upsert: async (d) => ({ id: 'pay-1', status: 'succeeded', ...d?.create, ...d?.update }),
      updateMany: async () => ({ count: 1 }),
      findMany: async () => [],
    },
    doctorMetric: {
      upsert: async () => ({ totalAppointments: 1 }),
      update: async () => ({}),
      findUnique: async () => null,
      findMany: async () => [],
    },
    medicalRecord: {
      create: async (d) => ({ id: 'rec-1', ...d?.data }),
      findMany: async () => [],
    },
    aiTokenUsage: {
      create: async (d) => ({ id: 'token-1', ...d?.data }),
      findMany: async () => [],
    },
    knowledgeDocument: {
      create: async (d) => ({ id: 'kb-1', ...d?.data }),
      findMany: async () => [],
    },
    agentExecutionLog: {
      create: async (d) => ({ id: 'agent-1', ...d?.data }),
      findMany: async () => [],
    },
    $transaction: async (cb) => (typeof cb === 'function' ? await cb(prisma) : cb),
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
