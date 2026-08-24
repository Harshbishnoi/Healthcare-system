# Low-Level Design (LLD) — DocPulse Healthcare Platform

**Project**: DocPulse Healthcare Platform  
**Document Version**: 1.0.0  
**Status**: Approved & Implemented  

---

## 1. Data Models & Schemas

### 1.1 MongoDB Mongoose Schemas

#### User Schema (`server/models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient', required: true },
  mobile: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.index({ role: 1, city: 1 });
```

#### DoctorProfile Schema (`server/models/DoctorProfile.js`)
```javascript
const doctorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  degree: { type: String, required: true },
  specialization: { type: String, required: true },
  experienceYears: { type: Number, required: true, min: 0 },
  hospitalClinic: { type: String, required: true },
  serviceLocation: { type: String, required: true },
  bio: { type: String, default: '' },
  consultationModes: [{ type: String, enum: ['offline', 'online'] }],
  consultationFee: { type: Number, required: true, min: 0 },
  ratingAvg: { type: Number, default: 5.0, min: 1, max: 5 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

doctorProfileSchema.index({ city: 1, specialization: 1 });
doctorProfileSchema.index({ consultationFee: 1 });
```

#### Appointment Schema (`server/models/Appointment.js`)
```javascript
const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  mode: { type: String, enum: ['offline', 'online'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  reasonForVisit: { type: String, required: true },
  cancellationReason: { type: String, default: null }
}, { timestamps: true });

appointmentSchema.index({ doctorId: 1, appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
```

---

## 2. Dynamic Slot Calculation Algorithm

The slot generation algorithm in [`server/utils/slotCalculator.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/utils/slotCalculator.js) converts working hours to minute intervals and checks booking conflicts:

```text
Algorithm: GenerateAvailableSlots(workingDays, workingHours, slotDuration, targetDate, bookedSlots)
1. DayOfWeek = GetDayName(targetDate) (e.g., 'Monday')
2. If DayOfWeek NOT IN workingDays:
     Return { isWorkingDay: false, slots: [] }
3. StartMinutes = ParseTime(workingHours.start)  // e.g., "09:00" -> 540
4. EndMinutes = ParseTime(workingHours.end)      // e.g., "17:00" -> 1020
5. Slots = []
6. For Time = StartMinutes to (EndMinutes - slotDuration) step slotDuration:
     SlotString = FormatTime(Time)               // e.g., 540 -> "09:00"
     IsBooked = SlotString IN bookedSlots
     Slots.Append({ time: SlotString, isAvailable: NOT IsBooked })
7. Return { isWorkingDay: true, slots: Slots }
```

---

## 3. Sequence Diagrams

### 3.1 Concurrency-Safe Appointment Booking
```
Patient (UI)           Express Route             AppointmentService        MongoDB Collection      Prisma / Postgres
     │                       │                           │                         │                       │
     │── POST /appointments ─►                           │                         │                       │
     │   (docId, date, slot) │── verifyAuth & validation─►                         │                       │
     │                       │                           │── Atomic Conflict Check─►                       │
     │                       │                           │   (status in pending/   │                       │
     │                       │                           │    confirmed)           │                       │
     │                       │                           │◄─ [No Conflict Found] ──│                       │
     │                       │                           │                         │                       │
     │                       │                           │── Appointment.create() ─►                       │
     │                       │                           │◄─ [Appointment Created]─│                       │
     │                       │                           │                                                 │
     │                       │                           │── AuditService.syncAppointmentRecord() ─────────►
     │                       │                           │◄── [Relational Metric Updated] ─────────────────│
     │                       │◄─ Return 201 Created ─────│
     │◄─ 201 JSON Response ──│
```

### 3.2 Doctor-Patient ACL Authorization Check
```
Doctor (UI)           Express Route          authorizationMiddleware       MongoDB (Appointments)     Controller / DB
     │                       │                           │                         │                         │
     │── GET /patients/:id/  │                           │                         │                         │
     │   medical-history ────►── verifyAuth (Doctor) ────►                         │                         │
     │                       │                           │── Check Prior Rel. ─────►                         │
     │                       │                           │   (Appointment.exists   │                         │
     │                       │                           │    or Consultation)     │                         │
     │                       │                           │◄─ [Relationship Exists]─│                         │
     │                       │                           │                                                   │
     │                       │                           │── Delegate to Controller ─────────────────────────►
     │                       │                           │                                                   │
     │                       │◄─ Return Medical History ─┴───────────────────────────────────────────────────│
     │◄─ 200 JSON History ───│
```

---

## 4. REST API Error Response Contracts

All errors are captured by [`server/middleware/errorHandler.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/middleware/errorHandler.js) and normalized into a unified structure:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "The selected time slot (10:00) on 2026-08-25 has already been booked. Please choose another slot.",
  "errors": null,
  "stack": null
}
```

### Input Validation Error Envelope (`422 Unprocessable Entity`)
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Input validation failed on 1 field(s)",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```
