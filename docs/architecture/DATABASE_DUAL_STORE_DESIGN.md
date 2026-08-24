# Dual-Database Store Architecture Design

This document details the architectural rationale and clear boundary separation between **MongoDB (Document Store)** and **PostgreSQL (Prisma Relational Store)** in the DocPulse Healthcare Platform.

---

## 1. Separation of Concerns

```text
┌─────────────────────────────────────────────────────────────┐
│                 DocPulse Express Backend                    │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐
  │     MongoDB Mongoose    │     │    PostgreSQL Prisma    │
  │     (Clinical Store)    │     │   (Relational Ledger)   │
  ├─────────────────────────┤     ├─────────────────────────┤
  │ • User Accounts         │     │ • UserAuditLog          │
  │ • Doctor Profiles       │     │ • AppointmentRecord     │
  │ • Patient Health Intake │     │ • DoctorMetric          │
  │ • Availability Schemas  │     │ • ConsultationAudit     │
  │ • Appointments          │     │ • PlatformMetric        │
  │ • Consultations         │     │ • Relational JOINs      │
  │ • Digital Prescriptions │     │ • Transactional Audits  │
  │ • Patient Reviews       │     │ • Reporting Aggregates  │
  └─────────────────────────┘     └─────────────────────────┘
```

---

## 2. MongoDB Clinical Document Store

### Characteristics
- **Dynamic Schemas**: Clinical records (e.g., patient health intake, variable prescription medication items, dynamic examination vitals) vary significantly per medical specialty. Document databases allow embedded sub-arrays and schema elasticity without requiring expensive ALTER TABLE schema migrations.
- **Search Indexing**:
  - `doctorProfileSchema.index({ city: 1, specialization: 1 })`
  - `appointmentSchema.index({ doctorId: 1, appointmentDate: 1, timeSlot: 1 })`
- **Aggregation Pipelines**: High-performance multi-stage pipelines for doctor discovery, rating recalculations, and patient grouping.

---

## 3. PostgreSQL Prisma Relational Ledger

### Characteristics
- **ACID Transactions & Referential Integrity**: Structured audit trails and immutable logs.
- **Relational Tables & SQL JOINs**:
  - `UserAuditLog` records every login, registration, and consultation creation with foreign user references, client IP, and browser user-agent.
  - `AppointmentRecord` synchronizes fee totals, date timestamps, and statuses for normalized financial queries.
  - `ConsultationAudit` links with `AppointmentRecord` via foreign key cascade (`@relation(fields: [appointmentRecordId], references: [id], onDelete: Cascade)`).
  - `DoctorMetric` maintains aggregate counters for fast practice analytics without full collection scans.
