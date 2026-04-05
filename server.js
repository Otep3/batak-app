/**
 * BATAK FITNESS — Full-Stack Backend
 * Express + JWT auth + in-memory store (swap for a DB in production)
 */

const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'batak-fitness-super-secret-2026';

// ─── In-memory data store (replace with DB for production) ───────────────────
const DB = {
  users:    {},   // { [email]: { id, name, email, passwordHash, joinDate, avatar, secQ, secA } }
  history:  {},   // { [userId]: [workoutEntry, ...] }
  nutLogs:  {},   // { [userId]: { 'YYYY-MM-DD': { Breakfast:[], ... } } }
  water:    {},   // { [userId]: { 'YYYY-MM-DD': count } }
  nutGoals: {},   // { [userId]: { calories, protein, carbs, fat } }
  weekGoals:{},   // { [userId]: { workouts, calories } }
  customWorkouts:{}, // { [userId]: [...] }
  userData: {},   // { [userId]: { bestStreak, avatar } }
};

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true });
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/', authLimiter);

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
  // Support Bearer token OR cookie
  const auth = req.headers.authorization;
  const token = (auth && auth.startsWith('Bearer ')) 
    ? auth.slice(7) 
    : req.cookies?.batak_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
}

function initUser(userId) {
  if (!DB.history[userId])       DB.history[userId]       = [];
  if (!DB.nutLogs[userId])       DB.nutLogs[userId]       = {};
  if (!DB.water[userId])         DB.water[userId]         = {};
  if (!DB.nutGoals[userId])      DB.nutGoals[userId]      = { calories:2000, protein:150, carbs:250, fat:65 };
  if (!DB.weekGoals[userId])     DB.weekGoals[userId]     = { workouts:5, calories:2000 };
  if (!DB.customWorkouts[userId])DB.customWorkouts[userId]= [];
  if (!DB.userData[userId])      DB.userData[userId]      = { bestStreak:0 };
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
const FP_QUESTIONS = [
  "What city were you born in?",
  "What was your childhood nickname?",
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What street did you grow up on?",
];

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const key = email.toLowerCase().trim();
  if (DB.users[key]) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  DB.users[key] = {
    id: userId, name, email: key,
    passwordHash,
    joinDate: new Date().toISOString().split('T')[0],
    secQ: null, secA: null,
  };
  initUser(userId);
  const token = signToken(userId);
  res.cookie('batak_token', token, { httpOnly: true, maxAge: 30*24*60*60*1000, sameSite:'lax' });
  res.json({ token, user: { id:userId, name, email:key, joinDate: DB.users[key].joinDate } });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const key = email.toLowerCase().trim();
  const user = DB.users[key];
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
  initUser(user.id);
  const token = signToken(user.id);
  res.cookie('batak_token', token, { httpOnly: true, maxAge: 30*24*60*60*1000, sameSite:'lax' });
  res.json({ token, user: { id:user.id, name:user.name, email:user.email, joinDate:user.joinDate } });
});

// Guest / Anonymous login
app.post('/api/auth/guest', (req, res) => {
  const type = req.body.type || 'Guest';
  const userId = 'guest-' + uuidv4();
  const name = type === 'Anonymous' ? 'Anonymous' : 'Guest';
  initUser(userId);
  const token = signToken(userId);
  res.cookie('batak_token', token, { httpOnly: true, maxAge: 24*60*60*1000, sameSite:'lax' });
  res.json({ token, user: { id:userId, name, email: null, joinDate: new Date().toISOString().split('T')[0] } });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('batak_token');
  res.json({ ok: true });
});

// Forgot password — step 1: verify email
app.post('/api/auth/forgot/verify-email', (req, res) => {
  const key = (req.body.email || '').toLowerCase().trim();
  const user = DB.users[key];
  if (!user) return res.status(404).json({ error: 'No account found with that email' });
  // Assign a security question deterministically
  if (user.secQ === null) {
    const qIdx = Math.abs(key.split('').reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,0)) % FP_QUESTIONS.length;
    user.secQ = qIdx;
  }
  res.json({ question: FP_QUESTIONS[user.secQ] });
});

// Forgot password — step 2: check security answer
app.post('/api/auth/forgot/verify-answer', (req, res) => {
  const key    = (req.body.email || '').toLowerCase().trim();
  const answer = (req.body.answer || '').toLowerCase().trim();
  const user   = DB.users[key];
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (!user.secA) {
    // First time: save the answer
    user.secA = answer;
    return res.json({ ok: true });
  }
  if (user.secA !== answer) return res.status(401).json({ error: 'Incorrect answer' });
  res.json({ ok: true });
});

// Forgot password — step 3: reset password
app.post('/api/auth/forgot/reset', async (req, res) => {
  const key  = (req.body.email || '').toLowerCase().trim();
  const pass = req.body.password;
  const user = DB.users[key];
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (!pass || pass.length < 6) return res.status(400).json({ error: 'Password must be at least 6 chars' });
  user.passwordHash = await bcrypt.hash(pass, 10);
  res.json({ ok: true });
});

// ─── USER ROUTES ──────────────────────────────────────────────────────────────
app.get('/api/user/me', authMiddleware, (req, res) => {
  const uid = req.userId;
  // Guest users won't be in DB.users
  const userEntry = Object.values(DB.users).find(u => u.id === uid);
  initUser(uid);
  res.json({
    id: uid,
    name: userEntry?.name || 'Guest',
    email: userEntry?.email || null,
    joinDate: userEntry?.joinDate || new Date().toISOString().split('T')[0],
    bestStreak: DB.userData[uid]?.bestStreak || 0,
    avatar: DB.userData[uid]?.avatar || null,
  });
});

app.patch('/api/user/me', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  const { bestStreak, avatar } = req.body;
  if (bestStreak !== undefined) DB.userData[uid].bestStreak = bestStreak;
  if (avatar !== undefined) DB.userData[uid].avatar = avatar;
  res.json({ ok: true });
});

// ─── WORKOUT HISTORY ──────────────────────────────────────────────────────────
app.get('/api/history', authMiddleware, (req, res) => {
  initUser(req.userId);
  res.json(DB.history[req.userId]);
});

app.post('/api/history', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  const entry = { id: uuidv4(), ...req.body, savedAt: new Date().toISOString() };
  DB.history[uid].push(entry);
  res.json(entry);
});

app.delete('/api/history/:id', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  DB.history[uid] = DB.history[uid].filter(h => h.id !== req.params.id);
  res.json({ ok: true });
});

// ─── NUTRITION ────────────────────────────────────────────────────────────────
app.get('/api/nutrition/logs', authMiddleware, (req, res) => {
  initUser(req.userId);
  res.json(DB.nutLogs[req.userId]);
});

app.put('/api/nutrition/logs', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  DB.nutLogs[uid] = req.body;
  res.json({ ok: true });
});

app.get('/api/nutrition/goals', authMiddleware, (req, res) => {
  initUser(req.userId);
  res.json(DB.nutGoals[req.userId]);
});

app.put('/api/nutrition/goals', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  DB.nutGoals[uid] = { ...DB.nutGoals[uid], ...req.body };
  res.json(DB.nutGoals[uid]);
});

// ─── WATER ────────────────────────────────────────────────────────────────────
app.get('/api/water', authMiddleware, (req, res) => {
  initUser(req.userId);
  res.json(DB.water[req.userId]);
});

app.put('/api/water', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  DB.water[uid] = req.body;
  res.json({ ok: true });
});

// ─── GOALS ────────────────────────────────────────────────────────────────────
app.get('/api/goals', authMiddleware, (req, res) => {
  initUser(req.userId);
  res.json(DB.weekGoals[req.userId]);
});

app.put('/api/goals', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  DB.weekGoals[uid] = { ...DB.weekGoals[uid], ...req.body };
  res.json(DB.weekGoals[uid]);
});

// ─── CUSTOM WORKOUTS ──────────────────────────────────────────────────────────
app.get('/api/workouts/custom', authMiddleware, (req, res) => {
  initUser(req.userId);
  res.json(DB.customWorkouts[req.userId]);
});

app.post('/api/workouts/custom', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  const workout = { id: 'custom-' + uuidv4(), ...req.body, custom: true };
  DB.customWorkouts[uid].push(workout);
  res.json(workout);
});

app.put('/api/workouts/custom/:id', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  const idx = DB.customWorkouts[uid].findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  DB.customWorkouts[uid][idx] = { ...DB.customWorkouts[uid][idx], ...req.body };
  res.json(DB.customWorkouts[uid][idx]);
});

app.delete('/api/workouts/custom/:id', authMiddleware, (req, res) => {
  const uid = req.userId;
  initUser(uid);
  DB.customWorkouts[uid] = DB.customWorkouts[uid].filter(w => w.id !== req.params.id);
  res.json({ ok: true });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── Serve SPA ────────────────────────────────────────────────────────────────
app.get('/{*path}', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🔥 BATAK FITNESS server running on http://localhost:${PORT}`));
