# 🏥 DocPulse — Doctor–Patient Healthcare Platform

A production-grade, full-stack healthcare web application strictly focused on **Doctors and Patients**. DocPulse allows patients to find suitable doctors by disease, health concern, and city, review doctor credentials, check real-time availability, and book online/offline appointments with atomic double-booking prevention.

Doctors can manage their availability, review authorized patient medical histories, record clinical consultations, issue structured digital prescriptions, and receive patient reviews.

---

## 🚀 Key Features

### 👤 Patient Module
- **Patient Registration & Login**: Account setup with mobile, city, and initial health intake profile.
- **Intelligent Doctor Discovery**: Multi-criteria search by disease, specialization, city, consultation mode, and availability.
- **Atomic Slot Booking**: Real-time slot availability calculation with double-booking prevention.
- **Digital Prescriptions & Records**: View official prescriptions with print/PDF support and dosage regimens.
- **Post-Consultation Reviews**: Submit 1–5 star ratings and reviews for completed visits.

### 🩺 Doctor Module
- **Practitioner Registration**: Onboarding with medical degrees, specialization, experience, hospital/clinic locations, and consultation modes.
- **Availability Management**: Weekly schedule builder with customized working days, start/end hours, and slot durations.
- **Schedule & Appointment Management**: Accept, confirm, conduct, and reschedule patient appointments.
- **Clinical Consultation & Prescriptions**: Record physician diagnoses, treatment plans, vitals, follow-up dates, and structured medication schedules.
- **Authorized Patient Medical Records**: Doctor-Patient ACL ensuring access only when an authorized appointment or consultation relationship exists.
- **Practice Analytics & Reviews**: Track completed consultations, patient satisfaction, and patient feedback.

### 🤖 Safe Healthcare AI Integration
- **Feature 1 — Patient Intake Summary**: Organizes patient symptoms and medical history into structured JSON with recommended questions to ask the doctor.
- **Feature 2 — Doctor Search Assistant**: Translates natural language symptom descriptions into recommended medical specializations.
- **Strict Guardrails**: **AI NEVER diagnoses, prescribes medication, or replaces a licensed human physician.**

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript, Tailwind CSS, Lucide Icons, React Router v6 |
| **Backend** | Node.js, Express.js, RESTful Architecture, Centralized Error Handling, Rate Limiting |
| **Database 1** | **MongoDB + Mongoose**: Document store for clinical profiles, availability, appointments, consultations, prescriptions, and reviews |
| **Database 2** | **PostgreSQL + Prisma**: Relational store for transactional ledgering, audit logs (`UserAuditLog`), metrics, and SQL JOINs |
| **AI / LLM** | Google Gemini API with backend-only execution, schema validation, and anti-injection defenses |
| **Security** | JWT (JSON Web Tokens), Bcrypt password hashing, Role-Based Access Control (RBAC), Helmet, CORS |

---

## 📦 Project Structure

```text
doctor-patient-platform/
│
├── client/                               # Frontend React + Vite SPA
│   ├── src/
│   │   ├── app/                          # App entrypoint, Router configuration
│   │   ├── layouts/                      # MainLayout, PatientLayout, DoctorLayout
│   │   ├── pages/                        # Public, Patient, and Doctor pages
│   │   ├── components/                   # DoctorCard, SlotPicker, Modals, AI Drawers
│   │   ├── context/                      # AuthContext, ToastContext
│   │   ├── hooks/                        # useAuth, useDebounce, useFetch
│   │   ├── services/                     # Axios API clients with JWT interceptor
│   │   └── utils/                        # Formatters, constants, helpers
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                               # Backend Express REST API
│   ├── config/                           # MongoDB, Prisma, Gemini AI, Env
│   ├── models/                           # Mongoose Schemas (User, DoctorProfile, Appointment, etc.)
│   ├── controllers/                      # Auth, Doctor, Patient, Appointment, Consultation, AI
│   ├── routes/                           # Modular REST API routes
│   ├── middleware/                       # Auth, RBAC, Doctor-Patient ACL, Validation, Error Handler
│   ├── services/                         # DB queries, slot reservation, safe AI service
│   ├── schemas/                          # Input validation schemas
│   ├── utils/                            # Password hashing, JWT, slot calculator, seed data
│   └── package.json
│
├── prisma/                               # Prisma relational schema
│   └── schema.prisma
│
├── docs/                                 # Complete Technical Documentation
│   ├── architecture/                     # Architecture, Dual Database Store, AI Guardrails
│   └── mandatory/                        # JavaScript, React, Backend System Design, REST APIs, Git Report
│
├── tests/                                # Automated Jest & Supertest suites
│   ├── auth.test.js
│   ├── appointmentSlots.test.js
│   ├── doctorAccessAcl.test.js
│   └── aiGuardrails.test.js
│
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Harshbishnoi/doctor-patient-platform.git
cd doctor-patient-platform

# Install root, server, and client dependencies
npm run install:all
```

### 2. Environment Configuration
Create a `.env` file in the root directory (or use `.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

JWT_SECRET=super_secure_jwt_secret_key_healthcare_2026
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

MONGO_URI=mongodb://127.0.0.1:27017/doctor_patient_platform
DATABASE_URL=file:./dev.db

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Run Development Servers
Start both backend (Port 5000) and frontend (Port 5173) concurrently:
```bash
npm run dev
```

Visit the app at: **`http://localhost:5173`**
API Health Check: **`http://localhost:5000/api/health`**

---

## 🔑 Demo Logins for Instant Testing

The database automatically seeds verified demo accounts on initial startup:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Doctor** | `sarah.jenkins@docpulse.com` | `password123` | Dr. Sarah Jenkins (Cardiology, New York) |
| **Patient** | `alex.patient@example.com` | `password123` | Alex Morgan (Patient with health intake profile) |

*(Quick-login buttons on `/login` automatically autofill these credentials with a single click!)*

---

## 🧪 Running Automated Tests

Run the complete Jest integration and unit test suite:
```bash
npm test
```

Test coverage includes:
- **Authentication & Password Hashing** (`tests/auth.test.js`)
- **Appointment Slot Math & Double-Booking Collision Prevention** (`tests/appointmentSlots.test.js`)
- **Doctor-Patient Access Control (ACL) Enforcement** (`tests/doctorAccessAcl.test.js`)
- **AI Safety Guardrails & Structured Output Schemas** (`tests/aiGuardrails.test.js`)

---

## 📚 Technical Documentation

- 📖 [JavaScript Concepts Documentation](docs/mandatory/JAVASCRIPT_TOPICS.md)
- ⚛️ [React Concepts Documentation](docs/mandatory/REACT_TOPICS.md)
- 🏛️ [Backend System Design Documentation](docs/mandatory/BACKEND_SYSTEM_DESIGN.md)
- 🔌 [REST API Specification](docs/mandatory/REST_API_SPECIFICATION.md)
- 🔀 [Git Workflow Report](docs/mandatory/GIT_WORKFLOW_REPORT.md)
- 💾 [Dual-Database Store Architecture](docs/architecture/DATABASE_DUAL_STORE_DESIGN.md)
- 🛡️ [AI Safety Guardrails Design](docs/architecture/AI_GUARDRAILS_DESIGN.md)

---

## 📄 License
MIT © Harsh Bishnoi
