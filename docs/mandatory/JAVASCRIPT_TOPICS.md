# JavaScript Engineering Concepts — Documentation

This document explains the mandatory JavaScript concepts implemented in the **DocPulse Doctor–Patient Healthcare Platform**, with exact code references to the implementation files.

---

## 1. Async / Await

### Definition & Purpose
`async/await` is modern syntactic sugar built on top of ECMAScript Promises. It allows asynchronous code (such as database queries, password hashing, and HTTP requests) to be written and read sequentially without nested callback chains or `.then()` / `.catch()` pyramids.

### Implementation Locations & Examples
- **File:** [`server/services/appointmentService.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/services/appointmentService.js)
  ```javascript
  static async bookAppointment({ patientId, doctorId, appointmentDate, timeSlot, mode, reasonForVisit }) {
    // 1. Await database doctor verification
    const doctorUser = await User.findOne({ _id: doctorId, role: 'doctor' });

    // 2. Await atomic double-booking collision check
    const conflicting = await Appointment.findOne({ doctorId, appointmentDate, timeSlot, status: { $in: ['pending', 'confirmed'] } });

    // 3. Await creation & relational audit sync
    const appointment = await Appointment.create({ ... });
    await AuditService.syncAppointmentRecord({ ... });
    return appointment;
  }
  ```
- **File:** [`client/src/pages/public/DoctorSearchPage.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/pages/public/DoctorSearchPage.jsx)
  ```javascript
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getDoctors(query);
      if (res.success) setDoctors(res.data);
    } catch (err) {
      console.warn(err.message);
    } finally {
      setLoading(false);
    }
  };
  ```

---

## 2. Promises & Concurrency (`Promise.all`)

### Definition & Purpose
A `Promise` represents the eventual completion (or rejection) of an asynchronous operation and its resulting value. `Promise.all` allows parallel execution of multiple independent asynchronous operations, drastically reducing total response latency.

### Implementation Locations & Examples
- **File:** [`server/services/doctorService.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/services/doctorService.js)
  ```javascript
  // Concurrently queries matching doctor documents and total count for pagination
  const [profiles, total] = await Promise.all([
    DoctorProfile.find(query).populate('userId').skip(skip).limit(limit),
    DoctorProfile.countDocuments(query)
  ]);
  ```
- **File:** [`server/utils/jwtUtils.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/utils/jwtUtils.js)
  ```javascript
  // Wraps jsonwebtoken's callback API in a native ES6 Promise
  const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });
  };
  ```

---

## 3. Callbacks & Event Handlers

### Definition & Purpose
A callback is a function passed into another function as an argument to be executed at a later time (e.g. Express middleware pipelines, Axios response transformations, and Node.js process event handlers).

### Implementation Locations & Examples
- **File:** [`server/middleware/authMiddleware.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/middleware/authMiddleware.js)
  ```javascript
  const verifyAuth = async (req, res, next) => {
    // next() is an Express callback delegating control to the next middleware in the chain
    next();
  };
  ```
- **File:** [`server/server.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/server.js)
  ```javascript
  // Graceful shutdown callback on POSIX / OS signals
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  ```

---

## 4. Closures

### Definition & Purpose
A closure is the combination of a function bundled together with references to its surrounding lexical environment. A closure gives an inner function access to an outer function’s scope even after the outer function has returned.

### Implementation Locations & Examples
- **File:** [`server/middleware/roleMiddleware.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/middleware/roleMiddleware.js)
  ```javascript
  // requireRole creates a closure enclosing allowedRoles for the returned Express handler
  const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return next(new AppError('Forbidden', 403));
      }
      next();
    };
  };
  ```
- **File:** [`client/src/hooks/useDebounce.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/hooks/useDebounce.js)
  ```javascript
  // Closure captures `handler` and `value` across re-renders
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  ```

---

## 5. Event Loop & Non-Blocking Asynchronous I/O

### Definition & Purpose
The JavaScript runtime uses a single-threaded Event Loop consisting of Call Stack, Web APIs/Node C++ APIs, Microtask Queue (Promises, `process.nextTick`), and Macrotask Queue (`setTimeout`, `setImmediate`, I/O polling). Asynchronous operations never block the Node.js main thread, enabling high-concurrency API performance.

### Implementation Locations & Examples
- **File:** [`server/app.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/app.js): Asynchronous I/O handling for incoming HTTP traffic, rate limiter counters, and non-blocking JSON body streaming.
- **File:** [`client/src/context/ToastContext.jsx`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/client/src/context/ToastContext.jsx): Utilizes the browser's Macrotask timer queue (`setTimeout`) for automatic toast notification dismissal without blocking UI animations.

---

## 6. Hoisting & Variable Scope (`const`, `let`, Function Declarations)

### Definition & Purpose
Hoisting is JavaScript's default behavior of moving declarations to the top of the current scope during the compilation phase. Block-scoped `const` and `let` enforce Temporal Dead Zone (TDZ) safety, preventing accidental variable redeclarations and undefined reference mutations.

### Implementation Locations & Examples
- **File:** [`server/utils/slotCalculator.js`](file:///C:/Users/Harshit/.gemini/antigravity/scratch/doctor-patient-platform/server/utils/slotCalculator.js): Function declarations (`function parseTime(...)`) hoisted to module scope for mathematical time conversions.
- Strict usage of `const` and `let` across all controllers, services, models, and React components to ensure immutability and prevent variable leakage.
