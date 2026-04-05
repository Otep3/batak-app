# 🔥 BATAK FITNESS — Full-Stack Web App

A complete fitness tracking web application built with **Node.js + Express** backend and a polished mobile-style frontend.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Open in Browser
```
http://localhost:3000
```

That's it! ✅

---

## 📁 Project Structure

```
batak_fitness/
├── server.js              ← Express backend (REST API + JWT auth)
├── package.json
├── README.md
└── public/
    ├── index.html         ← App HTML (mobile-style UI)
    ├── styles.css         ← App styles
    ├── script.js          ← Frontend JS (API-powered)
    └── images/            ← Drop your workout/exercise images here
        └── README.txt     ← Image file naming guide
```

---

## ✨ Features

### Auth System
- ✅ Sign Up with name/email/password
- ✅ Log In / Log Out
- ✅ Guest & Anonymous login (no account needed)
- ✅ Forgot Password (3-step: email → security question → reset)
- ✅ JWT tokens (HTTP-only cookie + Bearer header)
- ✅ Rate limiting on auth routes

### Workout
- ✅ 8 built-in workout programs (Push, Pull, Legs, Core, V-Shape, etc.)
- ✅ Active workout mode with timers and set tracking
- ✅ Sound cues (countdowns, rest bells, completion fanfare)
- ✅ Custom workout builder
- ✅ Rest timer between sets

### Tracking
- ✅ Workout history synced to server
- ✅ Streak counter
- ✅ Weekly activity chart
- ✅ Monthly progress chart
- ✅ Achievements system

### Nutrition
- ✅ Daily food log (Breakfast/Lunch/Dinner/Snacks)
- ✅ Macro tracking (protein/carbs/fat)
- ✅ Calorie goal vs intake
- ✅ Water intake tracker (8 glasses/day)
- ✅ Diet tips matched to workout type

### Calendar
- ✅ Weekly workout schedule (Y-Shape & V-Shape split)
- ✅ Monthly calendar view with workout history
- ✅ Champion physique tips

### Profile
- ✅ Profile photo upload
- ✅ Level progression (Beginner → Intermediate → Advanced → Elite)
- ✅ Stats dashboard
- ✅ Weekly goal tracking

### UI/UX
- ✅ Dark mode (default) + Light mode toggle
- ✅ In-app notification system
- ✅ Smooth screen transitions
- ✅ Mobile-optimized layout

---

## 🔌 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/guest` | Guest/anonymous login |
| POST | `/api/auth/logout` | Log out |
| POST | `/api/auth/forgot/verify-email` | Forgot password step 1 |
| POST | `/api/auth/forgot/verify-answer` | Forgot password step 2 |
| POST | `/api/auth/forgot/reset` | Forgot password step 3 |

### User (requires auth)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/user/me` | Get current user |
| PATCH | `/api/user/me` | Update profile (avatar, bestStreak) |

### Workout History
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/history` | Get all history entries |
| POST | `/api/history` | Add workout entry |
| DELETE | `/api/history/:id` | Delete entry |

### Nutrition
| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/nutrition/logs` | Daily food logs |
| GET/PUT | `/api/nutrition/goals` | Macro/calorie goals |

### Other
| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/water` | Water intake |
| GET/PUT | `/api/goals` | Weekly workout goals |
| GET/POST | `/api/workouts/custom` | Custom workouts |
| PUT/DELETE | `/api/workouts/custom/:id` | Edit/delete custom workout |

---

## 🖼️ Adding Images

Drop your image files into the `public/images/` folder with the exact filenames listed in `public/images/README.txt`.

**Cover images** (shown on workout cards):
- `cover_push_day.jpg`, `cover_pull_day.jpg`, `cover_leg_day.jpg`, etc.

**Exercise images** (shown on exercise cards):
- `ex_pushup.jpg`, `ex_pullup.jpg`, `ex_squat.jpg`, etc.

---

## ⚙️ Configuration

Set these environment variables before running:

```bash
PORT=3000                          # Default: 3000
JWT_SECRET=your-secret-key-here   # Default: built-in (change for production!)
```

Example:
```bash
JWT_SECRET=my-super-secret-key npm start
```

---

## 🗄️ Database

The app currently uses an **in-memory store** — all data resets when the server restarts. To persist data, replace the `DB` object in `server.js` with a real database like:

- **MongoDB** (with Mongoose)
- **PostgreSQL** (with Prisma or pg)
- **SQLite** (with better-sqlite3)

The API structure is already clean and separated, making the swap straightforward.

---

## 🛡️ Security

- Passwords hashed with **bcryptjs** (cost factor 10)
- Auth tokens are **JWT** (30-day expiry)
- HTTP-only cookies prevent XSS token theft
- **Helmet.js** sets security headers
- **express-rate-limit** on all auth routes
- Input sanitization with `esc()` in the frontend

---

## 📱 Deployment

Deploy to any Node.js host:

**Railway / Render / Heroku:**
```bash
# Set environment variables in your dashboard
PORT=3000
JWT_SECRET=your-production-secret
```

**PM2 (VPS):**
```bash
npm install -g pm2
pm2 start server.js --name batak-fitness
pm2 save
```

---

*Created by Joseph Abella — Batak Fitness Club*
