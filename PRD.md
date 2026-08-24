# Product Requirements Document (PRD) — DocPulse Healthcare Platform

**Project**: DocPulse — Doctor–Patient Healthcare Web Platform  
**Target Audience**: Licensed Doctors (General Practitioners & Specialists) and Patients  
**Strict Scope Boundary**: Focused ONLY on Doctors and Patients. Out of scope: Pharmaceutical companies, medicine delivery, medical stores.  
**Document Version**: 1.0.0  
**Status**: Approved & Implemented  

---

## 1. Executive Summary & Vision

DocPulse is a specialized, production-grade full-stack healthcare web platform engineered to bridge the communication and discovery gap between patients and verified medical doctors. The platform enables patients to find doctors by medical specialization, disease symptoms, and geographic location, review doctor qualifications, check real-time availability, and book appointments without double-booking risk. 

Doctors can manage clinical schedules, configure slot intervals, review authorized patient medical histories under strict access-control policies, record clinical consultation notes, and generate digital prescriptions.

The platform integrates safe AI capabilities to help organize patient intake information and recommend doctor specialties, with strict medical safety guardrails forbidding diagnosis or prescription.

---

## 2. Target Personas & User Journeys

### 2.1 Patient Persona (Alex Morgan)
- **Profile**: Working professional seeking specialized care for persistent symptoms.
- **Needs**:
  - Search verified doctors by disease/symptom keywords and city.
  - Choose between in-person clinic visits and video consultations.
  - Book guaranteed appointment slots with instant confirmation.
  - Review past medical consultations and download/print prescriptions.
  - Submit ratings and reviews post-consultation.

### 2.2 Doctor Persona (Dr. Sarah Jenkins, MD, FACC)
- **Profile**: Board-certified cardiologist operating a private and hospital practice.
- **Needs**:
  - Showcase credentials, clinical focus, experience, and fee structure.
  - Build weekly working schedules and customize slot durations (15–60 mins).
  - Manage daily consultation rosters (Accept, Conduct, Cancel).
  - Access patient clinical history prior to consultations under privacy-preserving ACL.
  - Issue official digital prescriptions with structured dosages and advice.

---

## 3. Detailed Feature Requirements

### 3.1 Patient Management & Health Portal
| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| **PR-01** | Patient registration and JWT authentication | P0 | Done |
| **PR-02** | Initial health intake capture (concern, duration, past history, allergies, chronic conditions) | P0 | Done |
| **PR-03** | Multi-attribute doctor search (specialization, city, mode, fee) | P0 | Done |
| **PR-04** | Real-time dynamic appointment slot picker with double-booking prevention | P0 | Done |
| **PR-05** | View patient appointment history with status badges (`pending`, `confirmed`, `completed`, `cancelled`) | P0 | Done |
| **PR-06** | Digital prescription viewer with structured medication schedule and print/PDF support | P0 | Done |
| **PR-07** | Post-consultation rating (1–5 stars) and review submission | P1 | Done |

### 3.2 Doctor Practice Management & Clinical Workspace
| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| **DR-01** | Doctor registration with degrees, specialization, experience, hospital name, and fee | P0 | Done |
| **DR-02** | Doctor profile management (biography, location, consultation modes) | P0 | Done |
| **DR-03** | Weekly availability builder (working days, start/end hours, slot duration: 15/30/45/60 min) | P0 | Done |
| **DR-04** | Appointment lifecycle management (Accept Slot, Conduct Consultation, Cancel) | P0 | Done |
| **DR-05** | Clinical consultation logging (diagnosis, consultation notes, treatment plan, vitals, follow-up) | P0 | Done |
| **DR-06** | Structured electronic prescription issuance (medicine name, dosage, frequency, duration) | P0 | Done |
| **DR-07** | Authorized patient list & medical history viewer protected by Doctor-Patient ACL | P0 | Done |
| **DR-08** | Doctor review aggregation and practice performance metrics | P1 | Done |

### 3.3 Safe Healthcare AI Assistance
| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| **AI-01** | Patient Intake Summary generator formatting free-text symptoms into structured JSON | P0 | Done |
| **AI-02** | Doctor Search Assistant mapping natural language symptoms to doctor specializations | P0 | Done |
| **AI-03** | Anti-Prompt-Injection sanitization removing jailbreak attempts | P0 | Done |
| **AI-04** | Absolute Medical Guardrails: AI must NEVER diagnose, prescribe medication, or replace a doctor | P0 | Done |
| **AI-05** | Universal Medical Safety Disclaimer attached to all AI outputs | P0 | Done |

---

## 4. Non-Functional Requirements (NFR)

- **Security**: Passwords hashed using `bcrypt` (10 rounds); API protected by signed JWT tokens; CORS restricted; Helmet security headers enabled; Express rate limiting on auth, AI, and API endpoints.
- **Data Integrity & Dual-Store**:
  - MongoDB for flexible clinical documents (profiles, consultations, prescriptions).
  - PostgreSQL / Prisma for relational transactions, audit ledgers (`UserAuditLog`), and reporting (`DoctorMetric`, `PlatformMetric`).
- **Concurrency & Double-Booking Prevention**: Mathematical slot generation preventing overlapping reservations on the same doctor, date, and time slot.
- **Privacy (Doctor-Patient ACL)**: Doctors cannot view patient medical histories unless an authorized appointment or consultation relationship exists.
- **Responsiveness**: Mobile, tablet, and desktop responsive UI built with Tailwind CSS.

---

## 5. Success Metrics & KPIs
1. **Zero Double-Bookings**: 100% collision prevention under concurrent booking attempts.
2. **100% Guardrail Adherence**: 0 diagnostic claims or medication prescriptions generated by AI.
3. **Sub-100ms API Latency**: High-performance database indexes and caching on doctor searches.
4. **Complete Test Pass Rate**: 100% pass on unit and integration test suites.
