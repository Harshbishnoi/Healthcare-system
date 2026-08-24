# React Engineering Concepts — Documentation

This document explains the mandatory React frontend architecture implemented in the **DocPulse Healthcare Platform**, with exact file references and component breakdowns.

---

## 1. React Component Composition

### Definition & Purpose
Component composition is the React design pattern of assembling small, focused, single-responsibility components into sophisticated interfaces using props, specialized child slots, and `children`.

### Implementation Locations & Examples
- **File:** [`client/src/components/common/Modal.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/components/common/Modal.jsx) & [`client/src/components/appointment/BookAppointmentModal.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/components/appointment/BookAppointmentModal.jsx)
  - The generic `Modal` provides accessible keyboard trap logic and backdrop animation, composing the specialized `SlotPicker`, `Input`, and `Button` components without tightly coupling to domain logic.
- **File:** [`client/src/layouts/PatientLayout.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/layouts/PatientLayout.jsx) & [`client/src/layouts/DoctorLayout.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/layouts/DoctorLayout.jsx)
  - Layout wrappers compose the shared `Navbar`, contextual role-based sidebars, floating `ToastContainer`, and dynamic `<Outlet />` pages.

---

## 2. State Management with `useState`

### Definition & Purpose
`useState` is the core React hook that declares state variables in functional components, triggering reactive re-renders when state transitions occur.

### Implementation Locations & Examples
- **File:** [`client/src/components/appointment/SlotPicker.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/components/appointment/SlotPicker.jsx)
  - Manages `selectedDate`, `selectedSlot`, `loadingSlots`, and `slotData` to dynamically display occupied/free time slots.
- **File:** [`client/src/pages/doctor/DoctorAvailabilityPage.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/pages/doctor/DoctorAvailabilityPage.jsx)
  - Manages `workingDays` array, `workingHours` object, and `slotDurationMinutes`.

---

## 3. Side Effects with `useEffect`

### Definition & Purpose
`useEffect` performs side effects in functional components (such as API data fetching, subscription setups, localStorage synchronization, document title updates, and event listener attachments with cleanup functions).

### Implementation Locations & Examples
- **File:** [`client/src/context/AuthContext.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/context/AuthContext.jsx)
  - Validates stored JWT tokens on application mount by invoking `/api/auth/me`.
- **File:** [`client/src/hooks/useDebounce.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/hooks/useDebounce.js)
  - Sets up a timer side-effect to delay search queries and properly cleans it up using `clearTimeout(handler)` when the query value changes.
- **File:** [`client/src/components/common/Modal.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/components/common/Modal.jsx)
  - Adds window `keydown` listener for `Escape` key and resets `document.body.style.overflow` upon unmount.

---

## 4. Client-Side Routing with React Router v6

### Definition & Purpose
Client-side routing allows seamless page transitions in a Single Page Application (SPA) without reloading the HTML document from the server.

### Implementation Locations & Examples
- **File:** [`client/src/app/routes.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/app/routes.jsx)
  - Configures nested `<Route>` hierarchies:
    - Public: `/`, `/doctors`, `/doctors/:id`, `/login`, `/register/patient`, `/register/doctor`
    - Patient Protected: `/patient/dashboard`, `/patient/profile`, `/patient/appointments`, `/patient/prescriptions`
    - Doctor Protected: `/doctor/dashboard`, `/doctor/profile`, `/doctor/availability`, `/doctor/appointments`, `/doctor/patients`, `/doctor/reviews`
- **File:** [`client/src/components/common/ProtectedRoute.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/components/common/ProtectedRoute.jsx)
  - Enforces authentication and role verification before rendering protected children.

---

## 5. Asynchronous API Data Fetching

### Definition & Purpose
Connecting UI components with backend REST endpoints using Axios with centralized request/response interceptors, error normalization, and loading indicators.

### Implementation Locations & Examples
- **File:** [`client/src/services/api.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/services/api.js)
  - Automatic injection of `Authorization: Bearer <token>` header on all outgoing requests and global 401 session expiration handling.
- **File:** [`client/src/services/doctorService.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/services/doctorService.js)
  - Service functions for `getDoctors`, `getDoctorById`, `updateAvailability`, and `getDoctorAppointments`.

---

## 6. Controlled Forms & Input Validation

### Definition & Purpose
Controlled components maintain their form state in React state rather than the DOM, allowing instantaneous client-side validation, error messages, and dynamic state updates.

### Implementation Locations & Examples
- **File:** [`client/src/pages/public/PatientRegisterPage.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/pages/public/PatientRegisterPage.jsx)
- **File:** [`client/src/pages/doctor/DoctorRegisterPage.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/pages/doctor/DoctorRegisterPage.jsx)
- **File:** [`client/src/components/appointment/ConsultationModal.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/components/appointment/ConsultationModal.jsx)
  - Dynamic array form state for adding and removing multiple medication items with dosage, frequency, and duration validation.
