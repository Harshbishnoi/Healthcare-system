# Backend & System Design — Documentation

This document explains the backend architecture, security pipelines, dual-database design, and system patterns in the **DocPulse Healthcare Platform**.

---

## 1. REST API Design & HTTP Status Codes

The API conforms to strict RESTful conventions using standardized HTTP response envelopes:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource fetched successfully",
  "data": { ... },
  "meta": { "total": 45, "page": 1 }
}
```

### Standardized Status Codes
| HTTP Code | Name | Platform Usage |
| :--- | :--- | :--- |
| **200** | OK | Successful GET, PATCH, and PUT requests |
| **201** | Created | Successful resource creation (Register, Book Appointment, Issue Consultation, Create Review) |
| **204** | No Content | Successful resource removal with empty body |
| **400** | Bad Request | Malformed requests or invalid parameters |
| **401** | Unauthorized | Missing, invalid, or expired JWT authentication token |
| **403** | Forbidden | Role mismatch (e.g. Doctor trying to access Patient `/me` or doctor attempting to view unauthorized medical history) |
| **404** | Not Found | Resource not found in database |
| **409** | Conflict | Slot collision (already booked time slot) or duplicate email registration |
| **422** | Unprocessable Entity | Input schema validation failures (`express-validator`) |
| **429** | Too Many Requests | Rate limit exceeded on authentication, AI, or general endpoints |
| **500** | Internal Server Error | Unhandled runtime or operational server exceptions |

---

## 2. Middleware Chain & Execution Pipeline

Incoming requests traverse an isolated, layered middleware pipeline:

```text
Incoming HTTP Request
       │
       ▼
1. Helmet Security Headers (`server/app.js`)
       │
       ▼
2. CORS (Restricted to Authorized Client Origins)
       │
       ▼
3. Morgan HTTP Request Logger
       │
       ▼
4. Express Rate Limiter (`generalLimiter`, `authLimiter`, `aiLimiter`)
       │
       ▼
5. JSON Body Parser & URL-Encoder
       │
       ▼
6. Authentication Guard (`verifyAuth` in `server/middleware/authMiddleware.js`)
       │
       ▼
7. Role Authorization (`requireRole('doctor'|'patient')` in `server/middleware/roleMiddleware.js`)
       │
       ▼
8. Doctor-Patient Access ACL (`verifyDoctorPatientAccess` in `server/middleware/authorizationMiddleware.js`)
       │
       ▼
9. Input Validation (`express-validator` schemas in `server/schemas/`)
       │
       ▼
10. Business Controller & Service Layer
       │
       ▼
11. Centralized Error Handler (`server/middleware/errorHandler.js`)
```

---

## 3. Dual-Database Separation of Concerns

### MongoDB (Mongoose) — Document Clinical Store
- **Purpose**: Document-centric clinical data, rich user profiles, flexible intake records, and slot availability schemas.
- **Models**: `User`, `DoctorProfile`, `PatientProfile`, `Availability`, `Appointment`, `Consultation`, `Prescription`, `Review`.
- **Optimization**: Compound indexing on `{ city: 1, specialization: 1 }` and `{ doctorId: 1, appointmentDate: 1, timeSlot: 1 }`. Aggregation pipelines for doctor search, rating recalculations, and patient grouping.

### PostgreSQL (Prisma) — Relational Reporting & Audit Ledger
- **Purpose**: Relational audit tracking, transactional integrity, cross-entity relational reporting with SQL JOINs, grouping, and aggregations.
- **Models**:
  - `UserAuditLog` (IP, User-Agent, user action timestamp audit)
  - `AppointmentRecord` (Financial, fee, and slot synchronization)
  - `DoctorMetric` (Practice metrics, total completed/cancelled appointments, average ratings)
  - `ConsultationAudit` (Diagnosis classification and prescription count)
  - `PlatformMetric` (Daily system-wide analytics)

---

## 4. Security & Environment Configuration

- **Password Hashing**: Bcrypt with configurable salt rounds (default 10). Plaintext passwords are never logged or stored.
- **JWT Cryptography**: Signed with strong server-side secret and structured expiration (`7d`). Passwords excluded from query projections via Mongoose `select: false`.
- **Environment Secrets Management**: Configured in `server/config/env.js`, loaded via `dotenv`, and excluded from Git version control via `.gitignore`.
- **Doctor-Patient Access Control (ACL)**: Doctors can only view a patient's historical medical records if an active or past appointment exists between them.
