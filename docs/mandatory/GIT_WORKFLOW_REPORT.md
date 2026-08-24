# Git Workflow & Branching Strategy Report

This document records the Git workflow and branch structure implemented for the **DocPulse Healthcare Platform**.

---

## 1. Branch Hierarchy

```text
main (Production Ready)
  │
develop (Integration Branch)
  ├── feature/auth (Patient & Doctor Auth, JWT, Bcrypt, RBAC)
  ├── feature/doctor-dashboard (Doctor Profile, Availability, Dashboard)
  ├── feature/patient-dashboard (Patient Profile, Health Intake, Dashboard)
  ├── feature/appointments (Slot Math, Concurrency Booking, Double-Booking Prevention)
  ├── feature/ai (Gemini LLM Integration, Intake Summary, Doctor Matcher, Guardrails)
  ├── feature/mongodb (Mongoose Models, Indexes, Aggregation Pipelines)
  └── feature/postgresql (Prisma Schema, Relational Audit Logs, Metrics, SQL JOINs)
```

---

## 2. Feature Branch Summary

| Branch Name | Scope & Responsibilities |
| :--- | :--- |
| `feature/auth` | User model, registration endpoints, bcrypt password hashing, JWT signing/verification, `verifyAuth`, `requireRole`. |
| `feature/doctor-dashboard` | Doctor profile CRUD, availability scheduler, appointments management, patient records. |
| `feature/patient-dashboard` | Patient profile intake, appointment history, digital prescriptions viewer. |
| `feature/appointments` | Slot generation algorithm, real-time availability check, atomic double-booking lock, consultation issuance. |
| `feature/ai` | Google Gemini AI integration, patient intake summary generator, doctor search assistant, prompt-injection sanitization. |
| `feature/mongodb` | Mongoose schemas (`User`, `DoctorProfile`, `PatientProfile`, `Availability`, `Appointment`, `Consultation`, `Prescription`, `Review`), compound indexes, aggregation pipelines. |
| `feature/postgresql` | Prisma schema, `UserAuditLog`, `AppointmentRecord`, `DoctorMetric`, `ConsultationAudit`, relational reporting. |

---

## 3. Remote Repository Synchronization

Configured remote tracking for user repository:
- **Target Repository**: `https://github.com/Harshbishnoi`
