# Smart Vehicle Insurance Renewal Reminder & Customer Management System — Detailed Development Plan

*(Previously "Vehicle Insurance Expiry Reminder System" — renamed to reflect that the system also tracks renewal status and basic customer management, not just sending reminders.)*

## Project Objective
Develop a web-based application that stores customer and vehicle insurance information, automatically monitors insurance expiry dates, and sends timely reminders to both customers and the insurance business owner — helping improve renewal rates and reduce missed insurance renewals.

## Scope
The system focuses only on:
- Customer Management
- Vehicle Information
- Insurance Policy Details
- Automatic Expiry Monitoring
- Reminder Notifications
- Renewal Tracking
- Reports

The system does **not** include:
- Insurance Purchase
- Premium Calculation
- Claim Processing
- Payment Gateway
- Policy Generation

## Project Assumptions
- Internet connection is available during reminder execution.
- Administrators maintain accurate customer and policy information.
- Notification providers are available and configured.
- Customers have valid contact information.
- System time is synchronized with the server.
- Database backups are configured regularly.

## Project Constraints
- Single organization deployment (Version 1)
- Internet connection required
- Limited by notification provider quotas
- Requires external hosting
- Mobile application excluded from Version 1
- Payment gateway excluded
- Insurance claim processing excluded

## Non-Functional Requirements

### Performance
- Dashboard loads within 2 seconds
- Search results within 1 second

### Reliability
- Daily reminder execution
- Automatic retry mechanism

### Availability
- 99% uptime target

### Security
- JWT Authentication
- Encrypted passwords

### Scalability
- Support 50,000+ customers

### Maintainability
- Modular architecture
- Complete documentation

## Production Readiness
Build the application using production-level architecture and best software engineering practices.
The application must be:
- **Modular**: Structured with clear separation of concerns (Clean Architecture / Service-Repository pattern).
- **Scalable**: Capable of handling thousands of customers, vehicles, and policies without degradation.
- **Maintainable**: Highly readable, type-safe, and self-documenting code.
- **Secure**: Implementing defensive programming against common security vulnerabilities.
- **Well Documented**: Fully explained API surfaces, database schema, setup guides, and inline documentation.
- **Easily Deployable**: Configured for simple containerization or cloud platform deployment (Vercel, Render, Railway).
- **Dual-Purpose**: Highly suitable for both academic evaluation (Final Year Engineering Project) and real-world business use.

## Coding Standards
- Use Clean Architecture principles.
- Follow SOLID Principles.
- Use Repository Pattern for database access layer.
- Use Service Layer for business logic.
- Use Data Transfer Objects (DTOs) for request/response serialization.
- Avoid duplicate code (DRY - Don't Repeat Yourself).
- Use reusable and modular frontend components.
- Follow consistent naming conventions (camelCase for variables/functions, PascalCase for classes/types, snake_case for DB columns).
- Document every module and API surface.
- Write highly scalable and optimized queries.

## Project Structure Rules
- One module per feature
- Independent services
- Shared utilities
- Shared components
- Shared types
- Shared validation
- No circular dependencies
- Strict module boundaries

## API Standards
- RESTful APIs
- Consistent Response Format
- HTTP Status Codes
- Pagination
- Filtering
- Sorting
- Searching
- API Versioning
- Swagger Documentation
- Input Validation

## Database Standards
- Primary Keys
- Foreign Keys
- Indexes
- Transactions
- Soft Delete
- Created At
- Updated At
- Audit Logs
- Migration Versioning

## UI Standards
- Responsive Design
- Dark Mode Ready
- Accessibility
- Loading Indicators
- Empty States
- Error Pages
- Confirmation Dialogs
- Toast Notifications
- Consistent Colors
- Reusable Components

## Performance Requirements
- Lazy Loading
- Pagination
- Image Optimization
- Code Splitting
- Caching
- Database Indexing
- API Response Compression
- Optimized Queries

## Error Handling Standards
- Validation Errors
- Authentication Errors
- Authorization Errors
- Database Errors
- Network Errors
- Notification Errors
- File Upload Errors
- Unexpected Exceptions

## Project Development Rules
- The project must be developed phase-by-phase.
- Each phase must be completed, tested, documented, and reviewed before starting the next phase.
- Do not skip any phase.
- Do not generate placeholder code.
- Every feature must be fully functional before marking it complete.
- Every completed phase must satisfy its Deliverables and Exit Criteria.

## AI Code Generation Rules
- Generate complete production-ready code.
- Never generate pseudo-code.
- Never leave TODO comments.
- Do not leave incomplete functions.
- Every API must be connected to the database.
- Every frontend page must consume the actual backend API.
- Every backend endpoint must be tested.
- Generate reusable code only.

## Database Rules
- Normalize the database.
- Avoid duplicate data.
- Use foreign keys.
- Use indexes where appropriate.
- Use transactions for critical operations.
- Support future schema migration.
- Maintain complete audit history.
- Never delete critical business records permanently unless explicitly required.

## API Development Rules
- Use REST architecture.
- Use consistent response structures.
- Return proper HTTP status codes.
- Implement pagination.
- Support filtering.
- Support searching.
- Validate every request.
- Return meaningful error messages.
- Document every endpoint.

## UI Development Rules
- Create responsive layouts.
- Follow modern UI/UX principles.
- Maintain consistent spacing.
- Use reusable components.
- Show loading indicators.
- Show empty states.
- Show validation messages.
- Show success notifications.
- Show confirmation dialogs before destructive actions.

## Security Rules
- Encrypt passwords.
- Validate every input.
- Protect APIs.
- Use JWT authentication.
- Use secure headers.
- Protect uploaded files.
- Prevent SQL Injection.
- Prevent XSS.
- Prevent CSRF.
- Never expose sensitive data.

## Testing Rules
- Every module must include tests.
- Backend APIs must be tested.
- Reminder engine must be tested.
- Authentication must be tested.
- Database operations must be tested.
- Notification providers must be tested.
- Frontend pages must be tested.
- Fix every failed test before continuing.

## Documentation Rules
- Document every module.
- Document every API.
- Document every database table.
- Document environment variables.
- Document installation steps.
- Document deployment steps.
- Document configuration.
- Generate developer documentation and user documentation.

## Deployment Rules
- Generate deployment-ready configuration.
- Support local development.
- Support production deployment.
- Validate environment variables.
- Generate health-check endpoints.
- Generate backup strategy.
- Generate monitoring configuration.
- Generate deployment documentation.

## How to read this plan
Each phase lists: **Objective**, **Detailed Tasks** (broken into sub-steps), **Deliverables**, and **Exit Criteria** (what must be true before moving to the next phase). Follow the phases in order — later phases assume earlier ones are locked.

---

## Phase 0 — Project Planning & Design

**Objective:** Produce a complete, unambiguous blueprint before any code is written.

### 0.1 Software Requirements Specification (SRS)
- Problem statement: missed renewals cause lapsed coverage, lost business, customer dissatisfaction
- Scope boundary: explicitly exclude online purchasing, claims, premium calculation
- Objectives (bullet list, measurable where possible — e.g. "reduce missed renewals by automating reminders at 6 intervals")
- Functional requirements (one per feature, numbered FR-1, FR-2, ...)
- Non-functional requirements: performance (dashboard load < 2s), security (JWT + hashed passwords), availability (cron must run daily even after redeploys), scalability (support 10k+ customers)
- Assumptions & constraints (single admin role for v1, MySQL only, no mobile app yet)

### 0.2 Use Case Diagram
- Actors: Admin, Cron Scheduler (system actor), Notification Provider (external actor)
- Use cases: Login, Manage Customers, View Dashboard, Search/Filter, Send Manual Reminder, View Reminder History, Export Reports, Manage Settings
- Render as a diagram (actors on the sides, use-case ellipses in the middle, association lines)

### 0.3 System Architecture Diagram
- Layers: React frontend (Vercel) → REST API (Render/Express) → MySQL (Railway)
- Cron job as a background process inside/alongside the backend
- Notification service as an abstraction layer with pluggable providers (Twilio, WhatsApp Business API, Nodemailer) sitting behind a single interface
- Show request flow and the daily 9 AM batch flow separately (they're different paths)

### 0.4 Database Design + ER Diagram
Tables and key fields:
- **Admins**: id, name, email, password_hash, role, created_at
- **Customers**: id, name, mobile, alt_mobile, email, address, notes, preferred_notification_channel, preferred_language, customer_status, created_at
- **Vehicles**: id, customer_id (FK), vehicle_number, vehicle_type, make, model, manufacturing_year, fuel_type
- **InsurancePolicies**: id, vehicle_id (FK), insurance_company, policy_number, insurance_type, start_date, expiry_date, status (active/expired), renewal_status (pending / reminder_sent / customer_contacted / renewed / expired / not_interested), policy_document_url, renewal_amount, last_reminder_date, next_reminder_date
- **Renewals**: id, policy_id (FK), renewal_date, new_expiry_date, renewed_by, remarks — preserves full renewal history instead of overwriting the policy row each time it's renewed
- **ReminderSchedule**: id, policy_id (FK), reminder_type (30d/15d/7d/3d/1d/expiry), scheduled_date, sent (bool)
- **NotificationHistory**: id, reminder_id (FK), recipient_type (customer/admin), channel (sms/whatsapp/email), status (sent/failed/pending), delivery_result, attempt_count, sent_at
- **ActivityLogs**: id, admin_id (FK), action, module, description, ip_address, created_at
- **Settings**: id, key, value (reminder day config, provider toggles, company name/logo/contact number, etc.)
- Indexes: `vehicle_number`, `mobile`, `expiry_date`, `policy_number`, `renewal_status` for fast search/filter
- Relationships: Customer 1→N Vehicles, Vehicle 1→N InsurancePolicies, Policy 1→N Renewals (history), Policy 1→N ReminderSchedule, ReminderSchedule 1→N NotificationHistory, Admin 1→N ActivityLogs

### 0.5 Data Flow Diagram (DFD)
- Level 0: single process "Insurance Reminder System" with external entities Admin and Notification Providers
- Level 1: break into sub-processes — Authenticate Admin, Manage Customer Data, Check Expiries (daily), Send Notification, Update Renewal Status, Log History, Generate Reports

### 0.5a Business Workflow
```
Admin Login
   ↓
Add Customer
   ↓
Add Vehicle
   ↓
Add Insurance Policy
   ↓
Save Details
   ↓
Daily Cron Scheduler
   ↓
Check Expiry Date
   ↓
Send Reminder to Customer
   ↓
Send Reminder to Owner
   ↓
Update Reminder History (renewal_status → reminder_sent)
   ↓
Contact Customer (renewal_status → customer_contacted)
   ↓
Renew Policy (insert row in Renewals, renewal_status → renewed)
   ↓
Update New Expiry Date
   ↓
Generate Reports
```
This is the backbone the Customer Timeline (Phase 3) and `renewal_status` field are built around — every step above is a state change that gets recorded, not just a notification sent.

### 0.6 API Documentation (draft)
Group by resource, method, path, auth requirement, request/response shape:
- `POST /api/auth/login`, `/api/auth/forgot-password`, `/api/auth/change-password`
- `GET/POST/PUT/DELETE /api/customers`, `/api/customers/:id`
- `GET/POST/PUT/DELETE /api/vehicles`, `/api/policies`
- `GET /api/dashboard/summary`
- `GET /api/reminders/history`, `POST /api/reminders/send-manual`
- `PUT /api/policies/:id/renewal-status` (update renewal_status), `POST /api/policies/:id/renew` (creates Renewals row + updates expiry_date)
- `GET /api/customers/:id/timeline` (chronological activity for that customer)
- `GET /api/reports/export?type=pdf|excel|csv&report=<report_name>`
- `GET/PUT /api/settings` (reminder days, channel toggles, company name/logo/contact)

### 0.7 UI Wireframes
Low-fidelity layout for: Login, Dashboard, Customer List, Add/Edit Customer, Reminder History, Reports, Settings, Profile — enough to confirm layout before visual design in Phase 3.

### 0.8 Technology Stack Confirmation
React + TS + Tailwind + Shadcn (frontend); Node + Express + TS + Prisma + MySQL (backend); JWT (auth); node-cron (scheduler); Twilio/WhatsApp Business API/Nodemailer (notifications); Vercel/Render/Railway (hosting).

### 0.9 Project Folder Structure
```
/backend
  /src
    /config        (env, db connection)
    /middleware    (auth guard, error handler, rate limiter, validators)
    /modules
      /auth
      /customers
      /vehicles
      /policies
      /reminders
      /notifications
      /reports
      /settings
      /logs        (audit logging)
    /jobs          (cron scheduler)
    /utils
  prisma/schema.prisma
/frontend
  /src
    /pages
    /components
    /services      (API client)
    /hooks
    /types
```

**Deliverables:** SRS document, use case diagram, architecture diagram, ER diagram, DFD, API doc draft, wireframes, folder structure.

**Exit Criteria:** You've reviewed and approved the schema and API surface — changing them after Phase 1 starts is expensive.

**Milestone: ✅ Phase 0 — Design Approved**

---

## Phase 0.5 — UI/UX Prototype

**Objective:** Finalize user flow and visual direction before any backend or production frontend code is written.

### 0.5.1 Build Clickable Mockups
- Tool choice: Figma (for a pure design artifact) or React mockups with static/mock data (if you'd rather prototype directly in code that can later evolve into Phase 3's real frontend)
- Pages to mock, matching Phase 0 wireframes but now at high fidelity:
  - Login
  - Dashboard (with realistic sample cards/numbers)
  - Customer List (with sample rows, search bar, filter dropdowns)
  - Add/Edit Customer (full form layout)
  - Upcoming Expiry (filtered table view)
  - Reminder History (status badges, sample entries)
  - Reports (export buttons, sample report preview)
  - Settings (reminder-day config, provider toggles)

### 0.5.2 Validate User Flow
- Click through the prototype end-to-end as if you were the admin: login → add customer → check dashboard → view upcoming expiry → export a report
- Note any awkward navigation, missing states (empty list, loading, error), or fields that don't make sense — cheaper to fix here than after Phase 3 is built

### 0.5.3 Lock Visual Direction
- Confirm blue/white theme, typography, spacing, and component style (Shadcn defaults vs. customized) so Phase 3 doesn't second-guess these choices mid-build

**Deliverables:** Figma file or React mockup project covering all 8 pages, with realistic sample data and confirmed navigation flow.

**Exit Criteria:** You've clicked through every page and flow and are satisfied with the layout and navigation before backend development starts.

**Milestone: ✅ Phase 0.5 — Prototype Approved**

---

## Phase 1 — Backend Development

**Objective:** A working, tested REST API backed by MySQL, utilizing production-grade security, logging, and storage modules.

### 1.1 Project Setup
- Init Node.js + TypeScript project, ESLint/Prettier config
- Install Express, Prisma, bcrypt, jsonwebtoken, zod (validation), winston or pino (logging), express-rate-limit, cors, helmet

### 1.1a Environment Configuration
Store every sensitive configuration inside a `.env` file:
- `DATABASE_URL` (MySQL connection string)
- `JWT_SECRET` (For signing access tokens)
- `SMTP_USER` & `SMTP_PASSWORD` (For NodeMailer email provider)
- `SMS_API_KEY` (For Twilio/SMS provider integration)
- `WHATSAPP_API_KEY` (For WhatsApp Business integration)
- `CRON_SECRET` (To secure API-driven cron executions)
- `STORAGE_PROVIDER` (To select cloud/S3 vs local storage)
- `NODE_ENV` (production/development switcher)
- `APP_URL` (Frontend client host)

### 1.2 Database & Prisma
- Write `schema.prisma` matching the Phase 0 ER diagram (incorporating custom columns for `Customers`, `Vehicles`, `InsurancePolicies`, and the `ActivityLogs` table)
- Run initial migration against MySQL (local first, Railway later)
- Seed script with sample admin + a few test customers/policies

### 1.3 Authentication
- Password hashing (bcrypt, salt rounds 10+)
- `POST /auth/login` → issues JWT (short-lived access token; consider refresh token for production)
- Forgot password (token-based reset, expiring link)
- Change password (requires current password)
- Auth middleware: verifies JWT, attaches admin to request
- Role field on Admin model for role-based access

### 1.4 Customer / Vehicle / Policy CRUD
- Controllers + services per resource, following the modules folder structure
- Validation with zod schemas per endpoint (required fields, formats — mobile number pattern, date validity)
- Cascade rules: deleting a customer should either block if active policies exist, or cascade — decide explicitly and document it

### 1.5 Search & Filter APIs
- Search: query param matches across customer name, vehicle number, mobile number, policy number, insurance company, expiry date, renewal status (use indexed columns, `LIKE` with leading wildcard avoided where possible)
- Filters: today's expiry, tomorrow, next 7 days, next 15 days, next 30 days, expired, renewed, pending, by insurance company, by vehicle type — implemented as query params combined with date-range logic on `expiry_date` and equality checks on `renewal_status`

### 1.6 Validation, Logging, Error Handling
- Centralized error-handling middleware returning consistent JSON error shape
- Request logging (method, path, status, latency)
- Input validation errors return 400 with field-level messages
- **Logging requirements**: Maintain distinct log files and categories for tracking system state:
  - Authentication Logs (failed logins, password resets)
  - Reminder Logs (evaluations, scheduled checks)
  - Notification Logs (payloads sent, provider responses)
  - Cron Logs (scheduler triggers, execution details)
  - System Logs (application bootstrap, unhandled exceptions)
  - API Logs (route calls, latency audits)
  - Error Logs (stack traces and system crash metrics)
  - Activity Logs (detailed records matching the `ActivityLogs` database entities)

### 1.7 Renewal Tracking
- `renewal_status` transitions enforced server-side (e.g. can't jump straight from `pending` to `renewed` without at least a manual override reason)
- `POST /policies/:id/renew` inserts a row into `Renewals` (renewal_date, new_expiry_date, renewed_by, remarks) and updates the policy's `expiry_date` and `renewal_status` in a single transaction — old expiry data is never overwritten, only superseded
- Customer timeline endpoint assembles a chronological feed from Customer creation, ReminderSchedule sends, NotificationHistory entries, renewal_status changes, and Renewals rows

### 1.8 Security
Implement layered security shields:
- **JWT Authentication** for all stateful administration requests.
- **Password Hashing** via bcrypt.
- **Role Authorization** validating administrative levels.
- **Rate Limiting** using `express-rate-limit` to prevent brute force.
- **Helmet** to secure HTTP headers.
- **CORS** configured to only allow traffic from authorized domains (`APP_URL`).
- **Input Validation** utilizing strict Zod schemas.
- **SQL Injection Protection** handled natively via Prisma ORM parameterized queries.
- **XSS Protection** to sanitize input scripts.
- **CSRF Protection** for API endpoint routes.
- **Secure File Upload Validation** checking allowed MIME types, sizes, and renaming stored files.
- **Audit Logging** automatically logging all admin operations to `ActivityLogs`.

### 1.9 File Upload Module (Policy Documents)
Allow uploading files securely:
- Insurance Policy PDF
- RC Book
- Other Documents (e.g., previous claims, identity docs)
- Store files securely using cloud storage (e.g., AWS S3 or Cloudinary, with local filesystem fallback determined by `STORAGE_PROVIDER`).
- Maintain a structured upload history mapped to policies/customers.

**Deliverables:** Running Express API, Prisma-managed MySQL schema, Postman/Thunder-Client collection or OpenAPI spec, seed data.

**Exit Criteria:** Every endpoint from the Phase 0 API doc works against a real DB and returns correct data for at least one manual test each.

**Milestone: ✅ Phase 1 — REST API Complete**

---

## Phase 2 — Reminder & Notification Module

**Objective:** Fully automatic, reliable daily reminders with a traceable audit log and provider abstraction.

### 2.1 Reminder Engine
The reminder engine must support multiple triggering models:
- **Internal Scheduler**: Built-in `node-cron` job registered at app startup, scheduled to run daily at 9:00 AM.
- **External Scheduler**: Triggerable endpoint to support external ping systems (e.g. Cron-job.org) for waking up sleeping server nodes.
- **Manual Trigger**: UI dashboard action for administrators to execute immediate expiry checks.
- **API Trigger**: A secured endpoint (`POST /api/reminders/trigger`) protected via `CRON_SECRET`.
- **Idempotency**: The reminder process must be strictly idempotent, checking if a reminder for a given policy and notification interval has already been generated to prevent duplicate dispatches.

### 2.2 Reminder Logic
- Daily job computes, for every active policy, days-until-expiry
- Matches against configured windows: 30/15/7/3/1/0 days
- Creates/updates ReminderSchedule rows and triggers notification dispatch only for unset reminders

### 2.3 Notification Service
Design the notification module using a provider-based architecture. Implement a unified `NotificationService` interface. Implement separate provider classes:
- **SMS Provider** (e.g., Twilio integration)
- **WhatsApp Provider** (e.g., WhatsApp Business API)
- **Email Provider** (e.g., Nodemailer / SMTP)
- **Mock Provider** (Simulated delivery engine that writes payloads to db/disk)
- **Console Provider** (Prints notification payloads to stdout)

Providers must be hot-swappable via environment variables (`NOTIFICATION_PROVIDER`) without modifying core business workflows.

### 2.4 Development Mode (Mock Notifications)
Support mock notifications when running in development environments:
- Instead of sending real SMS, WhatsApp messages, or emails, the system can:
  - Print notifications in the terminal console.
  - Store mock notifications in the database (`NotificationHistory` with mock labels).
  - Save notifications in local log files.
  - Simulate various delivery statuses (success, failed, pending) to test the robustness of the retry queues.
- The provider strategy is toggled seamlessly via `.env` adjustments.

### 2.5 Notification History & Retry
- Every send attempt logged: recipient, channel, status, delivery_result, attempt_count, timestamp
- Failed sends queued for retry with exponential backoff (e.g. retry after 5 min, 30 min, 2 hr; cap at 3 attempts, then mark permanently failed and surface on dashboard)

**Deliverables:** Working cron job, notification service with 3 providers stubbed/integrated, NotificationHistory logging, retry queue.

**Exit Criteria:** Running the cron manually against seed data with expiry dates set to trigger each window produces correct ReminderSchedule and NotificationHistory rows (verify with a provider stub/mock before spending on real SMS/WhatsApp credits).

**Milestone: ✅ Phase 2 — Automatic Reminder System Working**

---

## Phase 3 — Frontend Development

**Objective:** Professional, responsive admin dashboard wired to the live API.

### 3.1 Setup
- Vite + React + TypeScript, Tailwind CSS, Shadcn UI components
- API client (axios or fetch wrapper) with JWT attached to requests, auto-redirect to login on 401

### 3.2 Pages (in build order)
1. **Login** — form + error states
2. **Dashboard** — business-oriented dashboard containing:
   - Today's Expiry
   - Tomorrow's Expiry
   - Next 7 Days
   - Next 15 Days
   - Next 30 Days
   - Pending Renewals
   - Renewed Policies
   - Expired Policies
   - Total Notifications
   - Notification Success Rate
   - Recent Activities (from `ActivityLogs`)
   - Monthly Reports (visual statistics)
   - Quick Actions (trigger reminder run, manual customer check)
3. **Customer List** — table with search bar + filter dropdowns (including renewal status), pagination, renewal-status badge per row
4. **Add/Edit Customer** — form covering all fields from Phase 0 schema (including communication preferences and customer status), client-side validation mirroring backend zod schemas
5. **Customer Profile** — read view with linked vehicles/policies, that customer's reminder history, and a **Customer Timeline** (see 3.2a below)
6. **Upcoming Expiry / Expired Policies** — filtered table views, filterable by renewal status too
7. **Reminder History** — table of NotificationHistory with status badges
8. **Reports** — trigger the business report set (see Phase 4)
9. **Settings** — reminder days (30/15/7/3/1), enable WhatsApp/SMS/Email toggles, company name, company logo, company contact number, admin profile
10. **Profile** — change password, admin details

### 3.2a Customer Timeline
Each customer profile shows a vertical activity feed, sourced from the `/customers/:id/timeline` endpoint:
```
Customer Added
   ↓
Reminder Sent
   ↓
Owner Contacted Customer
   ↓
Renewed
   ↓
New Policy Added
```
Each entry shows a timestamp and, where relevant, links to the underlying NotificationHistory or Renewals record.

### 3.3 UI Design
- Blue/white theme, consistent spacing scale, Shadcn components for tables/forms/dialogs
- Responsive breakpoints for mobile (stacked cards, collapsible sidebar)

**Deliverables:** Full frontend app consuming real backend endpoints.

**Exit Criteria:** An admin can log in, add a customer with a policy, see it reflected correctly on the dashboard counts, and see a reminder history entry after a manual/test send.

**Milestone: ✅ Phase 3 — Full Admin Dashboard Working**

---

## Phase 4 — Reports

**Objective:** Exportable, shareable reports.

- **PDF**: expiring policies, expired policies, customer list, notification history — generated server-side or client-side (e.g., offloaded to client browser libraries for free-tier compatibility)
- **Excel**: same datasets via a library like exceljs, with proper column headers/types
- **CSV**: lightweight export for quick imports elsewhere

**Deliverables:** `/api/reports/export` endpoint + frontend "Export" buttons on relevant pages.

**Exit Criteria:** Each export type opens correctly in its native application and matches on-screen data.

**Milestone: ✅ Phase 4 — Reports Generated**

---

## Phase 5 — Testing

**Objective:** Confidence the system behaves correctly, securely, and safely.

- **Unit Testing**: reminder-window calculation, validation schemas, notification template rendering.
- **Integration Testing**: end-to-end flows (create customer → policy near expiry → engine execution → notification logged).
- **API Testing**: CRUD endpoints, auth flows (valid/invalid credentials, expired token checks).
- **UI Testing**: user interface interactions, form inputs, dynamic dashboard statistics.
- **Cron Testing**: scheduler triggers, timezone configuration handling, and idempotency tests.
- **Notification Testing**: mock provider behaviors, log checking, retry simulation.
- **Security Testing**: SQL injection injection blocks, CSRF/XSS sanitization, rate-limiter validations, and file upload boundary violations.
- **Performance Testing**: loading performance metrics for massive tables, report generation stress tests.

**Deliverables:** Test suite (Jest/Vitest + supertest), test coverage report.

**Exit Criteria:** Core flows (auth, CRUD, reminder logic) covered; critical paths pass in CI.

**Milestone: ✅ Phase 5 — Testing Passed**

---

## Phase 6 — Deployment

**Objective:** Live, production-accessible system.

- **Frontend → Vercel**: connect repo, set build command, configure env vars (API base URL)
- **Backend → Render**: web service pointing at Express app, env vars for DB URL/JWT secret/provider keys
- **Database → Railway MySQL**: provisioned instance, connection string wired into backend env
- **Storage**: AWS S3/Cloudinary configuration for policy PDFs and documents
- **Environment variables**: documented `.env.example` for both frontend and backend
- **Monitoring**: health checks (`/health` API endpoint), response status monitors
- **Backup Strategy**: automated schedule for preserving records (Daily, Manual, Restore validation, Backup logs)

### 6.3 Backup & Recovery
Ensure stable disaster-recovery mechanisms:
- **Daily Backup**: Automated backup scripts running dump processes daily.
- **Manual Backup**: Quick command/UI action triggering database storage snapshots.
- **Restore Backup**: A documented recovery protocol to import database state back from dumps.
- **Export Database**: Dashboard button enabling administrative downloads of structured databases.
- **Backup Logs**: Comprehensive metrics on backup attempts, file sizes, and destination success rates.

**Deliverables:** Live URLs for frontend and backend, deployment configs (`vercel.json`, `render.yaml` or equivalent).

**Exit Criteria:** Full flow works end-to-end on production URLs, not just localhost.

**Milestone: ✅ Phase 6 — Live Deployment Completed**

---

## Phase 7 — Documentation

- **Installation guide**: local setup from clone to running dev servers
- **User manual**: admin-facing, screenshots of each page and what it does
- **API documentation**: finalized from Phase 0 draft, matching actual implementation
- **Database documentation**: final schema with descriptions
- **Deployment guide**: step-by-step for Vercel/Render/Railway
- **Maintenance guide**: how to rotate API keys, add a new notification provider, adjust reminder windows

**Milestone: ✅ Phase 7 — Documentation Completed**

---

## Phase 8 — Academic Deliverables

- Final project report (SRS + design + implementation + testing + results, formatted for submission)
- PPT presentation (problem → solution → architecture → demo → conclusion)
- Viva questions & answers (anticipate questions on architecture choices, security, scalability)
- Source code documentation (inline comments + module-level README files)
- Project demonstration guide (script for a live demo)
- Installation manual (for evaluators to run it themselves)
- Future enhancements write-up

**Milestone: ✅ Phase 8 — Final Report & PPT Ready**

---

## Future Enhancements (post-submission)
- Multi-agent login / role-based access
- Customer self-service portal
- Mobile application
- AI-based renewal-probability prediction
- Google Calendar integration
- Cloud backup automation
- Multi-branch support
- Analytics dashboard

---

## Workflow Summary
```
Phase 0:   Planning & Design
   ↓
Phase 0.5: UI/UX Prototype
   ↓
Phase 1:   Backend Core (API + DB + Auth)
   ↓
Phase 2:   Reminder Engine + Notifications
   ↓
Phase 3:   Frontend Dashboard
   ↓
Phase 4:   Reports & Exports
   ↓
Phase 5:   Testing
   ↓
Phase 6:   Deployment
   ↓
Phase 7:   Documentation
   ↓
Phase 8:   Academic Deliverables (Report, PPT, Viva)
```

## Milestone Checklist
- [ ] Phase 0 — Design Approved
- [ ] Phase 0.5 — Prototype Approved
- [ ] Phase 1 — REST API Complete
- [ ] Phase 2 — Automatic Reminder System Working
- [ ] Phase 3 — Full Admin Dashboard Working
- [ ] Phase 4 — Reports Generated
- [ ] Phase 5 — Testing Passed
- [ ] Phase 6 — Live Deployment Completed
- [ ] Phase 7 — Documentation Completed
- [ ] Phase 8 — Final Report & PPT Ready

## What requires you, not me
- Real Twilio / WhatsApp Business API / SMTP credentials for live notification sending
- Creating and configuring Vercel / Render / Railway accounts and clicking through actual deploys
- Ongoing uptime monitoring and backup execution once deployed
- Final review/approval at each phase's exit criteria before moving forward

---

# FINAL IMPLEMENTATION INSTRUCTIONS

You are acting as a Senior Software Architect, Senior Full-Stack Engineer, UI/UX Designer, Database Architect, DevOps Engineer, QA Engineer, Security Engineer, Technical Writer, and Project Mentor.

Your responsibility is to deliver a complete, production-quality software system that also satisfies all requirements of a Final Year Engineering Project.

────────────────────────────────────────
GENERAL RULES
────────────────────────────────────────

• Follow every phase in this development plan sequentially.

• Never skip a phase.

• Complete all Deliverables and satisfy all Exit Criteria before proceeding.

• Do not redesign previously approved modules unless explicitly required.

• Keep the project within the defined scope.

• Do not introduce unnecessary features.

• Generate production-ready code only.

• Never generate placeholder code.

• Never generate pseudo-code.

• Never leave TODO comments.

• Never leave incomplete methods or modules.

────────────────────────────────────────
ARCHITECTURE
────────────────────────────────────────

Use:
• Clean Architecture
• SOLID Principles
• Repository Pattern
• Service Layer Pattern
• Dependency Injection where appropriate
• Modular Feature-based Folder Structure
• Separation of Concerns
• Reusable Components
• TypeScript Best Practices

────────────────────────────────────────
BACKEND
────────────────────────────────────────

Generate:
• Complete Express Backend
• Prisma ORM
• MySQL Database
• JWT Authentication
• Authorization Middleware
• Validation Layer
• Error Handling
• Logging
• File Upload System
• Reminder Engine
• Notification Service
• Report Generation
• Settings Module
• Activity Logs
• Health Check APIs
• Environment Configuration

Every endpoint must:
• Validate requests
• Return proper HTTP status codes
• Handle exceptions
• Log important operations
• Be fully connected to the database

────────────────────────────────────────
FRONTEND
────────────────────────────────────────

Generate:
• Responsive React Application
• TypeScript
• Tailwind CSS
• Shadcn UI
• Responsive Dashboard
• Customer Management
• Vehicle Management
• Policy Management
• Reminder History
• Reports
• Settings
• Profile Management
• Authentication Pages

Every page must:
• Consume live backend APIs
• Handle loading states
• Handle empty states
• Handle API errors
• Display validation messages
• Support mobile devices

────────────────────────────────────────
DATABASE
────────────────────────────────────────

The database must:
• Be fully normalized
• Use Primary Keys
• Use Foreign Keys
• Use Indexes
• Use Transactions
• Preserve Audit History
• Support Future Migration
• Avoid duplicate data
• Maintain referential integrity

────────────────────────────────────────
SECURITY
────────────────────────────────────────

Implement:
• JWT Authentication
• Password Hashing
• Input Validation
• Role Authorization
• Rate Limiting
• Helmet
• CORS
• SQL Injection Protection
• XSS Protection
• CSRF Protection
• Secure File Upload Validation
• Audit Logging

Never expose secrets.
Never hardcode credentials.

────────────────────────────────────────
NOTIFICATION SYSTEM
────────────────────────────────────────

Design using Provider Pattern.

Support:
• SMS
• WhatsApp
• Email
• Mock Provider
• Console Provider

Provider selection must use environment variables.
Reminder execution must be idempotent.
Prevent duplicate reminders.
Maintain complete notification history.

────────────────────────────────────────
TESTING
────────────────────────────────────────

Generate tests for:
• Backend
• APIs
• Authentication
• Database
• Reminder Engine
• Notification Providers
• Reports
• Frontend
• Security
• Performance

Do not continue until all critical tests pass.

────────────────────────────────────────
DOCUMENTATION
────────────────────────────────────────

Generate:
• API Documentation
• Database Documentation
• Installation Guide
• Deployment Guide
• User Manual
• Developer Guide
• Maintenance Guide
• Environment Variable Documentation
• Project Structure Documentation

────────────────────────────────────────
DEPLOYMENT
────────────────────────────────────────

Support:
• Local Development
• Production Deployment
• Vercel
• Render
• Railway

Generate:
• Environment Files
• Deployment Configuration
• Health Check Endpoint
• Backup Strategy
• Monitoring Configuration

────────────────────────────────────────
CODE QUALITY
────────────────────────────────────────

Every module must include:
• Validation
• Error Handling
• Logging
• Documentation
• Type Safety
• Security
• Unit Tests

Code must be:
• Modular
• Reusable
• Maintainable
• Scalable
• Readable
• Production Ready

────────────────────────────────────────
FINAL QUALITY GATE
────────────────────────────────────────

Before declaring any phase complete, verify that:

✓ All planned functionality is implemented.
✓ No placeholder code exists.
✓ No TODO comments remain.
✓ No compilation errors exist.
✓ No runtime errors exist.
✓ All APIs function correctly.
✓ Frontend and Backend are fully integrated.
✓ Database schema matches implementation.
✓ Authentication works.
✓ Reminder engine works.
✓ Notification providers work.
✓ Reports work.
✓ Documentation is updated.
✓ The project is deployable.

Only after every verification succeeds should the phase be marked complete.

The completed project must be suitable for:
• Final Year Engineering Project submission
• Technical Viva
• GitHub Portfolio
• Small Insurance Agency Production Deployment