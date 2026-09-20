const { PrismaClient } = require('@prisma/client');
const config = require('./env');

let prisma;

try {
  prisma = new PrismaClient({
    log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
} catch (error) {
  console.warn('[Prisma] Client initialization warning:', error.message);
  prisma = null;
}

const mockStore = {
  appointments: new Map(),
  auditLogs: [],
  payments: new Map(),
  metrics: new Map(),
  consultations: new Map(),
  consultationAudits: [],
};

const createMockPrisma = () => {
  const client = {
    userAuditLog: {
      create: async (d) => {
        const record = { id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, ...d?.data, createdAt: new Date() };
        mockStore.auditLogs.push(record);
        return record;
      },
      findMany: async () => [...mockStore.auditLogs],
    },
    appointment: {
      create: async (d) => {
        const record = { id: `appt-${Date.now()}`, status: 'confirmed', ...d?.data, createdAt: new Date(), updatedAt: new Date() };
        mockStore.appointments.set(record.id, record);
        return record;
      },
      upsert: async (d) => {
        const existing = Array.from(mockStore.appointments.values()).find(
          (a) => a.mongoAppointmentId === d?.where?.mongoAppointmentId || a.id === d?.where?.id
        );
        const record = existing
          ? { ...existing, ...d?.update, updatedAt: new Date() }
          : { id: `appt-${Date.now()}`, ...d?.create, createdAt: new Date(), updatedAt: new Date() };
        mockStore.appointments.set(record.id, record);
        return record;
      },
      findFirst: async ({ where } = {}) => {
        return Array.from(mockStore.appointments.values()).find((a) => {
          if (where?.doctorId && a.doctorId !== where.doctorId) return false;
          if (where?.timeSlot && a.timeSlot !== where.timeSlot) return false;
          if (where?.status?.in && !where.status.in.includes(a.status)) return false;
          if (where?.NOT?.mongoAppointmentId && a.mongoAppointmentId === where.NOT.mongoAppointmentId) return false;
          return true;
        }) || null;
      },
      findUnique: async ({ where } = {}) => {
        return Array.from(mockStore.appointments.values()).find(
          (a) => a.id === where?.id || a.mongoAppointmentId === where?.mongoAppointmentId
        ) || null;
      },
      update: async (d) => {
        const id = d?.where?.id;
        const existing = mockStore.appointments.get(id) || { id, ...d?.data };
        const updated = { ...existing, ...d?.data, updatedAt: new Date() };
        mockStore.appointments.set(id, updated);
        return updated;
      },
      updateMany: async () => ({ count: 1 }),
      count: async ({ where } = {}) => {
        return Array.from(mockStore.appointments.values()).filter((a) => {
          if (where?.doctorId && a.doctorId !== where.doctorId) return false;
          if (where?.status && a.status !== where.status) return false;
          return true;
        }).length;
      },
      findMany: async () => Array.from(mockStore.appointments.values()),
    },
    appointmentRecord: null,
    consultation: {
      create: async (d) => ({ id: `con-${Date.now()}`, ...d?.data }),
      findUnique: async () => null,
      findMany: async () => [],
    },
    consultationAudit: {
      create: async (d) => {
        const record = { id: `ca-${Date.now()}`, ...d?.data, createdAt: new Date() };
        mockStore.consultationAudits.push(record);
        return record;
      },
      findMany: async () => [...mockStore.consultationAudits],
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
      upsert: async (d) => {
        const record = { id: `pay-${Date.now()}`, status: 'succeeded', ...d?.create, ...d?.update };
        mockStore.payments.set(record.id, record);
        return record;
      },
      updateMany: async () => ({ count: 1 }),
      findMany: async () => Array.from(mockStore.payments.values()),
    },
    doctorMetric: {
      upsert: async (d) => ({ totalAppointments: 1, ...d?.create }),
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
    $transaction: async (cbOrList) => {
      if (Array.isArray(cbOrList)) {
        return await Promise.all(cbOrList);
      }
      if (typeof cbOrList === 'function') {
        // Run with rollback capability: if callback throws, changes inside shouldn't leak
        const snapshot = {
          appointments: new Map(mockStore.appointments),
          auditLogs: [...mockStore.auditLogs],
          payments: new Map(mockStore.payments),
        };
        try {
          return await cbOrList(client);
        } catch (err) {
          // Rollback memory store snapshot
          mockStore.appointments = snapshot.appointments;
          mockStore.auditLogs = snapshot.auditLogs;
          mockStore.payments = snapshot.payments;
          throw err;
        }
      }
      return cbOrList;
    },
    $executeRawUnsafe: async (sql, ...params) => 1,
    $queryRaw: async (sql, ...params) => [],
    $queryRawUnsafe: async (sql, ...params) => [],
    $connect: async () => {},
    $disconnect: async () => {},
  };

  client.appointmentRecord = client.appointment;
  return client;
};

if (!prisma) {
  prisma = createMockPrisma();
} else {
  // Aliases for real Prisma Client
  if (!prisma.appointment && prisma.appointmentRecord) {
    prisma.appointment = prisma.appointmentRecord;
  }
  if (!prisma.appointmentRecord && prisma.appointment) {
    prisma.appointmentRecord = prisma.appointment;
  }
  if (!prisma.consultation && prisma.consultationAudit) {
    prisma.consultation = prisma.consultationAudit;
  }
  if (!prisma.consultationAudit && prisma.consultation) {
    prisma.consultationAudit = prisma.consultation;
  }

  // Intercept $transaction to also inject aliases on interactive transaction object tx
  const originalTx = prisma.$transaction.bind(prisma);
  prisma.$transaction = async function (cbOrList, options) {
    if (typeof cbOrList === 'function') {
      return await originalTx(async (tx) => {
        if (!tx.appointment && tx.appointmentRecord) {
          tx.appointment = tx.appointmentRecord;
        }
        if (!tx.appointmentRecord && tx.appointment) {
          tx.appointmentRecord = tx.appointment;
        }
        if (!tx.consultation && tx.consultationAudit) {
          tx.consultation = tx.consultationAudit;
        }
        if (!tx.consultationAudit && tx.consultation) {
          tx.consultationAudit = tx.consultation;
        }
        return await cbOrList(tx);
      }, options);
    }
    return await originalTx(cbOrList, options);
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
