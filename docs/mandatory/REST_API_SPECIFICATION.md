# REST API Specification — DocPulse Healthcare Platform

Comprehensive endpoint documentation for the DocPulse RESTful API.

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/register/patient`
Registers a new patient account with optional health intake details.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Alex Morgan",
    "email": "alex.patient@example.com",
    "password": "password123",
    "mobile": "+1-555-0199",
    "city": "New York",
    "primaryHealthConcern": "Chest tightness during exercise",
    "problemDuration": "3 weeks",
    "pastMedicalHistory": "Mild asthma"
  }
  ```
- **Response**: `201 Created`

### `POST /api/auth/register/doctor`
Registers a new medical practitioner with credentials and clinic locations.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Dr. Sarah Jenkins",
    "email": "sarah.jenkins@docpulse.com",
    "password": "password123",
    "mobile": "+1-555-0101",
    "city": "New York",
    "degree": "MD, FACC",
    "specialization": "Cardiology",
    "experienceYears": 14,
    "hospitalClinic": "Mount Sinai Heart Hospital",
    "serviceLocation": "Suite 400, 1425 Madison Ave, New York",
    "bio": "Board-certified cardiologist...",
    "consultationModes": ["offline", "online"],
    "consultationFee": 750
  }
  ```
- **Response**: `201 Created`

### `POST /api/auth/login`
Authenticates a patient or doctor and returns a JWT token.
- **Access**: Public
- **Request Body**: `{ "email": "alex.patient@example.com", "password": "password123" }`
- **Response**: `200 OK`

### `GET /api/auth/me`
Fetches the profile and availability of the currently authenticated user.
- **Access**: Authenticated (`Bearer <token>`)
- **Response**: `200 OK`

### `POST /api/auth/logout`
Terminates the active session.
- **Access**: Authenticated
- **Response**: `200 OK`

---

## 2. Doctor Endpoints

### `GET /api/doctors`
Search and filter verified medical doctors.
- **Access**: Public
- **Query Params**:
  - `specialization`: e.g. "Cardiology"
  - `city`: e.g. "New York"
  - `mode`: "online" | "offline" | "all"
  - `search`: Keyword string
  - `page`: Page number (default 1)
  - `limit`: Items per page (default 20)
- **Response**: `200 OK`

### `GET /api/doctors/:id`
Retrieves full doctor profile, availability schedule, and patient reviews.
- **Query Params**: `date` (YYYY-MM-DD to compute real-time available slots)
- **Response**: `200 OK`

### `PATCH /api/doctors/me`
Updates doctor qualifications, bio, fees, and clinic location.
- **Access**: Doctor Only (`requireRole('doctor')`)
- **Response**: `200 OK`

### `PUT /api/doctors/me/availability`
Updates weekly practice days, working hours, and slot intervals.
- **Access**: Doctor Only
- **Request Body**:
  ```json
  {
    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "workingHours": { "start": "09:00", "end": "17:00" },
    "slotDurationMinutes": 30,
    "onlineAvailable": true,
    "offlineAvailable": true
  }
  ```
- **Response**: `200 OK`

### `GET /api/doctors/me/appointments`
Fetches doctor's appointment schedule.
- **Access**: Doctor Only
- **Response**: `200 OK`

### `GET /api/doctors/me/patients`
Fetches all unique patients who have scheduled consultations with this doctor.
- **Access**: Doctor Only
- **Response**: `200 OK`

---

## 3. Patient Endpoints

### `GET /api/patients/me`
Fetches authenticated patient's profile and medical history.
- **Access**: Patient Only (`requireRole('patient')`)
- **Response**: `200 OK`

### `PATCH /api/patients/me`
Updates patient health intake, allergies, chronic conditions, and emergency contacts.
- **Access**: Patient Only
- **Response**: `200 OK`

### `GET /api/patients/me/appointments`
Fetches all appointments booked by the patient.
- **Access**: Patient Only
- **Response**: `200 OK`

### `GET /api/patients/me/prescriptions`
Fetches all electronic prescriptions issued to the patient.
- **Access**: Patient Only
- **Response**: `200 OK`

### `GET /api/patients/:patientId/medical-history`
Authorized medical history access.
- **Access**: Doctor (authorized via consultation relationship) or Patient (self)
- **Response**: `200 OK` (or `403 Forbidden` if unauthorized)

---

## 4. Appointment Endpoints

### `POST /api/appointments`
Books an appointment with real-time double-booking prevention.
- **Access**: Patient Only
- **Request Body**:
  ```json
  {
    "doctorId": "65b...",
    "appointmentDate": "2026-08-25",
    "timeSlot": "10:00",
    "mode": "offline",
    "reasonForVisit": "Persistent coughing and fatigue"
  }
  ```
- **Response**: `201 Created` (or `409 Conflict` if slot was already reserved)

### `GET /api/appointments/:id`
Retrieves single appointment details.
- **Access**: Authenticated (Patient or Doctor associated with the appointment)
- **Response**: `200 OK`

### `PATCH /api/appointments/:id/status`
Updates appointment status (`confirmed`, `completed`, `cancelled`).
- **Access**: Doctor or Admin
- **Response**: `200 OK`

### `POST /api/appointments/:id/cancel`
Cancels a scheduled appointment.
- **Access**: Patient or Doctor associated with appointment
- **Request Body**: `{ "reason": "Patient requested cancellation" }`
- **Response**: `200 OK`

---

## 5. Consultation & Prescription Endpoints

### `POST /api/appointments/:id/consultation`
Doctor records clinical consultation notes, physician diagnosis, care plan, vitals, and issues structured prescriptions.
- **Access**: Doctor Only
- **Request Body**:
  ```json
  {
    "consultationNotes": "Patient presented with upper respiratory infection...",
    "diagnosis": "Acute Bronchitis",
    "treatmentNotes": "Prescribed 5-day antibiotic regimen, warm fluids, rest",
    "vitals": { "bloodPressure": "120/80", "pulseRate": "74", "temperature": "99.1 F" },
    "followUpDate": "2026-09-01",
    "prescription": {
      "medications": [
        {
          "medicineName": "Amoxicillin",
          "dosage": "500mg",
          "frequency": "1-0-1 After food",
          "duration": "5 days"
        }
      ],
      "generalAdvice": "Drink plenty of warm fluids."
    }
  }
  ```
- **Response**: `201 Created`

---

## 6. Review Endpoints

### `POST /api/reviews`
Submits a patient review and star rating for a completed appointment.
- **Access**: Patient Only
- **Request Body**:
  ```json
  {
    "doctorId": "65b...",
    "appointmentId": "65b...",
    "rating": 5,
    "comment": "Dr. Jenkins was extremely thorough, attentive, and reassuring.",
    "isAnonymous": false
  }
  ```
- **Response**: `201 Created` (or `400 Bad Request` if appointment is not completed)

### `GET /api/doctors/:id/reviews`
Retrieves reviews for a doctor.
- **Access**: Public
- **Response**: `200 OK`

---

## 7. AI & Analytics Endpoints

### `POST /api/ai/intake-summary`
Organizes patient symptoms into a structured clinical summary.
- **Access**: Authenticated Patient
- **Response**: `200 OK` with structured JSON

### `POST /api/ai/search-assistant`
Translates natural language health questions into medical specializations and filter suggestions with strict anti-diagnosis guardrails.
- **Access**: Public
- **Response**: `200 OK` with structured JSON

### `GET /api/analytics/platform-summary`
Retrieves relational platform metrics and audit summaries from PostgreSQL.
- **Access**: Public / Admin
- **Response**: `200 OK`
