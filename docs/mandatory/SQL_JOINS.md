# SQL (Postgres): Relational Database Multi-Table SQL JOINs Guide

This document details the relational PostgreSQL database schema, Prisma ORM relation joins, raw SQL JOIN queries (INNER JOIN, LEFT JOIN, FULL JOIN), and REST API endpoints implemented in the **DocPulse Healthcare Platform**.

---

## 1. Architectural Overview & Schema Design

DocPulse leverages a dual-database architecture where **PostgreSQL** serves as the relational source of truth for transactional consistency, ACID compliance, financial ledgers, and multi-table relational queries via Prisma ORM and raw SQL.

The relational schema is configured in `prisma/schema.prisma` and `server/prisma/schema.prisma` with Prisma 5's native join engine:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Relational Entity Graph & Foreign Key Constraints

1. **`User` Entity**: Central user account (`id`, `name`, `email`, `role`, `phone`).
   - `doctorProfile`: 1-to-1 relation with `Doctor` (`@relation("UserDoctor")`).
   - `patientProfile`: 1-to-1 relation with `Patient` (`@relation("UserPatient")`).

2. **`Doctor` Entity**: Professional profile (`id`, `userId`, `specialization`, `experienceYears`, `consultationFee`, `ratingAvg`).
   - Relational links to `Appointment[]`, `DoctorReview[]`, `DoctorMetric?`, `MedicalRecord[]`.
   - Many-to-Many relation with `Patient[]` through explicit join table `DoctorPatient`.
   - Many-to-Many relation with `Department[]` through explicit join table `DoctorDepartment`.

3. **`Patient` Entity**: Medical recipient profile (`id`, `userId`, `bloodGroup`, `healthConcern`).
   - Relational links to `Appointment[]`, `DoctorReview[]`, `MedicalRecord[]`.
   - Many-to-Many relation with `Doctor[]` through explicit join table `DoctorPatient`.

4. **`Appointment` Entity (Central Relational Join Hub)**:
   - Foreign key `doctorId` -> references `Doctor(id)` (`onDelete: Cascade`).
   - Foreign key `patientId` -> references `Patient(id)` (`onDelete: Cascade`).
   - 1-to-1 relation to `Consultation` via `appointmentId`.
   - 1-to-1 relation to `PaymentTransaction` via `appointmentId`.

5. **`DoctorReview` Entity**:
   - Foreign key `doctorId` -> references `Doctor(id)`.
   - Foreign key `patientId` -> references `Patient(id)`.

6. **`DoctorPatient` (Explicit Join Table)**:
   - `doctorId`: Foreign key to `Doctor`.
   - `patientId`: Foreign key to `Patient`.
   - Compound unique constraint: `@@unique([doctorId, patientId])`.

7. **`DoctorDepartment` (Explicit Join Table)**:
   - `doctorId`: Foreign key to `Doctor`.
   - `departmentId`: Foreign key to `Department`.
   - Compound unique constraint: `@@unique([doctorId, departmentId])`.

---

## 2. Prisma Relational Multi-Table JOINs

Prisma ORM queries execute relational joins across up to 5 entities simultaneously using `relationLoadStrategy: 'join'` and `include`:

```javascript
const joinedAppointments = await prisma.appointment.findMany({
  where: doctorId ? { doctorId } : {},
  relationLoadStrategy: 'join',
  include: {
    doctor: true,        // SQL INNER JOIN: Appointment -> Doctor
    patient: true,       // SQL INNER JOIN: Appointment -> Patient
    consultation: true,  // SQL LEFT JOIN: Appointment -> Consultation
    payment: true,       // SQL LEFT JOIN: Appointment -> PaymentTransaction
  },
  orderBy: { appointmentDate: 'desc' },
  take: 50,
});
```

---

## 3. Explicit Raw SQL Queries (INNER JOIN, LEFT JOIN, Aggregations)

In addition to Prisma ORM joins, `AnalyticsService.executeRawSqlDoctorJoins()` executes explicit raw PostgreSQL queries using `prisma.$queryRaw`:

```sql
SELECT 
  d.id AS doctor_id,
  d.name AS doctor_name,
  d.specialization,
  COUNT(a.id) AS total_appointments,
  COALESCE(SUM(a.consultation_fee), 0) AS total_revenue,
  COALESCE(AVG(r.rating), 5.0) AS calculated_rating
FROM "Doctor" d
LEFT JOIN "Appointment" a ON d.id = a.doctor_id AND a.status = 'completed'
LEFT JOIN "DoctorReview" r ON d.id = r.doctor_id
GROUP BY d.id, d.name, d.specialization
ORDER BY total_revenue DESC;
```

---

## 4. REST API Endpoints

- **`GET /api/doctors/analytics/sql-joins`**
- **`GET /api/analytics/sql-joins`**

Response payload format:
```json
{
  "success": true,
  "data": {
    "joinedAppointments": [
      {
        "id": "sql-join-appt-001",
        "appointmentDate": "2026-10-15T00:00:00.000Z",
        "doctor": { "name": "Dr. Sarah Jenkins", "specialization": "Cardiology" },
        "patient": { "name": "John Doe", "email": "john.doe@example.com" },
        "consultation": { "diagnosis": "Hypertension Stage 1" }
      }
    ],
    "doctorJoins": [
      {
        "doctor_id": "doc-1",
        "doctor_name": "Dr. Sarah Jenkins",
        "specialization": "Cardiology",
        "total_appointments": 12,
        "total_revenue": 6000,
        "calculated_rating": 4.9
      }
    ]
  },
  "message": "Relational SQL JOINs data retrieved"
}
```

---

## 5. Automated Verification & Testing

The relational SQL join implementations are verified in:
- `tests/sqlJoins.test.js`
- `server/tests/sqlJoins.test.js`

Test coverage verifies:
1. Prisma multi-table relational queries (`findMany` with `include`).
2. Doctor records with joined reviews and metrics.
3. Raw PostgreSQL SQL multi-table `LEFT JOIN` and `GROUP BY` execution.
4. HTTP REST API endpoints returning 200 OK with relational datasets.
