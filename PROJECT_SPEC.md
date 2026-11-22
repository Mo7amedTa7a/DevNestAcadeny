# DevNest Academy — Project Specification (PRD)

## 1. Vision & Scope
**DevNest Academy** is a full-stack Learning Management System (LMS) and marketing platform for a programming academy.
- **Phase 1 Focus:** Launching with the **Front-End Development Course** (HTML, CSS, JS, React, Git, Deployment), while designing the database and UI to seamlessly scale to multiple courses and recorded-only tiers later.
- **Tech Stack:** React (Vite) + Node.js + Express.js + MongoDB (Mongoose).

## 2. Core User Roles
1. **Visitor (Public):** Explores who DevNest Academy is, what we offer, curriculum roadmap, student projects, FAQs, and submits course registration forms when enrollment is open.
2. **Student (Authenticated via Unique Code + Password):** Unlocks the Student Dashboard ONLY after Admin confirms payment. Watches protected recorded sessions released session-by-session, takes quizzes & anti-cheat exams, submits assignments (GitHub/Google Drive links), and tracks grades, progress, & live cohort ranking.
3. **Admin (Instructor/Founder):** Full control dashboard for courses, sessions (drip release), registration forms, payment verification, student code generation, assignment grading, quiz/exam creation, and analytics.

## 3. Core Modules & Features

### A. Public Website & Dynamic Course Registration
- **Landing Page:** Hero section, Academy value proposition ("Who we are & what we offer"), Front-End Course Roadmap, Instructor bio, Student projects showcase, FAQs, and Contact.
- **Dynamic Registration System:**
  - Admin can toggle `isRegistrationOpen` (`true`/`false`) per course and customize cohort name/dates.
  - When open, visitors access a full registration form (Full Name, Email, Phone/WhatsApp, Age, University/Background, Experience Level, Goals, How they heard about us).
  - Submissions appear in Admin Dashboard with payment & status workflow:
    - `paymentStatus`: `unpaid` -> `paid`
    - `status`: `pending` -> `contacted` -> `approved` -> `rejected`
  - **Payment-Gated Activation:** Student Dashboard access and Unique Student Code generation (e.g., `DN-FE-26-001`) are strictly locked until Admin marks `paymentStatus: 'paid'` and approves the enrollment.

### B. Student Portal (Dashboard)
- **Login:** Using Unique Student Code (or Email) + Password. Single active session enforced.
- **Dashboard Overview:** Course progress %, grades breakdown (Assignments + Quizzes + Exams), **Live Rank / Position** among cohort peers, upcoming deadlines, and announcements.
- **Recorded Sessions Viewer:** Custom secure wrapper over YouTube Unlisted videos with dynamic student watermark and anti-download/anti-leak measures. Sessions appear as Admin publishes them session-by-session.
- **Assignments / Tasks:** View task descriptions, deadlines, and submit solutions via validated **GitHub Repository URL** or **Google Drive URL**. View status (`Pending`, `Reviewed`, `Needs Revision`), grade, and instructor feedback.
- **Quizzes & Theoretical Exams:**
  - **Quizzes:** Quick post-session assessments.
  - **Exams:** Formal timed MCQ/True-False exams with strict anti-cheat enforcement and instant/scheduled result display.

### C. Admin Dashboard
- **Overview Analytics:** Total applicants, paid/enrolled students, pending assignment reviews, average exam scores.
- **Course & Session Manager:** Add/edit courses, modules, sessions, YouTube Video IDs, and toggle `isPublished` / `releaseDate` session-by-session.
- **Registration & Payment Manager:** Toggle registration forms, filter/search applicants, mark `paid`, approve/reject, export to CSV, and auto-generate Student Accounts + Unique Codes.
- **Assignment Manager & Code Reviewer:** Create assignments with deadlines and max scores. Review student submissions with quick-open GitHub/Drive links, assign grades, and write feedback.
- **Quiz & Exam Builder:** Create quizzes or strict exams, set duration, passing score, `strictAntiCheat` toggle, max cheat-strikes, add questions with randomized order, and view student attempt & violation logs.
- **Student & Leaderboard Manager:** Manage enrollments (`cohort` vs `recorded_only`), revoke codes, view full cohort leaderboard, and reset active sessions.

### D. Access Control, Drip Content & Future Scalability (Cohort vs. Recorded-Only)
- **Strict Enrollment Gate:** Course sessions/videos are NEVER accessible publicly. Only students with an active enrollment record for that specific course can view its lessons.
- **Session-by-Session Release (Drip Control):** Each lesson has `isPublished` (boolean) and an optional `releaseDate`. Admin controls exactly when each session becomes visible.
- **Two Enrollment Tiers (Built-in for Future Scaling):**
  1. **`cohort` (Live Round — Phase 1 Default):** Sees sessions as they are released session-by-session + full access to Assignments, Quizzes, Exams, and Live Leaderboard.
  2. **`recorded_only` (Self-Paced — Future Phase):** Unlocked by Admin after payment for completed courses. Instant access to all published sessions, with Assignments, Exams, and Leaderboard disabled via enrollment feature flags.

## 4. Core MongoDB Collections (High-Level Schema)
- `Users`: `{ fullName, email, phone, passwordHash, role: ['admin', 'student'], studentCode (unique), activeSessionId, isActive }`
- `Enrollments`: `{ studentId, courseId, cohortName, accessType: ['cohort', 'recorded_only'], features: { canAccessTasks: Boolean, canAccessExams: Boolean, showInLeaderboard: Boolean }, status: ['active', 'suspended', 'completed'], enrolledAt }`
- `Courses`: `{ title, slug, description, roadmap[], price, isRegistrationOpen, cohortName, thumbnail }`
- `Lessons`: `{ courseId, moduleTitle, title, order, youtubeVideoId (never exposed raw in public API), isPublished: Boolean, releaseDate: Date, duration, resources[] }`
- `Registrations`: `{ courseId, fullName, email, phone, experienceLevel, motivation, paymentStatus: ['unpaid', 'paid'], status: ['pending', 'contacted', 'approved', 'rejected'], adminNotes, createdAt }`
- `Tasks`: `{ courseId, title, description, deadline, maxScore, allowedLinkTypes: ['github', 'drive'] }`
- `Submissions`: `{ taskId, studentId, submissionUrl, linkType, status, score, feedback, submittedAt }`
- `Assessments` (Exams & Quizzes): `{ courseId, lessonId (optional for quizzes), type: ['quiz', 'exam'], title, durationMinutes, strictAntiCheat: Boolean, maxViolations, isPublished, questions: [{ text, options[], correctOptionIndex, points }] }`
- `AssessmentAttempts`: `{ assessmentId, studentId, startedAt, expiresAt, submittedAt, answers[], score, violations: [{ type, timestamp }], status: ['in_progress', 'submitted', 'auto_submitted_cheat'] }`

## 5. Development Phases
- **Phase 1:** Project setup, Backend core, Auth + RBAC + Security middleware, MongoDB connection, Base UI theme.
- **Phase 2:** Public Landing Page + SEO setup + Dynamic Course Registration API & UI.
- **Phase 3:** Admin Dashboard (Applicants, Payment Verification, Student Code Generator, Courses & Session Drip Manager).
- **Phase 4:** Student Portal + Protected Video Player + Dynamic Watermark.
- **Phase 5:** Assignments System (Creation, GitHub/Drive Submission, Grading) + Leaderboard/Ranking Engine.
- **Phase 6:** Quizzes & Anti-Cheat Theoretical Exam Engine + Final Security Audit & Performance Tuning.