# Fullstack Next.js - Quick Start Guide

## ✅ Your Project is Now Fullstack Next.js!

No more separate Express server needed. Everything runs on **port 3000**.

---

## 🚀 Running the Application

```bash
# Start the development server (frontend + backend)
npm run dev

# Seed the database with test data
npm run db:seed
```

Then open **http://localhost:3000** in your browser.

---

## 🔐 Default Login Credentials

**Password for all accounts:** `Admin@123`

| Role | Username | Email |
|------|----------|-------|
| Admin | `admin` | admin@apex-ier.edu |
| Teacher | `teacher.miller` | e.miller@apex-ier.edu |
| Teacher | `teacher.davis` | m.davis@apex-ier.edu |
| Registrar | `registrar.hayes` | c.hayes@apex-ier.edu |
| Student | `stu.kaleb` | kaleb.t@apex-ier.edu |
| Student | `stu.sophia` | sophia.c@apex-ier.edu |

---

## 📡 Available API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user info

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (admin/teacher only)

### Settings
- `GET /api/settings` - Get school settings and grading scales
- `POST /api/settings` - Update school settings (admin only)

### System
- `GET /api/health` - Health check endpoint
- `GET /api/test` - Test API endpoint (shows all available routes)

---

## 🧪 Testing the API

### Using curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Test endpoint
curl http://localhost:3000/api/test

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

### Using Browser:

Visit these URLs directly:
- http://localhost:3000/api/health
- http://localhost:3000/api/test

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/                    # Next.js API Routes (Backend)
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── dashboard/
│   │   │   └── stats/route.ts
│   │   ├── settings/route.ts
│   │   ├── health/route.ts
│   │   └── test/route.ts
│   ├── layout.tsx              # App layout
│   └── page.tsx                # Home page
├── components/                  # React components
├── lib/
│   └── session.ts              # Session management (JWT)
└── server/
    ├── db.ts                   # Database connection & schema
    └── routes.ts               # Legacy Express routes (to be migrated)
```

---

## 🔄 What Changed?

### Before (Split Architecture)
- Express backend on port 4000
- Next.js frontend on port 3000  
- Proxy configuration to forward `/api/*` requests
- Need to run 2 servers

### After (Fullstack Next.js)
- Everything on port 3000
- Next.js API Routes handle backend logic
- No proxy needed
- Single server to run

---

## 🛠️ Environment Variables

Your `.env` file should have:

```env
DATABASE_URL='postgresql://...'
SESSION_SECRET=apex-ierms-super-secret-jwt-key-2024
NODE_ENV=development
SEED_PASSWORD=Admin@123
```

---

## 📦 Database Commands

```bash
# Seed the database
npm run db:seed

# The seed script will:
# - Create all tables if they don't exist
# - Insert test data (users, students, teachers, etc.)
# - Display login credentials
```

---

## 🔐 Security Features

- **JWT Session Management**: Secure token-based authentication
- **HTTP-Only Cookies**: Session tokens stored securely
- **Role-Based Access Control**: Admin, Teacher, Student, Registrar roles
- **Password Hashing**: bcrypt with salt rounds
- **Audit Logging**: All important actions logged

---

## 🎯 Next Steps

### For Development
1. Start the dev server: `npm run dev`
2. Test login with admin credentials
3. Explore the application

### For Additional Features
The original Express routes in `src/server/routes.ts` contain many more endpoints that can be migrated to Next.js API routes:

- Academic management (years, terms, classes, subjects)
- People management (students, teachers)
- Question bank
- Exam management
- Results and grading

You can migrate these incrementally as needed.

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Database connection issues
Check your `DATABASE_URL` in `.env` file

### Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

---

## 📚 Learn More

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [PostgreSQL with Next.js](https://vercel.com/guides/nextjs-prisma-postgres)

---

## ✨ Benefits of This Architecture

✅ **Simpler deployment** - One application to deploy  
✅ **Faster development** - Hot reload for both frontend and backend  
✅ **Better type safety** - Share types easily  
✅ **Cost effective** - Single server, single port  
✅ **Modern stack** - Latest Next.js features  
✅ **Easy to scale** - Deploy to Vercel, AWS, etc.

---

**Happy Coding! 🎉**
