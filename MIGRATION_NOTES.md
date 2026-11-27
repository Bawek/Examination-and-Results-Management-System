# Migration to Fullstack Next.js

## Changes Made

### Architecture Change
- **Before**: Split architecture with Express backend (port 4000) + Next.js frontend (port 3000)
- **After**: Fullstack Next.js with API Routes (single port 3000)

### What Was Migrated

1. **Removed Express Proxy**
   - Removed Next.js rewrite rules that proxied `/api/*` to Express server
   - No longer need to run separate backend server

2. **Created Next.js API Routes**
   - `/api/auth/login` - User authentication
   - `/api/auth/logout` - User logout
   - `/api/auth/me` - Get current user
   - `/api/health` - Health check
   - `/api/dashboard/stats` - Dashboard statistics
   - `/api/settings` - School settings (GET/POST)

3. **Session Management**
   - Replaced Express session with JWT-based session
   - Uses HTTP-only cookies for security
   - Session library in `src/lib/session.ts`

4. **Dependencies Added**
   - `jose` - JWT handling for Next.js
   - `express`, `express-session`, `express-rate-limit`, `connect-pg-simple` - For future migration if needed

### Database Seeding

Default user credentials (password: **Admin@123**):
- **Admin**: `admin` / `admin@apex-ier.edu`
- **Teacher**: `teacher.miller` / `e.miller@apex-ier.edu`
- **Teacher**: `teacher.davis` / `m.davis@apex-ier.edu`
- **Registrar**: `registrar.hayes` / `c.hayes@apex-ier.edu`
- **Student**: `stu.kaleb` / `kaleb.t@apex-ier.edu`
- **Student**: `stu.sophia` / `sophia.c@apex-ier.edu`

### Running the Application

```bash
# Single command to run fullstack Next.js
npm run dev

# Seed database
npm run db:seed
```

### Next Steps (TODO)

The following Express routes still need to be migrated to Next.js API routes:

#### Academic Routes
- `/api/academic-years` - GET academic years
- `/api/terms` - GET terms
- `/api/classes` - GET classes and sections
- `/api/subjects` - GET/POST subjects
- `/api/class-subjects` - GET class subjects

#### People Routes
- `/api/students` - GET/POST students
- `/api/teachers` - GET teachers

#### Question Bank Routes
- `/api/questions` - GET/POST questions

#### Exam Management Routes  
- `/api/exams` - GET/POST exams
- `/api/exams/:id` - GET specific exam
- `/api/exams/:id/release` - POST release results
- `/api/candidate/available-exams` - GET available exams for students
- `/api/candidate/start-attempt` - POST start exam attempt

#### And many more routes from the Express server...

### Migration Strategy

To complete the migration:

1. Create corresponding Next.js API route files in `src/app/api/`
2. Convert Express middleware to Next.js middleware or inline logic
3. Use `requireAuth` and `requireRole` from `src/lib/session.ts`
4. Update frontend components to call Next.js API routes directly
5. Remove old Express server files from `src/server/` once all routes are migrated
6. Test all functionality thoroughly

### Benefits of Fullstack Next.js

✅ **Single Server** - No need to run Express separately  
✅ **Simplified Deployment** - Deploy as one application  
✅ **Better DX** - Integrated development experience  
✅ **Type Safety** - Share types between frontend and backend easily  
✅ **Faster Development** - Hot reload works seamlessly  
✅ **Cost Effective** - Single deployment, single port
