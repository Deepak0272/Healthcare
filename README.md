# Health Tech – Smart Healthcare Management System

A complete, modern, responsive full-stack healthcare platform engineered using **Node.js, Express.js, MongoDB (Mongoose), HTML5, CSS3, JavaScript, and Chart.js**.

Health Tech enables patients to manage digital health records, store and view doctor prescriptions, upload diagnostic lab reports, track vital signs with an automated clinical analytics engine, book specialist appointments with double-booking prevention, and trigger emergency SOS assistance alerts.

---

## 🌟 Key Features

### 1. User Authentication & Role Management
- Patient registration, login, and secure session management.
- Cryptographic password hashing using `bcryptjs` (salt rounds: 10).
- Stateless JWT-based authentication with token verification middleware.
- Role-based access control (`patient`, `doctor`, `admin`).
- User profile management with demographics, blood group, allergies, chronic conditions, and emergency contact details.

### 2. Digital Health Records Management
- Comprehensive health record repository supporting:
  - Doctor Prescriptions with structured medication regimens (dosage, frequency, duration, instructions).
  - Diagnostic Lab Reports & Panels.
  - Clinical Diagnoses & Treatment Plans.
  - Immunization / Vaccination records.
  - Imaging / Radiography files.
- Secure medical report file upload powered by `multer` with strict MIME-type validation and file size restrictions.
- Role-based privacy: patients can only access their personal medical records.

### 3. Vital Signs Monitoring & Chart.js Visualization
- Manual logging of vital signs:
  - Blood Pressure (Systolic / Diastolic in mmHg)
  - Heart Rate (bpm)
  - Blood Glucose (fasting mg/dL)
  - Body Temperature (°F)
  - Body Weight (kg)
- Interactive Chart.js graphs displaying 14-day and 30-day chronological trends.
- Automated evaluation with informational alert banners for readings outside clinical reference margins.

### 4. Native Automated Clinical Analytics Engine
- Embedded clinical analytics service based on clinical standards (AHA / ADA / WHO).
- Compares biometrics against configurable reference ranges.
- Computes mathematical deltas, trajectory direction (`increasing`, `decreasing`, `stable`), and an automated **Health Stability Index (0–100)**.
- Operates directly inside the backend engine with zero external dependencies.
- Mandatory medical disclaimer included on every evaluation.

### 5. Smart Doctor Appointment Scheduling
- Directory of available medical specialists with specializations, qualifications, hospital departments, consultation fees, and ratings.
- Real-time search and specialization filtering.
- **Strict Double-Booking Prevention**: Checks existing confirmed appointments for the selected doctor, date, and time slot before reservation.
- Upcoming and past appointment tracking with patient cancellation workflows.

### 6. Emergency Assistance & SOS Alert System
- Prominent Emergency SOS button on patient dashboard.
- Configurable emergency contacts directory with primary contact designation.
- Dispatches emergency notifications to registered contacts with vital sign context and location details.
- Supports SMTP live email notification or clearly labeled **Interactive Demo Simulation Mode**.
- Audit log storing emergency alert dispatch history and recipient delivery logs.

### 7. Administrative Health Console
- High-level platform statistics (Patients, Doctors, Appointments, Records, Alerts).
- Doctor directory management (add new doctors, set consultation fees, room numbers, and availability).
- Full appointment oversight with status update actions (`Confirmed`, `Completed`, `Cancelled`).
- User management with real-time role permission updates (`patient` ⇄ `doctor` ⇄ `admin`).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons, Chart.js |
| **Backend** | Node.js, Express.js, RESTful Architecture |
| **Database** | MongoDB, Mongoose ODM (with automatic embedded MongoMemoryServer fallback) |
| **Analytics** | Native Clinical Analytics Engine (Node.js) |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |
| **File Storage** | Multer disk storage for medical PDFs and lab images |
| **Notifications** | Nodemailer (with interactive Demo Notification Simulation mode) |

---

## 📁 Project Structure

```
Health Tech/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection & MongoMemoryServer fallback
│   ├── controllers/
│   │   ├── adminController.js     # Administrative oversight & stats
│   │   ├── appointmentController.js # Doctor directory & slot scheduling
│   │   ├── authController.js      # Register, login, profile management
│   │   ├── emergencyController.js # Contacts & SOS trigger logic
│   │   ├── healthMeasurementController.js # Vitals logging & trend fetching
│   │   └── healthRecordController.js # Digital health records CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT protect & role authorize
│   │   ├── errorMiddleware.js     # 404 & centralized error handler
│   │   └── uploadMiddleware.js    # Multer medical report validator
│   ├── models/
│   │   ├── Appointment.js         # Appointment schema & slot index
│   │   ├── Doctor.js              # Doctor directory schema
│   │   ├── EmergencyAlert.js      # SOS alert history & recipient log
│   │   ├── EmergencyContact.js    # Patient emergency contacts
│   │   ├── HealthMeasurement.js   # Vital signs & analytics flags
│   │   ├── HealthRecord.js        # Prescriptions, labs, and attachments
│   │   └── User.js                # User schema, password hashing & profile
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── emergencyRoutes.js
│   │   ├── healthMeasurementRoutes.js
│   │   └── healthRecordRoutes.js
│   ├── seed/
│   │   └── seeder.js              # Synthetic patient, doctor, and records seeder
│   ├── services/
│   │   ├── healthAnalysisService.js # Clinical Analytics Engine (AHA/ADA/WHO)
│   │   └── notificationService.js # Email & Demo simulation service
│   ├── uploads/                   # Uploaded medical reports and images
│   ├── server.js                  # Express application entrypoint
│   └── package.json
├── frontend/
│   ├── index.html                 # Platform landing page
│   ├── login.html                 # Sign In with demo quick-fill
│   ├── register.html              # Patient & Administrator signup
│   ├── dashboard.html             # Main patient health dashboard
│   ├── appointments.html          # Doctor directory & appointment booking
│   ├── records.html               # Digital health records & prescriptions
│   ├── monitoring.html            # Vital signs logging & Chart.js trends
│   ├── emergency.html             # Emergency contacts & SOS alerts
│   ├── profile.html               # Patient profile & medical conditions
│   ├── admin.html                 # Administrative oversight portal
│   ├── css/
│   │   ├── style.css              # Global healthcare theme styles
│   │   └── dashboard.css          # Dashboard layout, sidebar & stat cards
│   └── js/
│       ├── api.js                 # Centralized API client & toast alerts
│       ├── auth.js                # Auth guards & session management
│       ├── dashboard.js           # Dashboard metrics & SOS modal
│       ├── monitoring.js          # Vital logging & chart rendering
│       ├── records.js             # Records filter, view & file uploads
│       ├── appointments.js        # Doctor booking & conflict check
│       ├── emergency.js           # Emergency contacts & SOS dispatch
│       ├── profile.js             # Profile updates
│       └── admin.js               # Admin console logic
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ or v24+)
- **MongoDB** (Optional: If local MongoDB is running on port 27017, the application connects to it. If MongoDB is not installed, the application automatically launches an embedded in-memory MongoDB server with zero setup required!)

---

### 2. Running the Application

1. Open your terminal in the project directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
   *The backend will connect to MongoDB, populate synthetic demo records, and serve the web application at **`http://localhost:5000`**.*

---

## 🔑 Pre-Seeded Synthetic Demo Accounts

The application automatically seeds realistic clinical demo data on initial launch:

| Role | Email | Password | Description |
|---|---|---|---|
| **Patient / Admin** | `patient@healthtech.com` | `Patient@12345` | Johnathan Doe (Full Admin + Patient access). Includes historical vitals, active prescriptions, lab panels, and an upcoming appointment. |
| **Administrator** | `admin@healthtech.com` | `Admin@12345` | System Administrator. Has full access to Doctor Directory Management, User Permissions, and Platform Stats. |

*(Quick-fill buttons are provided on the login page for instantaneous 1-click access!)*

---

## 🔗 REST API Endpoints Overview

### Authentication & Profile
- `POST /api/auth/register` - Create patient or administrator account
- `POST /api/auth/login` - Authenticate user and receive JWT
- `GET /api/auth/me` - Retrieve authenticated user profile
- `PUT /api/auth/profile` - Update demographics, allergies, and contact info

### Digital Health Records
- `GET /api/health-records` - Retrieve user health records (filter by type or search)
- `POST /api/health-records` - Create new record with optional file attachment
- `POST /api/health-records/upload` - Upload medical report file
- `GET /api/health-records/:id` - Fetch detailed single record
- `PUT /api/health-records/:id` - Update medical record
- `DELETE /api/health-records/:id` - Remove medical record

### Health Monitoring & Biometrics
- `GET /api/health-measurements` - Retrieve recorded vital signs
- `POST /api/health-measurements` - Log new measurement (evaluated by clinical analytics engine)
- `GET /api/health-measurements/latest` - Fetch most recent vital reading
- `GET /api/health-measurements/trends` - Fetch Chart.js trend datasets & statistical summaries
- `DELETE /api/health-measurements/:id` - Remove measurement reading

### Doctors & Appointments
- `GET /api/doctors` - Browse active doctors directory
- `GET /api/doctors/:id` - Retrieve doctor details & booked slots for given date
- `POST /api/doctors` - Add new doctor (Admin only)
- `PUT /api/doctors/:id` - Update doctor profile (Admin only)
- `DELETE /api/doctors/:id` - Deactivate doctor profile (Admin only)
- `GET /api/appointments` - Fetch upcoming and historical appointments
- `POST /api/appointments` - Book appointment with conflict & double-booking prevention
- `PUT /api/appointments/:id` - Reschedule or update appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment with reason

### Emergency Assistance & SOS
- `GET /api/emergency/contacts` - Retrieve patient emergency contacts
- `POST /api/emergency/contacts` - Add new emergency contact
- `PUT /api/emergency/contacts/:id` - Edit contact
- `DELETE /api/emergency/contacts/:id` - Remove contact
- `POST /api/emergency/alerts` - Trigger Emergency SOS broadcast (Email/Demo simulation)
- `GET /api/emergency/alerts` - View audit history of triggered alerts

### Administrative Portal
- `GET /api/admin/stats` - Total counts of patients, doctors, appointments, records, and alerts
- `GET /api/admin/users` - Retrieve users with role filtering
- `PUT /api/admin/users/:id` - Update user role or active status

---

## ⚕️ Mandatory Medical Disclaimer

Health Tech is a software management platform designed for personal wellness organization and healthcare scheduling. Biometric calculations, reference comparisons, and informational alerts provided by the system are for informational purposes only and do **not** constitute medical advice, clinical diagnoses, or therapeutic plans. 

The Emergency SOS feature operates in personal notification mode and does **not** automatically dispatch municipal 911 or first responders. In any life-threatening medical emergency, always dial your local emergency services directly.
