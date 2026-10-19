# Examination and Results Management System (IERMS)

A comprehensive educational platform for managing examinations, assessments, student results, and academic records. This system integrates online exam delivery with traditional mark entry and grade management.

## Project Purpose

The Examination and Results Management System (IERMS) is designed to streamline the entire examination lifecycle in educational institutions. It provides:

- **Online Exam Management**: Create, schedule, and deliver digital exams with various question types
- **Question Bank**: Maintain a centralized repository of questions with categories and difficulty levels
- **Assessment Tracking**: Manage continuous assessments, quizzes, mid-terms, and final exams
- **Mark Entry & Grading**: Enter and track student marks with weighted calculations
- **Result Publication**: Publish term results with grades, rankings, and teacher comments
- **Academic Structure**: Manage academic years, terms, classes, sections, and subjects
- **User Management**: Support for multiple user roles with specific permissions
- **Audit Logging**: Track all system activities for compliance and security

## Technology Stack

- **Frontend**: React 19 with TypeScript, Tailwind CSS, Motion (animations)
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon Cloud)
- **Authentication**: Session-based with bcryptjs password hashing
- **AI Integration**: Google Gemini API (optional)

## User Roles and Credentials

The system supports five user roles, each with specific responsibilities:

### 1. Administrator
**Username**: `admin`  
**Password**: `password123`  
**Email**: admin@apex-ier.edu  
**Full Name**: Dr. Arthur Sterling (Administrator)

**Responsibilities**:
- Complete system configuration and management
- Manage school settings (institution name, grading policies, etc.)
- Create and manage user accounts for all roles
- Configure academic years, terms, classes, and sections
- Manage subjects and grading scales
- View audit logs and system-wide reports
- Publish final results and manage system security

### 2. Teacher
**Usernames & Passwords**:
- `teacher.miller` / `password123` (Prof. Eleanor Miller - Math & Science)
- `teacher.davis` / `password123` (Dr. Marcus Davis - Physics & CS)

**Responsibilities**:
- Build and maintain question banks
- Create and schedule online exams
- Set exam parameters (duration, attempt limits, policies)
- Grade student submissions (manual and auto-graded)
- Enter marks for manual assessments
- Provide teacher comments on student performance
- View class-wise results and statistics
- Manage assigned subjects and classes

### 3. Student
**Usernames & Passwords**:
- `stu.kaleb` / `password123` (Kaleb Tadesse)
- `stu.sophia` / `password123` (Sophia Chen)
- `stu.marcus` / `password123` (Marcus Vance)
- `stu.aaliyah` / `password123` (Aaliyah Khan)

**Responsibilities**:
- Take scheduled online exams within specified time windows
- View available exams and attempt history
- Submit exam answers with auto-save functionality
- View published results and report cards
- Track academic performance across terms
- View teacher comments and feedback

### 4. Registrar
**Username**: `registrar.hayes`  
**Password**: `password123`  
**Email**: c.hayes@apex-ier.edu  
**Full Name**: Clara Hayes (Academic Registrar)

**Responsibilities**:
- Manage student enrollments and records
- Handle admissions and student transfers
- Manage teacher assignments to subjects
- Coordinate term result publications
- Generate official transcripts and reports
- Verify and approve result publications
- Manage academic calendar and schedules

### 5. Invigilator (Exam Proctor)
**Username**: `invigilator.sam`  
**Password**: `password123`  
**Email**: s.reyes@apex-ier.edu  
**Full Name**: Samuel Reyes (Exam Proctor)

**Responsibilities**:
- Monitor active exam sessions
- Handle exam-related issues and interventions
- Track student attendance during exams
- Manage exam codes and access control
- Monitor exam security and integrity
- Handle special accommodations for students
- Report exam irregularities

## System Features

### Exam Management Module
- Multiple question types: Single choice, Multiple select, True/False, Short answer, Essay
- Randomized questions and options for security
- Configurable exam duration and attempt limits
- Navigation policies (free or locked question order)
- Feedback display policies (immediate, after close, after release)
- Auto-grading for objective questions
- Manual grading for subjective questions with rubrics

### Results Management Module
- Weighted assessment calculations (quizzes, mid-terms, finals)
- Configurable grading scales and pass thresholds
- Term-wise result aggregation
- Student ranking (optional)
- Report card generation
- Teacher comments integration
- Result approval workflow (draft → review → published → locked)

### Academic Structure
- Academic years with date ranges
- Terms within academic years
- Classes and sections
- Subject assignment to classes/sections
- Teacher assignments to subjects
- Student enrollments to sections

### Security & Compliance
- Role-based access control
- Session-based authentication
- Password hashing with bcrypt
- Comprehensive audit logging
- IP address tracking
- Exam attempt monitoring
- Access code protection for exams

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   GEMINI_API_KEY="your_gemini_api_key"
   APP_URL="http://localhost:5173"
   DATABASE_URL="your_postgresql_connection_string"
   ```

3. Run the application:
   ```bash
   npm run dev
   ```

The application will automatically initialize the database schema and seed sample data on first run.

## Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `students` - Student profiles and enrollment
- `teachers` - Teacher profiles and assignments
- `academic_years`, `terms`, `classes`, `sections`, `subjects` - Academic structure
- `questions`, `question_categories` - Question bank
- `exams`, `exam_questions` - Exam definitions
- `exam_attempts`, `student_answers` - Exam delivery
- `assessments`, `marks` - Assessment tracking
- `grading_scales` - Grade definitions
- `audit_logs` - System activity tracking
