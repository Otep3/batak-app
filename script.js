// ═══════════════════════════════════════════════════════════
// BATAK FITNESS — Full-Stack Client Script
// All data synced to the Express backend via fetch() API.
// Falls back to in-memory state if offline.
// ═══════════════════════════════════════════════════════════

window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => { loader.style.display = "none"; }, 500);
  }, 1800);
});

let selectedExercise = null;

// ═══════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════
let _authToken = null;

function setToken(t) { _authToken = t; }

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers||{}) };
  if (_authToken) headers['Authorization'] = 'Bearer ' + _authToken;
  const res = await fetch(path, { ...opts, headers, credentials: 'include' });
  if (!res.ok) {
    let err;
    try { err = (await res.json()).error; } catch { err = 'Network error'; }
    throw new Error(err || 'Request failed');
  }
  return res.json();
}

const API = {
  // Auth
  signup: (name,email,password) => apiFetch('/api/auth/signup',{method:'POST',body:JSON.stringify({name,email,password})}),
  login:  (email,password)      => apiFetch('/api/auth/login', {method:'POST',body:JSON.stringify({email,password})}),
  guest:  (type)                => apiFetch('/api/auth/guest', {method:'POST',body:JSON.stringify({type})}),
  logout: ()                    => apiFetch('/api/auth/logout',{method:'POST'}),
  me:     ()                    => apiFetch('/api/user/me'),
  updateMe: (data)              => apiFetch('/api/user/me', {method:'PATCH',body:JSON.stringify(data)}),

  // Forgot password
  fpVerifyEmail:  (email)         => apiFetch('/api/auth/forgot/verify-email',  {method:'POST',body:JSON.stringify({email})}),
  fpVerifyAnswer: (email,answer)  => apiFetch('/api/auth/forgot/verify-answer', {method:'POST',body:JSON.stringify({email,answer})}),
  fpReset:        (email,password)=> apiFetch('/api/auth/forgot/reset',          {method:'POST',body:JSON.stringify({email,password})}),

  // History
  getHistory:    ()     => apiFetch('/api/history'),
  addHistory:    (entry)=> apiFetch('/api/history',{method:'POST',body:JSON.stringify(entry)}),
  deleteHistory: (id)   => apiFetch('/api/history/'+id,{method:'DELETE'}),

  // Nutrition
  getNutLogs:   ()    => apiFetch('/api/nutrition/logs'),
  putNutLogs:   (d)   => apiFetch('/api/nutrition/logs', {method:'PUT',body:JSON.stringify(d)}),
  getNutGoals:  ()    => apiFetch('/api/nutrition/goals'),
  putNutGoals:  (d)   => apiFetch('/api/nutrition/goals',{method:'PUT',body:JSON.stringify(d)}),

  // Water
  getWater: ()  => apiFetch('/api/water'),
  putWater: (d) => apiFetch('/api/water',{method:'PUT',body:JSON.stringify(d)}),

  // Goals
  getGoals: ()  => apiFetch('/api/goals'),
  putGoals: (d) => apiFetch('/api/goals',{method:'PUT',body:JSON.stringify(d)}),

  // Custom workouts
  getCustomWorkouts:    ()     => apiFetch('/api/workouts/custom'),
  addCustomWorkout:     (d)    => apiFetch('/api/workouts/custom',{method:'POST',body:JSON.stringify(d)}),
  updateCustomWorkout:  (id,d) => apiFetch('/api/workouts/custom/'+id,{method:'PUT',body:JSON.stringify(d)}),
  deleteCustomWorkout_: (id)   => apiFetch('/api/workouts/custom/'+id,{method:'DELETE'}),
};

// ═══════════════════════════════════════════════════════════
// DATA (unchanged from original — workouts & exercises)
// ═══════════════════════════════════════════════════════════
const WORKOUTS = [
  { id:'w1', name:'Push Day', category:'Strength', emoji:'💪',
    image:'./images/cover_push_day.jpg', color:'#4f9eff', difficulty:'Beginner', duration:35, calories:260,
    exercises:[
      {id:'e1',  name:'Push-Up',         icon:'💪',muscle:'Chest',      type:'reps', sets:4,reps:15,weight:0},
      {id:'e2',  name:'Pike Push-Up',    icon:'🔺',muscle:'Shoulders',  type:'reps', sets:3,reps:12,weight:0},
      {id:'e3',  name:'Diamond Push-Up', icon:'💎',muscle:'Triceps',    type:'reps', sets:3,reps:10,weight:0},
      {id:'e4',  name:'Decline Push-Up', icon:'⬇️',muscle:'Upper Chest',type:'reps', sets:3,reps:10,weight:0},
      {id:'e5',  name:'Dips',            icon:'🪑',muscle:'Triceps',    type:'reps', sets:3,reps:12,weight:0},
      {id:'e6',  name:'Plank',           icon:'🧘',muscle:'Core',       type:'timed',duration:60},
    ]},
  { id:'w2', name:'Pull Day', category:'Strength', emoji:'🏹',
    image:'./images/cover_pull_day.jpg', color:'#2ee8c4', difficulty:'Beginner', duration:35, calories:250,
    exercises:[
      {id:'e7', name:'Pull-Up',          icon:'🏋️',muscle:'Back',     type:'reps', sets:4,reps:8, weight:0},
      {id:'e8', name:'Inverted Row',     icon:'↩️',muscle:'Back',     type:'reps', sets:3,reps:12,weight:0},
      {id:'e9', name:'Doorframe Row',    icon:'🚪',muscle:'Back',     type:'reps', sets:3,reps:12,weight:0},
      {id:'e10',name:'Towel Curl',       icon:'T', muscle:'Biceps',   type:'reps', sets:3,reps:15,weight:0, image:'./images/ex_towel_curl.jpg'},
      {id:'e11',name:'Superman Hold',    icon:'S', muscle:'Lower Back',type:'timed',duration:45,  image:'./images/ex_superman.jpg'},
      {id:'e12',name:'Reverse Snow Angel',icon:'R',muscle:'Upper Back',type:'reps', sets:3,reps:15,weight:0,image:'./images/ex_snow_angel.jpg'},
    ]},
  { id:'w3', name:'Leg Day', category:'Strength', emoji:'🦵',
    image:'./images/cover_leg_day.jpg', color:'#ff7043', difficulty:'Beginner', duration:40, calories:320,
    exercises:[
      {id:'e13',name:'Squat',            icon:'S',muscle:'Legs',  type:'reps', sets:4,reps:20,weight:0, image:'./images/ex_squat.jpg'},
      {id:'e14',name:'Lunge',            icon:'L',muscle:'Legs',  type:'reps', sets:3,reps:16,weight:0, image:'./images/ex_lunge.jpg'},
      {id:'e15',name:'Glute Bridge',     icon:'G',muscle:'Glutes',type:'reps', sets:3,reps:20,weight:0, image:'./images/ex_glute_bridge.jpg'},
      {id:'e16',name:'Wall Sit',         icon:'W',muscle:'Legs',  type:'timed',duration:60,             image:'./images/ex_wall_sit.jpg'},
      {id:'e17',name:'Calf Raise',       icon:'C',muscle:'Calves',type:'reps', sets:3,reps:25,weight:0, image:'./images/ex_calf_raise.jpg'},
      {id:'e18',name:'Bulgarian Split Squat',icon:'B',muscle:'Legs',type:'reps',sets:3,reps:10,weight:0,image:'./images/ex_bulgarian_squat.jpg'},
      {id:'e19',name:'Step-Up',          icon:'S',muscle:'Legs',  type:'reps', sets:3,reps:12,weight:0, image:'./images/ex_step_up.jpg'},
    ]},
  { id:'w4', name:'Core Crusher', category:'Strength', emoji:'🔥',
    image:'./images/cover_core.jpg', color:'#a78bfa', difficulty:'Intermediate', duration:30, calories:200,
    exercises:[
      {id:'e20',name:'Plank',            icon:'P',muscle:'Core',type:'timed',duration:60, image:'./images/ex_plank.jpg'},
      {id:'e21',name:'Leg Raise',        icon:'L',muscle:'Core',type:'reps', sets:3,reps:15,weight:0,image:'./images/ex_leg_raise.jpg'},
      {id:'e22',name:'Mountain Climber', icon:'M',muscle:'Core',type:'timed',duration:45, image:'./images/ex_mountain_climber.jpg'},
      {id:'e23',name:'Hollow Hold',      icon:'H',muscle:'Core',type:'timed',duration:30, image:'./images/ex_hollow_hold.jpg'},
      {id:'e24',name:'Russian Twist',    icon:'R',muscle:'Core',type:'reps', sets:3,reps:20,weight:0,image:'./images/ex_russian_twist.jpg'},
      {id:'e25',name:'Bicycle Crunch',   icon:'B',muscle:'Core',type:'reps', sets:3,reps:20,weight:0,image:'./images/ex_bicycle_crunch.jpg'},
    ]},
  { id:'w5', name:'V-Shape Grind', category:'HIIT', emoji:'🔱',
    image:'./images/cover_vshape.jpg', color:'#fbbf24', difficulty:'Advanced', duration:45, calories:400,
    exercises:[
      {id:'e26',name:'Wall Handstand Push-Up', icon:'W',muscle:'Shoulders',type:'reps',sets:3,reps:6, weight:0,image:'./images/ex_handstand.jpg'},
      {id:'e27',name:'Archer Push-Up',         icon:'A',muscle:'Chest',    type:'reps',sets:3,reps:8, weight:0,image:'./images/ex_archer_pushup.jpg'},
      {id:'e28',name:'Pseudo Planche Push-Up', icon:'P',muscle:'Full Body',type:'reps',sets:3,reps:8, weight:0,image:'./images/ex_planche_pushup.jpg'},
      {id:'e29',name:'Pike Push-Up',           icon:'P',muscle:'Shoulders',type:'reps',sets:4,reps:12,weight:0,image:'./images/ex_pike_pushup.jpg'},
      {id:'e30',name:'Diamond Push-Up',        icon:'D',muscle:'Triceps',  type:'reps',sets:3,reps:10,weight:0,image:'./images/ex_diamond_pushup.jpg'},
      {id:'e31',name:'Dips',                   icon:'D',muscle:'Triceps',  type:'reps',sets:4,reps:15,weight:0,image:'./images/ex_dips.jpg'},
    ]},
  { id:'w6', name:'Cardio Burn', category:'Cardio', emoji:'🏃',
    image:'./images/cover_cardio.jpg', color:'#ff4b70', difficulty:'Beginner', duration:25, calories:280,
    exercises:[
      {id:'e32',name:'Jumping Jack',     icon:'J',muscle:'Full Body',type:'timed',duration:60, image:'./images/ex_jumping_jack.jpg'},
      {id:'e33',name:'High Knees',       icon:'H',muscle:'Cardio',   type:'timed',duration:45, image:'./images/ex_high_knees.jpg'},
      {id:'e34',name:'Jump Squat',       icon:'J',muscle:'Legs',     type:'reps', sets:3,reps:15,weight:0,image:'./images/ex_jump_squat.jpg'},
      {id:'e35',name:'Mountain Climber', icon:'M',muscle:'Core',     type:'timed',duration:45, image:'./images/ex_mountain_climber.jpg'},
      {id:'e36',name:'Lunge',            icon:'L',muscle:'Legs',     type:'reps', sets:3,reps:16,weight:0,image:'./images/ex_lunge.jpg'},
      {id:'e37',name:'Step-Up',          icon:'S',muscle:'Legs',     type:'reps', sets:3,reps:12,weight:0,image:'./images/ex_step_up.jpg'},
    ]},
  { id:'w7', name:'Full Body Starter', category:'Strength', emoji:'🌟',
    image:'./images/cover_fullbody.jpg', color:'#2ee8c4', difficulty:'Beginner', duration:30, calories:220,
    exercises:[
      {id:'e38',name:'Push-Up',          icon:'P',muscle:'Chest', type:'reps',sets:3,reps:12,weight:0,image:'./images/ex_pushup.jpg'},
      {id:'e39',name:'Squat',            icon:'S',muscle:'Legs',  type:'reps',sets:3,reps:15,weight:0,image:'./images/ex_squat.jpg'},
      {id:'e40',name:'Glute Bridge',     icon:'G',muscle:'Glutes',type:'reps',sets:3,reps:15,weight:0,image:'./images/ex_glute_bridge.jpg'},
      {id:'e41',name:'Inverted Row',     icon:'I',muscle:'Back',  type:'reps',sets:3,reps:10,weight:0,image:'./images/ex_inverted_row.jpg'},
      {id:'e42',name:'Plank',            icon:'P',muscle:'Core',  type:'timed',duration:45,            image:'./images/ex_plank.jpg'},
      {id:'e43',name:'Jumping Jack',     icon:'J',muscle:'Full Body',type:'timed',duration:60,         image:'./images/ex_jumping_jack.jpg'},
    ]},
  { id:'w8', name:'Strength & Skill', category:'Strength', emoji:'🎯',
    image:'./images/cover_strength.jpg', color:'#4f9eff', difficulty:'Intermediate', duration:50, calories:380,
    exercises:[
      {id:'e44',name:'Pull-Up',              icon:'P',muscle:'Back',     type:'reps', sets:5,reps:8, weight:0,image:'./images/ex_pullup.jpg'},
      {id:'e45',name:'Pseudo Planche Push-Up',icon:'P',muscle:'Full Body',type:'reps',sets:3,reps:10,weight:0,image:'./images/ex_planche_pushup.jpg'},
      {id:'e46',name:'Bulgarian Split Squat', icon:'B',muscle:'Legs',    type:'reps', sets:3,reps:10,weight:0,image:'./images/ex_bulgarian_squat.jpg'},
      {id:'e47',name:'Hollow Hold',           icon:'H',muscle:'Core',    type:'timed',duration:40,            image:'./images/ex_hollow_hold.jpg'},
      {id:'e48',name:'Superman Hold',         icon:'S',muscle:'Lower Back',type:'timed',duration:45,          image:'./images/ex_superman.jpg'},
      {id:'e49',name:'Towel Curl',            icon:'T',muscle:'Biceps',  type:'reps', sets:3,reps:15,weight:0,image:'./images/ex_towel_curl.jpg'},
      {id:'e50',name:'Leg Raise',             icon:'L',muscle:'Core',    type:'reps', sets:3,reps:15,weight:0,image:'./images/ex_leg_raise.jpg'},
    ]},
];

const ALL_EXERCISES = [
  {name:'Push-Up',              icon:'P',image:'./images/ex_pushup.jpg',         muscle:'Chest',      difficulty:'beginner'},
  {name:'Decline Push-Up',      icon:'D',image:'./images/ex_decline_pushup.jpg', muscle:'Upper Chest',difficulty:'intermediate'},
  {name:'Archer Push-Up',       icon:'A',image:'./images/ex_archer_pushup.jpg',  muscle:'Chest',      difficulty:'advanced'},
  {name:'Pike Push-Up',         icon:'P',image:'./images/ex_pike_pushup.jpg',    muscle:'Shoulders',  difficulty:'intermediate'},
  {name:'Wall Handstand Push-Up',icon:'W',image:'./images/ex_handstand.jpg',     muscle:'Shoulders',  difficulty:'advanced'},
  {name:'Diamond Push-Up',      icon:'D',image:'./images/ex_diamond_pushup.jpg', muscle:'Triceps',    difficulty:'intermediate'},
  {name:'Dips',                 icon:'D',image:'./images/ex_dips.jpg',           muscle:'Triceps',    difficulty:'intermediate'},
  {name:'Pseudo Planche Push-Up',icon:'P',image:'./images/ex_planche_pushup.jpg',muscle:'Full Body',  difficulty:'advanced'},
  {name:'Pull-Up',              icon:'P',image:'./images/ex_pullup.jpg',         muscle:'Back',       difficulty:'intermediate'},
  {name:'Inverted Row',         icon:'I',image:'./images/ex_inverted_row.jpg',   muscle:'Back',       difficulty:'beginner'},
  {name:'Doorframe Row',        icon:'D',image:'./images/ex_doorframe_row.jpg',  muscle:'Back',       difficulty:'beginner'},
  {name:'Reverse Snow Angel',   icon:'R',image:'./images/ex_snow_angel.jpg',     muscle:'Upper Back', difficulty:'beginner'},
  {name:'Superman Hold',        icon:'S',image:'./images/ex_superman.jpg',       muscle:'Lower Back', difficulty:'beginner'},
  {name:'Towel Curl',           icon:'T',image:'./images/ex_towel_curl.jpg',     muscle:'Biceps',     difficulty:'beginner'},
  {name:'Plank',                icon:'P',image:'./images/ex_plank.jpg',          muscle:'Core',       difficulty:'beginner'},
  {name:'Leg Raise',            icon:'L',image:'./images/ex_leg_raise.jpg',      muscle:'Core',       difficulty:'intermediate'},
  {name:'Mountain Climber',     icon:'M',image:'./images/ex_mountain_climber.jpg',muscle:'Core',      difficulty:'beginner'},
  {name:'Hollow Hold',          icon:'H',image:'./images/ex_hollow_hold.jpg',    muscle:'Core',       difficulty:'intermediate'},
  {name:'Russian Twist',        icon:'R',image:'./images/ex_russian_twist.jpg',  muscle:'Core',       difficulty:'beginner'},
  {name:'Bicycle Crunch',       icon:'B',image:'./images/ex_bicycle_crunch.jpg', muscle:'Core',       difficulty:'beginner'},
  {name:'Squat',                icon:'S',image:'./images/ex_squat.jpg',          muscle:'Legs',       difficulty:'beginner'},
  {name:'Lunge',                icon:'L',image:'./images/ex_lunge.jpg',          muscle:'Legs',       difficulty:'beginner'},
  {name:'Wall Sit',             icon:'W',image:'./images/ex_wall_sit.jpg',       muscle:'Legs',       difficulty:'beginner'},
  {name:'Jump Squat',           icon:'J',image:'./images/ex_jump_squat.jpg',     muscle:'Legs',       difficulty:'intermediate'},
  {name:'Bulgarian Split Squat',icon:'B',image:'./images/ex_bulgarian_squat.jpg',muscle:'Legs',       difficulty:'intermediate'},
  {name:'Step-Up',              icon:'S',image:'./images/ex_step_up.jpg',        muscle:'Legs',       difficulty:'beginner'},
  {name:'Calf Raise',           icon:'C',image:'./images/ex_calf_raise.jpg',     muscle:'Calves',     difficulty:'beginner'},
  {name:'Glute Bridge',         icon:'G',image:'./images/ex_glute_bridge.jpg',   muscle:'Glutes',     difficulty:'beginner'},
  {name:'High Knees',           icon:'H',image:'./images/ex_high_knees.jpg',     muscle:'Cardio',     difficulty:'beginner'},
  {name:'Jumping Jack',         icon:'J',image:'./images/ex_jumping_jack.jpg',   muscle:'Full Body',  difficulty:'beginner'},
];
const MUSCLES = ['All','Chest','Upper Chest','Shoulders','Triceps','Back','Upper Back','Lower Back','Biceps','Core','Legs','Calves','Glutes','Cardio','Full Body'];

// ═══════════════════════════════════════════════════════════
// APP STATE (server-synced)
// ═══════════════════════════════════════════════════════════
let currentUser    = null;
let history        = [];
let userData       = { bestStreak: 0 };
let weekGoal       = { workouts: 5, calories: 2000 };
let nutGoals       = { calories: 2000, protein: 150, carbs: 250, fat: 65 };
let nutLogs        = {};
let waterData      = {};
let customWorkouts = [];

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════
let isLightMode = false;
function applyTheme(light) {
  document.body.classList.toggle('light-mode', light);
  const t = document.getElementById('theme-toggle');
  if (t) t.classList.toggle('light', light);
}
function toggleTheme() {
  isLightMode = !isLightMode;
  applyTheme(isLightMode);
  localStorage.setItem('batak_theme', isLightMode ? 'light' : 'dark');
}
// Restore theme
isLightMode = localStorage.getItem('batak_theme') === 'light';
applyTheme(isLightMode);

// ═══════════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════════
function tick() {
  const d = new Date();
  document.getElementById('clock').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const h = d.getHours();
  const g = h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  document.getElementById('home-greeting').textContent = g;
}
tick(); setInterval(tick, 60000);

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function todayKey() { return new Date().toISOString().split('T')[0]; }
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
let fpResetEmail = '';

function initAuth() {
  // Try to auto-login with cookie
  API.me().then(user => {
    currentUser = user;
    userData = { bestStreak: user.bestStreak || 0 };
    hideAuthOverlay();
    loadServerData();
  }).catch(() => {
    document.getElementById('auth-overlay').style.display = 'flex';
  });
}

function hideAuthOverlay() {
  document.getElementById('auth-overlay').style.opacity = '0';
  setTimeout(() => { document.getElementById('auth-overlay').style.display = 'none'; }, 400);
}

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('form-signup').style.display = tab === 'signup' ? 'block' : 'none';
}

async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';
  if (!email || !password) { errEl.textContent = 'Please fill in all fields.'; return; }
  try {
    const data = await API.login(email, password);
    setToken(data.token);
    currentUser = data.user;
    userData = { bestStreak: 0 };
    hideAuthOverlay();
    await loadServerData();
    toast('Welcome back, ' + data.user.name + '! 💪', 'success');
  } catch (e) {
    errEl.textContent = e.message;
  }
}

async function handleSignup() {
  const name    = document.getElementById('signup-name').value.trim();
  const email   = document.getElementById('signup-email').value.trim();
  const pass    = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const errEl   = document.getElementById('signup-error');
  errEl.textContent = '';
  if (!name || !email || !pass) { errEl.textContent = 'Please fill in all fields.'; return; }
  if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  if (pass !== confirm) { errEl.textContent = 'Passwords do not match.'; return; }
  try {
    const data = await API.signup(name, email, pass);
    setToken(data.token);
    currentUser = data.user;
    userData = { bestStreak: 0 };
    hideAuthOverlay();
    await loadServerData();
    toast('Account created! Let\'s get strong 🔥', 'success');
  } catch (e) {
    errEl.textContent = e.message;
  }
}

async function handleSocialLogin(type) {
  try {
    const data = await API.guest(type);
    setToken(data.token);
    currentUser = data.user;
    userData = { bestStreak: 0 };
    hideAuthOverlay();
    await loadServerData();
    toast('Welcome, ' + type + '! 👋', 'success');
  } catch (e) {
    toast(e.message, 'orange');
  }
}

async function handleLogout() {
  try { await API.logout(); } catch {}
  setToken(null);
  currentUser = null;
  history = []; nutLogs = {}; waterData = {}; customWorkouts = [];
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('auth-overlay').style.opacity = '1';
}

function togglePass(id, btn) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

// ─── Forgot Password ──────────────────────────────────────
function showForgotPassword() {
  document.getElementById('fp-overlay').style.display = 'flex';
  fpGoStep(1);
  document.getElementById('fp-email').value = '';
}
function closeForgotPassword() {
  document.getElementById('fp-overlay').style.display = 'none';
}
function fpGoStep(n) {
  [1,2,3,4].forEach(i => document.getElementById('fp-step'+i).style.display = i===n?'block':'none');
}

async function handleForgotEmail() {
  const email = document.getElementById('fp-email').value.trim();
  const errEl = document.getElementById('fp-error1');
  errEl.textContent = '';
  if (!email) { errEl.textContent = 'Please enter your email.'; return; }
  try {
    const res = await API.fpVerifyEmail(email);
    fpResetEmail = email;
    document.getElementById('fp-sec-prompt').textContent = res.question;
    document.getElementById('fp-sec-answer').value = '';
    document.getElementById('fp-error2').textContent = '';
    fpGoStep(2);
    setTimeout(() => document.getElementById('fp-sec-answer').focus(), 80);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

async function handleSecurityCheck() {
  const answer = document.getElementById('fp-sec-answer').value.trim();
  const errEl  = document.getElementById('fp-error2');
  errEl.textContent = '';
  if (!answer) { errEl.textContent = 'Please provide an answer.'; return; }
  try {
    await API.fpVerifyAnswer(fpResetEmail, answer);
    document.getElementById('fp-error3').textContent = '';
    fpGoStep(3);
    setTimeout(() => { document.getElementById('fp-newpass').focus(); initStrengthMeter(); }, 80);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

function initStrengthMeter() {
  const inp = document.getElementById('fp-newpass');
  if (inp._fp_bound) return;
  inp._fp_bound = true;
  inp.addEventListener('input', () => {
    const v = inp.value;
    let score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const pct = Math.min(100, score * 20);
    const fill  = document.getElementById('fp-strength-fill');
    const label = document.getElementById('fp-strength-label');
    const colors = ['#ef4444','#f97316','#eab308','#22c55e','#10b981'];
    const labels = ['Too short','Weak','Fair','Strong','Very strong'];
    fill.style.width = pct + '%';
    fill.style.background = colors[score-1] || '#ef4444';
    label.textContent = v.length ? (labels[score-1] || 'Too short') : '';
    label.style.color = colors[score-1] || 'var(--muted)';
  });
}

async function handleNewPassword() {
  const newPass = document.getElementById('fp-newpass').value;
  const confirm = document.getElementById('fp-confirmpass').value;
  const errEl   = document.getElementById('fp-error3');
  errEl.textContent = '';
  if (!newPass || !confirm) { errEl.textContent = 'Please fill in both fields.'; return; }
  if (newPass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }
  if (newPass !== confirm) { errEl.textContent = 'Passwords do not match.'; return; }
  try {
    await API.fpReset(fpResetEmail, newPass);
    fpGoStep(4);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

// ═══════════════════════════════════════════════════════════
// LOAD SERVER DATA
// ═══════════════════════════════════════════════════════════
async function loadServerData() {
  try {
    const [h, ng, nl, w, g, cw] = await Promise.all([
      API.getHistory(),
      API.getNutGoals(),
      API.getNutLogs(),
      API.getWater(),
      API.getGoals(),
      API.getCustomWorkouts(),
    ]);
    history        = h  || [];
    nutGoals       = ng || { calories:2000, protein:150, carbs:250, fat:65 };
    nutLogs        = nl || {};
    waterData      = w  || {};
    weekGoal       = g  || { workouts:5, calories:2000 };
    customWorkouts = cw || [];
    renderHome();
    updateProfileName();
    scheduleWorkoutReminder();
    scheduleMotivation();
  } catch (e) {
    console.warn('Could not load server data:', e.message);
    renderHome();
  }
}

function updateProfileName() {
  if (!currentUser) return;
  document.getElementById('prof-name').textContent = (currentUser.name || 'ATHLETE').toUpperCase();
  document.getElementById('prof-since').textContent = 'Member since ' +
    new Date(currentUser.joinDate + 'T12:00:00').toLocaleDateString([], { month:'long', year:'numeric' });
  if (currentUser.avatar) {
    document.getElementById('prof-avatar-display').innerHTML =
      `<img src="${currentUser.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  }
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
const PAGES = ['home','workouts','exercises','history','profile','nutrition','calendar'];
let curPage = 'home';
const nbMap = { home:'nb-home', workouts:'nb-workouts', exercises:'nb-workouts',
                nutrition:'nb-nutrition', profile:'nb-profile', history:'nb-home', calendar:'nb-calendar' };

function goTo(page) {
  if (page === curPage) return;
  const prev = document.getElementById('s-' + curPage);
  const next = document.getElementById('s-' + page);
  prev.classList.remove('active'); prev.classList.add('exit');
  setTimeout(() => prev.classList.remove('exit'), 300);
  next.classList.add('active');
  curPage = page;
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
  if (nbMap[page]) document.getElementById(nbMap[page]).classList.add('active');
  if (page === 'home')      renderHome();
  if (page === 'workouts')  renderWorkouts();
  if (page === 'exercises') renderExercises();
  if (page === 'history')   renderHistory();
  if (page === 'profile')   renderProfile();
  if (page === 'nutrition') renderNutrition();
  if (page === 'calendar')  renderCalendar();
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.innerHTML = (type === 'success' ? '✅' : '🔥') + ' ' + msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════
function getThisWeek() {
  const now = new Date(), day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return history.filter(h => { const d = new Date(h.date); return d >= mon && d <= sun; });
}
function getStreak() {
  if (!history.length) return 0;
  const dates = [...new Set(history.map(h => h.date))].sort().reverse();
  const todayDate = new Date(); todayDate.setHours(0,0,0,0);
  let cur = new Date(dates[0]); cur.setHours(0,0,0,0);
  if ((todayDate - cur) / 86400000 > 1) return 0;
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]); d.setHours(0,0,0,0);
    if (i === 0) { streak = 1; cur = d; continue; }
    if ((cur - d) / 86400000 === 1) { streak++; cur = d; } else break;
  }
  return streak;
}
function renderHome() {
  const week = getThisWeek();
  const totalWorkouts = history.length;
  const totalMins = history.reduce((s,h) => s+h.duration, 0);
  const totalCal  = history.reduce((s,h) => s+h.calories, 0);
  const streak = getStreak();
  const weekCal = week.reduce((s,h) => s+h.calories, 0);

  document.getElementById('h-workouts').textContent = totalWorkouts;
  document.getElementById('h-mins').textContent     = totalMins;
  document.getElementById('h-cal').textContent      = totalCal;
  document.getElementById('streak-label').textContent = `🔥 ${streak} DAY STREAK`;
  document.getElementById('hero-sub-text').textContent = totalWorkouts > 0
    ? `${totalWorkouts} workouts completed!` : 'Start your first workout!';
  document.getElementById('home-date').textContent =
    new Date().toLocaleDateString([], { weekday:'long', month:'long', day:'numeric' });

  const wgW = weekGoal.workouts || 5, wgC = weekGoal.calories || 2000;
  drawRing('ring-workouts', week.length / wgW, '#ff6b2b');
  drawRing('ring-calories', weekCal / wgC,     '#00d4ff');
  document.getElementById('ring-w-val').textContent = `${week.length} / ${wgW} this week`;
  document.getElementById('ring-c-val').textContent = `${weekCal} / ${wgC} kcal`;

  const rec = WORKOUTS.slice(0,3);
  document.getElementById('today-workouts').innerHTML = rec.map(w => `
    <div class="workout-card-sm px22" onclick="showWorkoutSheet('${esc(w.id)}')">
      <div class="wc-icon" style="background:${esc(w.color)}20;border:1px solid ${esc(w.color)}30;overflow:hidden;">${w.image
        ? `<img src="${esc(w.image)}" alt="${esc(w.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
        : esc(w.emoji)}</div>
      <div class="wc-info">
        <div class="wc-name">${esc(w.name)}</div>
        <div class="wc-meta">${w.exercises.length} exercises · ${w.duration} min · ${w.calories} kcal</div>
      </div>
      <div class="wc-badge badge-orange">${esc(w.difficulty)}</div>
    </div>`).join('');
  drawWeekChart();
}

function drawRing(id, pct, color) {
  const c = document.getElementById(id); if (!c) return;
  const ctx = c.getContext('2d'), S=52, cx=26, cy=26, R=20;
  ctx.clearRect(0,0,S,S);
  ctx.beginPath(); ctx.arc(cx,cy,R,-Math.PI/2,Math.PI*2-Math.PI/2);
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=5; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx,cy,R,-Math.PI/2,(Math.PI*2*Math.min(pct,1))-Math.PI/2);
  ctx.strokeStyle=color; ctx.lineWidth=5; ctx.lineCap='round'; ctx.stroke();
}

function drawWeekChart() {
  const c = document.getElementById('week-chart'); if (!c) return;
  const W = c.offsetWidth||349, H=120;
  c.width=W*2; c.height=H*2; c.style.width=W+'px'; c.style.height=H+'px';
  const ctx = c.getContext('2d'); ctx.scale(2,2);
  const days=[], labels=[], vals=[];
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = d.toISOString().split('T')[0];
    days.push(ds);
    labels.push(d.toLocaleDateString([],{weekday:'short'}).toUpperCase()[0]);
    vals.push(history.filter(h => h.date===ds).length);
  }
  const maxV = Math.max(...vals,1);
  const todayStr = new Date().toISOString().split('T')[0];
  const slot=W/7, bw=Math.min(slot*0.48,28), padB=28, padT=12;
  ctx.clearRect(0,0,W,H);
  days.forEach((d,i) => {
    const cx2=i*slot+slot/2, x=cx2-bw/2, isToday=d===todayStr, hasData=vals[i]>0;
    const bh=hasData?(vals[i]/maxV)*(H-padT-padB):5, y=H-padB-bh, r=6;
    if (hasData) {
      ctx.save(); ctx.shadowColor=isToday?'rgba(255,107,43,0.5)':'rgba(0,212,255,0.35)'; ctx.shadowBlur=10;
      const gr=ctx.createLinearGradient(0,y,0,H-padB);
      if (isToday) { gr.addColorStop(0,'rgba(255,107,43,1)'); gr.addColorStop(1,'rgba(255,107,43,0.55)'); }
      else { gr.addColorStop(0,'rgba(0,212,255,0.9)'); gr.addColorStop(1,'rgba(0,212,255,0.4)'); }
      ctx.fillStyle=gr;
      ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+bw-r,y);
      ctx.quadraticCurveTo(x+bw,y,x+bw,y+r); ctx.lineTo(x+bw,H-padB); ctx.lineTo(x,H-padB);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.fill(); ctx.restore();
      ctx.fillStyle=isToday?'rgba(255,107,43,0.9)':'rgba(0,212,255,0.8)';
      ctx.font='bold 8px "DM Mono",monospace'; ctx.textAlign='center';
      ctx.fillText(vals[i]+'x',cx2,y-4);
    } else {
      ctx.fillStyle='rgba(255,255,255,0.05)';
      ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+bw-r,y);
      ctx.quadraticCurveTo(x+bw,y,x+bw,y+r); ctx.lineTo(x+bw,H-padB); ctx.lineTo(x,H-padB);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.fill();
    }
    const isActive=isToday||hasData;
    ctx.fillStyle=isToday?'rgba(255,107,43,0.95)':isActive?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.25)';
    ctx.font=(isToday?'bold ':'')+' 9px "Space Grotesk",sans-serif'; ctx.textAlign='center';
    ctx.fillText(labels[i],cx2,H-8);
    if (isToday) { ctx.beginPath(); ctx.arc(cx2,H-3,2,0,Math.PI*2); ctx.fillStyle='rgba(255,107,43,0.9)'; ctx.fill(); }
  });
}

// ═══════════════════════════════════════════════════════════
// WORKOUTS
// ═══════════════════════════════════════════════════════════
let planFilter = 'All';
function filterPlans(cat) {
  planFilter = cat;
  document.querySelectorAll('.plan-tab').forEach(t => t.classList.toggle('active', t.textContent===cat));
  renderWorkouts();
}
function renderWorkouts() {
  const all = [...WORKOUTS, ...customWorkouts];
  const filtered = planFilter==='All' ? all : all.filter(w => w.category===planFilter);
  document.getElementById('workout-list').innerHTML = (filtered.length ? filtered.map(w => `
    <div class="workout-big-card" onclick="showWorkoutSheet('${esc(w.id)}')">
      <div class="wbc-img" style="background:${esc(w.color)}18;overflow:hidden;border-radius:12px;">${w.image
        ? `<img src="${esc(w.image)}" alt="${esc(w.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">`
        : esc(w.emoji)}</div>
      <div class="wbc-body">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="wbc-name">${esc(w.name)}</div>
          ${w.custom ? '<span style="font-size:0.6rem;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(196,77,255,0.15);color:var(--purple);">CUSTOM</span>' : ''}
        </div>
        <div class="wbc-meta">${w.exercises.length} exercises · ${w.duration} min · ~${w.calories} kcal</div>
        <div class="wbc-tags">
          <span class="tag" style="background:${esc(w.color)}20;color:${esc(w.color)}">${esc(w.category)}</span>
          <span class="tag" style="background:rgba(255,255,255,0.06);color:var(--muted2)">${esc(w.difficulty)}</span>
          <span class="tag" style="background:rgba(57,211,83,0.12);color:var(--green)">${w.duration} min</span>
        </div>
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:48px 22px;color:var(--muted)"><div style="font-size:2.5rem;margin-bottom:10px">🏋️</div><div>No workouts in this category yet.</div></div>')
    + `<div style="margin:8px 22px 16px;">
        <div onclick="openBuilder()" style="border:1.5px dashed rgba(0,255,136,0.2);border-radius:16px;padding:18px;text-align:center;cursor:pointer;color:var(--neon);font-weight:700;font-size:0.88rem;transition:background 0.2s;">
          ✏️ Create Custom Workout
        </div>
      </div>`;
}

function showWorkoutSheet(id) {
  const w = [...WORKOUTS,...customWorkouts].find(x => x.id===id);
  if (!w) return;
  const sh = document.getElementById('sheet');
  document.getElementById('sheet-content').innerHTML = `
    <div class="sheet-handle"></div>
    <div style="position:relative;width:100%;height:140px;border-radius:16px;overflow:hidden;margin-bottom:14px;background:var(--s2);">
      ${w.image
        ? `<img src="${esc(w.image)}" id="workout-sheet-img-${esc(w.id)}" alt="${esc(w.name)}" style="width:100%;height:100%;object-fit:cover;">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3.5rem;">${esc(w.emoji)}</div>`}
      <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.7));padding:12px 14px;">
        <div style="font-size:1.1rem;font-weight:800;color:#fff;">${esc(w.name)}</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <span class="tag" style="background:${esc(w.color)}20;color:${esc(w.color)};padding:5px 12px;border-radius:99px;font-size:0.72rem;font-weight:700">${esc(w.category)}</span>
      <span class="tag" style="background:rgba(255,255,255,0.06);color:var(--muted2);padding:5px 12px;border-radius:99px;font-size:0.72rem;font-weight:700">${esc(w.difficulty)}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;">
      <div style="background:var(--s2);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);">
        <div style="font-family:'DM Mono',monospace;font-size:1.1rem;color:var(--neon)">${w.exercises.length}</div>
        <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-top:2px">Exercises</div>
      </div>
      <div style="background:var(--s2);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);">
        <div style="font-family:'DM Mono',monospace;font-size:1.1rem;color:var(--cyan)">${w.duration}</div>
        <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-top:2px">Minutes</div>
      </div>
      <div style="background:var(--s2);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);">
        <div style="font-family:'DM Mono',monospace;font-size:1.1rem;color:var(--green)">${w.calories}</div>
        <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-top:2px">Calories</div>
      </div>
    </div>
    <div style="margin-bottom:18px;">
      ${w.exercises.map(e => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
          <div style="width:40px;height:40px;border-radius:8px;background:var(--s3);overflow:hidden;flex-shrink:0">${e.image
            ? `<img src="${esc(e.image)}" alt="${esc(e.name)}" style="width:100%;height:100%;object-fit:cover;">`
            : esc(e.icon)}</div>
          <div style="flex:1">
            <div style="font-size:0.85rem;font-weight:700;color:var(--text)">${esc(e.name)}</div>
            <div style="font-size:0.7rem;color:var(--muted2)">${e.type==='timed'?e.duration+'s':e.sets+'×'+e.reps+' reps'} · ${esc(e.muscle)}</div>
          </div>
        </div>`).join('')}
    </div>
    <button class="sheet-btn primary" onclick="startWorkout('${esc(w.id)}')">▶ START WORKOUT</button>
    ${w.custom ? `<button class="sheet-btn ghost" onclick="openBuilderById('${esc(w.id)}')" style="background:rgba(196,77,255,0.1);color:var(--purple);border:1px solid rgba(196,77,255,0.2);">✏️ Edit Workout</button>
    <button class="sheet-btn ghost" onclick="deleteCustomWorkout('${esc(w.id)}')" style="background:var(--red-dim);color:var(--red);">🗑 Delete Workout</button>` : ''}
    <button class="sheet-btn ghost" onclick="closeSheet()">Cancel</button>`;
  sh.classList.add('open');
}

function openBuilderById(id) {
  const w = customWorkouts.find(x => x.id===id);
  if (w) openBuilder(w);
}
function closeSheet() { document.getElementById('sheet').classList.remove('open'); }
document.getElementById('sheet').addEventListener('click', e => {
  if (e.target === document.getElementById('sheet')) closeSheet();
});

// ═══════════════════════════════════════════════════════════
// EXERCISES
// ═══════════════════════════════════════════════════════════
let muscleFilter='All', searchQ='';
function renderExercises() {
  document.getElementById('muscle-chips').innerHTML = MUSCLES.map(m =>
    `<button class="chip ${m===muscleFilter?'active':''}" onclick="filterMuscle('${m}')">${m}</button>`).join('');
  filterExercises();
}
function filterMuscle(m) { muscleFilter = m; renderExercises(); }
function filterExercises() {
  searchQ = document.getElementById('ex-search')?.value?.toLowerCase() || '';
  let list = ALL_EXERCISES;
  if (muscleFilter !== 'All') list = list.filter(e => e.muscle===muscleFilter || e.muscle.includes(muscleFilter));
  if (searchQ) list = list.filter(e => e.name.toLowerCase().includes(searchQ));
  const diffClass = { beginner:'diff-b', intermediate:'diff-i', advanced:'diff-a' };
  document.getElementById('ex-grid').innerHTML = list.map(e => `
    <div class="ex-card" onclick="openExercisePopup('${esc(e.name)}')">
      <div class="ex-icon">${e.image
        ? `<img src="${e.image}" alt="${e.name}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;">`
        : e.icon}</div>
      <div class="ex-info">
        <div class="ex-name">${e.name}</div>
        <div class="ex-muscle">🎯 ${e.muscle}</div>
      </div>
      <div class="ex-diff ${diffClass[e.difficulty]||'diff-b'}">${e.difficulty}</div>
    </div>`).join('');
}

function openExercisePopup(name) {
  const e = ALL_EXERCISES.find(x => x.name===name); if (!e) return;
  const popup = document.getElementById('exercise-popup');
  const content = document.getElementById('ex-popup-content');
  content.innerHTML = `
    <div style="text-align:center;">
      <div style="width:100%;height:160px;border-radius:14px;overflow:hidden;margin-bottom:14px;background:var(--s2);">
        ${e.image
          ? `<img src="${e.image}" alt="${e.name}" id="ex-popup-img" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;">${e.icon}</div>`}
      </div>
      <div style="font-size:1.5rem;font-weight:800;color:var(--text);margin-bottom:4px;">${e.name}</div>
      <div style="color:var(--muted2);margin-bottom:12px;font-size:0.82rem;">🎯 ${e.muscle}</div>
      <div style="margin-bottom:16px;"><span class="tag">${e.difficulty}</span></div>
      <button class="sheet-btn primary" onclick="addExerciseToBuilder('${e.name}')">➕ Add to Workout</button>
      <button class="sheet-btn ghost" onclick="closeExercisePopup()">Close</button>
    </div>`;
  popup.classList.add('open');
}
function closeExercisePopup() { document.getElementById('exercise-popup').classList.remove('open'); }
document.getElementById('exercise-popup').addEventListener('click', e => {
  if (e.target.id === 'exercise-popup') closeExercisePopup();
});

function addExerciseToBuilder(name) {
  const ex = ALL_EXERCISES.find(e => e.name===name);
  if (!ex) return;
  selectedExercise = ex;
  closeExercisePopup();
  openBuilder();
  toast('Added: ' + ex.name);
}

// ═══════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════
function renderHistory() {
  const el = document.getElementById('history-list');
  document.getElementById('hist-sub').textContent = `${history.length} workout${history.length!==1?'s':''} logged`;
  if (!history.length) {
    el.innerHTML = '<div style="text-align:center;padding:60px 22px;color:var(--muted)"><div style="font-size:3rem;margin-bottom:12px">📋</div><div style="font-size:0.88rem">No workouts yet.<br>Complete your first one!</div></div>';
    return;
  }
  const sorted = [...history].sort((a,b) => new Date(b.date) - new Date(a.date));
  el.innerHTML = sorted.map(h => `
    <div class="hist-card">
      <div class="hist-top">
        <div>
          <div class="hist-name">${esc(h.workoutName)}</div>
          <div class="hist-date">${esc(new Date(h.date+'T12:00:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',year:'numeric'}))}</div>
        </div>
        <div style="font-size:1.5rem">${esc(h.emoji||'💪')}</div>
      </div>
      <div class="hist-stats">
        <div class="hs-item">⏱ <span>${esc(h.duration)}</span> min</div>
        <div class="hs-item">🔥 <span>${esc(h.calories)}</span> kcal</div>
        <div class="hs-item">💪 <span>${esc(h.exercises)}</span> exercises</div>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════
const ACHIEVEMENTS = [
  { id:'first',   name:'First Rep',    icon:'🌟', desc:'Complete first workout', check:h=>h.length>=1 },
  { id:'week',    name:'Week Warrior', icon:'📅', desc:'7 workouts',             check:h=>h.length>=7 },
  { id:'fire',    name:'On Fire',      icon:'🔥', desc:'3-day streak',           check:(h,s)=>s>=3 },
  { id:'iron',    name:'Iron Will',    icon:'🏆', desc:'20 workouts',            check:h=>h.length>=20 },
  { id:'century', name:'Century',      icon:'💯', desc:'100 workouts',           check:h=>h.length>=100 },
  { id:'calorie', name:'Calorie King', icon:'⚡', desc:'10,000 kcal burned',    check:h=>h.reduce((s,x)=>s+x.calories,0)>=10000 },
];

function renderProfile() {
  loadAvatar();
  const totalW = history.length;
  const totalM = history.reduce((s,h) => s+h.duration, 0);
  const totalC = history.reduce((s,h) => s+h.calories, 0);
  const streak = getStreak();
  const best   = Math.max(streak, userData.bestStreak||0);
  const week   = getThisWeek();
  const weekCal= week.reduce((s,h) => s+h.calories, 0);
  const level  = totalW>=50?'ELITE':totalW>=20?'ADVANCED':totalW>=10?'INTERMEDIATE':'BEGINNER';
  updateProfileName();
  document.getElementById('prof-level').textContent = level;
  document.getElementById('pg-total').textContent   = totalW;
  document.getElementById('pg-mins').textContent    = totalM;
  document.getElementById('pg-cal').textContent     = totalC;
  document.getElementById('pg-streak').textContent  = best;

  document.getElementById('achievements').innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = a.check(history, streak);
    return `<div class="ach-card ${unlocked?'unlocked':''}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-status">${unlocked?'✓ Unlocked':'Locked'}</div>
    </div>`;
  }).join('');

  const R = 18, CIRC2 = 2*Math.PI*R;
  const goals = [
    { name:'Workouts / Week', val:week.length, target:weekGoal.workouts||5, color:'var(--orange)', glow:'var(--orange-glow)', icon:'🏋️' },
    { name:'Calories / Week', val:weekCal,     target:weekGoal.calories||2000, color:'var(--cyan)', glow:'var(--cyan-glow)', icon:'🔥' },
    { name:'Total Workouts',  val:totalW,      target:50, color:'var(--purple)', glow:'rgba(191,90,242,0.3)', icon:'🏆' },
  ];
  document.getElementById('goals-list').innerHTML = goals.map(g => {
    const pct  = Math.min(g.val/g.target, 1);
    const dash = CIRC2*pct, gap=CIRC2-dash;
    const over = g.val > g.target;
    const label= over?'DONE!':Math.round(pct*100)+'%';
    return `<div class="goal-item">
      <div class="goal-ring-wrap">
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="${R}" fill="none" stroke="var(--s3)" stroke-width="3.5"/>
          <circle cx="22" cy="22" r="${R}" fill="none" stroke="${g.color}" stroke-width="3.5"
            stroke-linecap="round" stroke-dasharray="${dash} ${gap}" transform="rotate(-90 22 22)"
            style="filter:drop-shadow(0 0 4px ${g.glow});transition:stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)"/>
        </svg>
        <div class="goal-ring-pct" style="color:${g.color};font-size:0.5rem;">${label}</div>
      </div>
      <div class="goal-info">
        <div class="goal-header">
          <div class="goal-name">${g.icon} ${g.name}</div>
          <div class="goal-prog" style="color:${g.color}">${g.val}<span style="color:var(--muted2)"> / ${g.target}</span></div>
        </div>
        <div class="goal-bar"><div class="goal-fill" style="width:${pct*100}%;background:${g.color};box-shadow:0 0 8px ${g.glow};"></div></div>
      </div>
    </div>`;
  }).join('');

  drawMonthChart();
}

function loadAvatar() {
  const el = document.getElementById('prof-avatar-display');
  if (currentUser?.avatar) {
    el.innerHTML = `<img src="${currentUser.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  } else {
    el.textContent = '🏋️';
  }
}

async function handleAvatarUpload(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    if (currentUser) currentUser.avatar = dataUrl;
    document.getElementById('prof-avatar-display').innerHTML =
      `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    try { await API.updateMe({ avatar: dataUrl }); toast('Profile photo updated ✓','success'); }
    catch { toast('Could not save avatar','orange'); }
  };
  reader.readAsDataURL(file);
}

function drawMonthChart() {
  const c = document.getElementById('month-chart'); if (!c) return;
  const W = c.offsetWidth||349, H=130;
  c.width=W*2; c.height=H*2; c.style.width=W+'px'; c.style.height=H+'px';
  const ctx = c.getContext('2d'); ctx.scale(2,2);
  const weeks=[], labels=[];
  for (let i=3; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i*7);
    labels.push(d.toLocaleDateString([],{month:'short',day:'numeric'}));
    const start=new Date(d); start.setDate(d.getDate()-7);
    weeks.push(history.filter(h => { const hd=new Date(h.date); return hd>=start && hd<=d; }).length);
  }
  const maxV=Math.max(...weeks,1), padL=12,padR=12,padT=18,padB=26;
  const iW=W-padL-padR, iH=H-padT-padB;
  const pts=weeks.map((v,i) => ({ x:padL+i*(iW/(weeks.length-1)), y:padT+iH*(1-v/maxV) }));
  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
  for (let g=0; g<=3; g++) { const gy=padT+iH*(g/3); ctx.beginPath(); ctx.moveTo(padL,gy); ctx.lineTo(W-padR,gy); ctx.stroke(); }
  ctx.beginPath();
  pts.forEach((p,i) => {
    if (i===0) { ctx.moveTo(p.x,p.y); return; }
    const prev=pts[i-1], cpx=(prev.x+p.x)/2;
    ctx.bezierCurveTo(cpx,prev.y,cpx,p.y,p.x,p.y);
  });
  ctx.lineTo(pts[pts.length-1].x,H-padB); ctx.lineTo(pts[0].x,H-padB); ctx.closePath();
  const ag=ctx.createLinearGradient(0,padT,0,H-padB);
  ag.addColorStop(0,'rgba(196,77,255,0.28)'); ag.addColorStop(0.7,'rgba(196,77,255,0.06)'); ag.addColorStop(1,'transparent');
  ctx.fillStyle=ag; ctx.fill();
  ctx.save(); ctx.shadowColor='rgba(196,77,255,0.6)'; ctx.shadowBlur=8;
  ctx.beginPath();
  pts.forEach((p,i) => {
    if (i===0) { ctx.moveTo(p.x,p.y); return; }
    const prev=pts[i-1], cpx=(prev.x+p.x)/2;
    ctx.bezierCurveTo(cpx,prev.y,cpx,p.y,p.x,p.y);
  });
  ctx.strokeStyle='#c44dff'; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.stroke(); ctx.restore();
  pts.forEach((p,i) => {
    ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2); ctx.fillStyle='rgba(196,77,255,0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fillStyle='#c44dff'; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
    if (weeks[i]>0) { ctx.fillStyle='rgba(196,77,255,0.9)'; ctx.font='bold 8px "DM Mono",monospace'; ctx.textAlign='center'; ctx.fillText(weeks[i],p.x,p.y-9); }
    ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.font='8px "Space Grotesk",sans-serif'; ctx.textAlign='center';
    ctx.fillText(labels[i],p.x,H-8);
  });
}

// ═══════════════════════════════════════════════════════════
// SOUND ENGINE
// ═══════════════════════════════════════════════════════════
let _ac = null;
function getAC() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  if (_ac.state === 'suspended') _ac.resume();
  return _ac;
}
document.addEventListener('touchstart', ()=>{ try{ getAC(); }catch(e){} }, { once:true });
document.addEventListener('click',      ()=>{ try{ getAC(); }catch(e){} }, { once:true });

function playTone(freq, dur, type='sine', vol=0.25, delay=0) {
  try {
    const ac=getAC(), osc=ac.createOscillator(), gain=ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type=type; osc.frequency.value=freq;
    const t=ac.currentTime+delay;
    gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(vol,t+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001,t+dur);
    osc.start(t); osc.stop(t+dur+0.05);
  } catch(e){}
}
function playChord(notes,dur,type='sine',vol=0.18,delay=0){ notes.forEach(f=>playTone(f,dur,type,vol,delay)); }
function soundTick()      { playTone(880,0.06,'sine',0.07); }
function soundCountdown(s){ if(s===3) playTone(660,0.12,'square',0.18); if(s===2) playTone(660,0.14,'square',0.22); if(s===1) playTone(880,0.18,'square',0.28); }
function soundTimerDone() { [523,659,784,1047].forEach((f,i)=>playTone(f,0.22,'triangle',0.22,i*0.1)); setTimeout(()=>playChord([523,659,784],0.4,'triangle',0.15),450); }
function soundSetDone()   { playTone(784,0.08,'sine',0.2); playTone(1047,0.12,'sine',0.18,0.09); }
function soundRestTick()  { playTone(440,0.05,'sine',0.05); }
function soundRestCountdown(s){ if(s===3) playTone(523,0.10,'sine',0.14); if(s===2) playTone(523,0.10,'sine',0.18); if(s===1) playTone(659,0.15,'sine',0.22); }
function soundRestDone()  { playTone(880,0.12,'sine',0.22); playTone(1174,0.18,'sine',0.20,0.13); }
function soundWorkoutDone(){ [261,329,392,523,659,784,1047].forEach((f,i)=>playTone(f,0.18,'triangle',0.2,i*0.08)); setTimeout(()=>{ playChord([523,659,784,1047],0.7,'triangle',0.18); playTone(1568,0.5,'sine',0.12,0.05); },620); }
function soundExerciseStart(){ playTone(659,0.08,'sine',0.15); playTone(523,0.12,'sine',0.12,0.09); }

// ═══════════════════════════════════════════════════════════
// ACTIVE WORKOUT
// ═══════════════════════════════════════════════════════════
let AW = { workout:null,exIdx:0,setData:[],timerInterval:null,timerSecs:0,timerMax:0,timerRunning:false,restInterval:null,restSecs:0,startTime:null };

function startWorkout(id) {
  closeSheet();
  const w = [...WORKOUTS,...customWorkouts].find(x => x.id===id); if (!w) return;
  AW.workout=w; AW.exIdx=0; AW.startTime=Date.now(); AW.timerInterval=null; AW.timerRunning=false;
  document.getElementById('aw-title').textContent = w.name.toUpperCase();
  document.getElementById('active-screen').classList.add('open');
  loadExercise(0);
}

function loadExercise(idx) {
  const w=AW.workout, ex=w.exercises[idx]; if (!ex) return;
  AW.exIdx=idx;
  const pct=idx/w.exercises.length*100;
  document.getElementById('aw-prog-fill').style.width = pct+'%';
  document.getElementById('aw-progress-text').textContent = `Exercise ${idx+1} of ${w.exercises.length}`;
  const iconEl=document.getElementById('aw-ex-icon');
  iconEl.innerHTML = ex.image ? `<img src="${ex.image}" alt="${ex.name}" style="width:64px;height:64px;object-fit:cover;border-radius:14px;">` : (ex.icon||'💪');
  document.getElementById('aw-ex-name').textContent   = ex.name.toUpperCase();
  document.getElementById('aw-ex-muscle').textContent = '🎯 '+ex.muscle;
  const isLast=idx===w.exercises.length-1;
  document.getElementById('next-btn').textContent = isLast?'Finish Workout ✓':'Next Exercise →';
  soundExerciseStart();
  setTimeout(() => { const info=ex.type==='timed'?ex.duration:ex.sets+'×'+ex.reps; notifExerciseStart(ex.name,ex.muscle,ex.type,info); }, 500);
  if (ex.type==='timed') {
    document.getElementById('aw-timer-wrap').style.display='block';
    document.getElementById('aw-sets-wrap').style.display='none';
    setupTimer(ex.duration);
  } else {
    document.getElementById('aw-timer-wrap').style.display='none';
    document.getElementById('aw-sets-wrap').style.display='block';
    renderSets(ex);
  }
  renderQueue(idx);
}

function renderSets(ex) {
  const c=document.getElementById('sets-container');
  AW.setData=Array.from({length:ex.sets},(_,i)=>({reps:ex.reps,weight:ex.weight||0,done:false}));
  c.innerHTML=AW.setData.map((s,i) => `
    <div class="aw-set-row" id="set-row-${i}">
      <div class="set-num">${i+1}</div>
      <input class="set-input" id="set-r-${i}" type="number" value="${s.reps}" placeholder="reps" min="0" onchange="updateSet(${i},'reps',this.value)">
      <button class="set-done-btn" id="set-done-${i}" onclick="toggleSetDone(${i})">✓</button>
    </div>`).join('');
}

function updateSet(i,field,val){ if(AW.setData[i]) AW.setData[i][field]=parseFloat(val)||0; }
function toggleSetDone(i){ AW.setData[i].done=!AW.setData[i].done; const btn=document.getElementById('set-done-'+i); btn.classList.toggle('done',AW.setData[i].done); if(AW.setData[i].done){soundSetDone();startRestTimer(60);} }

function renderQueue(curIdx) {
  const rem=AW.workout.exercises.slice(curIdx+1,curIdx+4);
  document.getElementById('aw-ex-list').innerHTML=rem.length?rem.map(e=>`
    <div class="aw-ex-li">
      ${e.image?`<img src="${e.image}" alt="${e.name}" style="width:32px;height:32px;object-fit:cover;border-radius:8px;flex-shrink:0;">`:`<span>${e.icon}</span>`}
      <span>${e.name}</span>
      <span style="margin-left:auto;font-size:0.68rem;font-family:'DM Mono',monospace;">${e.type==='timed'?e.duration+'s':e.sets+'×'+e.reps}</span>
    </div>`).join(''):'<div style="font-size:0.78rem;color:var(--muted);padding:10px 0;text-align:center">Last exercise!</div>';
}

function setupTimer(secs){clearInterval(AW.timerInterval);AW.timerSecs=secs;AW.timerMax=secs;AW.timerRunning=true;updateTimerUI();AW.timerInterval=setInterval(tickTimer,1000);}
function tickTimer(){if(!AW.timerRunning)return;AW.timerSecs--;updateTimerUI();if(AW.timerSecs<=0){clearInterval(AW.timerInterval);AW.timerRunning=false;soundTimerDone();const exName=AW.workout?.exercises[AW.exIdx]?.name||'Exercise';toast('Exercise done! 🔥','orange');notifExerciseDone(exName);setTimeout(()=>nextExercise(),900);}else{if(AW.timerSecs<=3)soundCountdown(AW.timerSecs);else soundTick();}}
function updateTimerUI(){const m=Math.floor(AW.timerSecs/60),s=AW.timerSecs%60;document.getElementById('timer-display').textContent=`${m}:${s.toString().padStart(2,'0')}`;const CIRC=427,offset=CIRC-(AW.timerSecs/AW.timerMax)*CIRC;document.getElementById('timer-circle').style.strokeDashoffset=offset;}
function toggleTimer(){AW.timerRunning=!AW.timerRunning;const btn=document.querySelector('#aw-timer-wrap .ctrl-btn:first-child');if(btn)btn.textContent=AW.timerRunning?'⏸ Pause':'▶ Resume';}
function resetTimer(){clearInterval(AW.timerInterval);AW.timerSecs=AW.timerMax;AW.timerRunning=true;updateTimerUI();AW.timerInterval=setInterval(tickTimer,1000);}
function updateRestUI(){const m=Math.floor(AW.restSecs/60),s=AW.restSecs%60;document.getElementById('rest-display').textContent=`${m}:${s.toString().padStart(2,'0')}`;}

function startRestTimer(secs){const overlay=document.getElementById('rest-overlay');const nextEx=AW.workout?.exercises[AW.exIdx+1];document.getElementById('rest-next').textContent=nextEx?nextEx.name:'Workout Complete';AW.restSecs=secs;updateRestUI();overlay.classList.add('show');clearInterval(AW.restInterval);notifRestStart(secs,nextEx?.name);AW.restInterval=setInterval(()=>{AW.restSecs--;updateRestUI();if(AW.restSecs<=0){clearInterval(AW.restInterval);overlay.classList.remove('show');soundRestDone();notifRestDone();toast("Rest done! Let's go! 💪",'orange');}else if(AW.restSecs<=3){soundRestCountdown(AW.restSecs);}else{soundRestTick();}},1000);}
function skipRest(){clearInterval(AW.restInterval);document.getElementById('rest-overlay').classList.remove('show');dismissNotif();}
function nextExercise(){const w=AW.workout;const isLast=AW.exIdx===w.exercises.length-1;if(isLast){finishWorkout();return;}clearInterval(AW.timerInterval);loadExercise(AW.exIdx+1);}
function prevExercise(){if(AW.exIdx===0)return;clearInterval(AW.timerInterval);loadExercise(AW.exIdx-1);}

function confirmEndWorkout() {
  const sh=document.getElementById('sheet');
  document.getElementById('sheet-content').innerHTML=`
    <div class="sheet-handle"></div>
    <div class="sheet-title">End Workout?</div>
    <div style="font-size:0.85rem;color:var(--muted2);margin-bottom:20px;line-height:1.6">Your progress will be saved. Are you sure you want to end this workout early?</div>
    <button class="sheet-btn primary" onclick="finishWorkout();closeSheet();">✓ Save & Finish</button>
    <button class="sheet-btn ghost" style="background:var(--red-dim);color:var(--red);" onclick="discardWorkout()">✕ Discard Workout</button>
    <button class="sheet-btn ghost" onclick="closeSheet()">Keep Going 💪</button>`;
  sh.classList.add('open');
}
function discardWorkout(){clearInterval(AW.timerInterval);clearInterval(AW.restInterval);document.getElementById('active-screen').classList.remove('open');closeSheet();toast('Workout discarded','orange');}

async function finishWorkout() {
  clearInterval(AW.timerInterval); clearInterval(AW.restInterval);
  document.getElementById('active-screen').classList.remove('open');
  const w = AW.workout;
  const elapsed = Math.round((Date.now()-AW.startTime)/60000);
  const entry = {
    workoutName: w.name, emoji: w.emoji||'💪',
    date: new Date().toISOString().split('T')[0],
    duration: Math.max(elapsed, w.duration),
    calories: w.calories,
    exercises: w.exercises.length,
  };
  try {
    const saved = await API.addHistory(entry);
    history.push(saved);
  } catch {
    history.push({ id: Date.now().toString(), ...entry });
  }
  const streak = getStreak();
  const best   = Math.max(streak, userData.bestStreak||0);
  if (best > (userData.bestStreak||0)) {
    userData.bestStreak = best;
    try { await API.updateMe({ bestStreak: best }); } catch {}
  }
  soundWorkoutDone();
  toast(`${w.name} complete! 🏆`, 'success');
  showWorkoutComplete(w, entry);
  renderHome();
}

function showWorkoutComplete(w, entry) {
  const sh=document.getElementById('sheet');
  document.getElementById('sheet-content').innerHTML=`
    <div class="sheet-handle"></div>
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:3.5rem;margin-bottom:8px;">🏆</div>
      <div style="font-size:1.3rem;font-weight:800;color:var(--neon);letter-spacing:0.06em;margin-bottom:4px;">WORKOUT COMPLETE!</div>
      <div style="font-size:0.85rem;color:var(--muted2);margin-bottom:20px;">${esc(w.name)}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;">
        <div style="background:var(--s2);border-radius:12px;padding:14px;border:1px solid var(--border);">
          <div style="font-size:1.3rem;font-weight:800;color:var(--orange);font-family:'DM Mono',monospace;">${entry.duration}</div>
          <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-top:2px">Min</div>
        </div>
        <div style="background:var(--s2);border-radius:12px;padding:14px;border:1px solid var(--border);">
          <div style="font-size:1.3rem;font-weight:800;color:var(--red);font-family:'DM Mono',monospace;">${entry.calories}</div>
          <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-top:2px">Kcal</div>
        </div>
        <div style="background:var(--s2);border-radius:12px;padding:14px;border:1px solid var(--border);">
          <div style="font-size:1.3rem;font-weight:800;color:var(--cyan);font-family:'DM Mono',monospace;">${entry.exercises}</div>
          <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-top:2px">Exercises</div>
        </div>
      </div>
      <button class="sheet-btn primary" onclick="closeSheet();goTo('home')">Back to Home 🏠</button>
      <button class="sheet-btn ghost" onclick="closeSheet();goTo('history')">View History 📋</button>
    </div>`;
  sh.classList.add('open');
}

// ═══════════════════════════════════════════════════════════
// NUTRITION
// ═══════════════════════════════════════════════════════════
const FOOD_DB = [
  {name:'Chicken Manok',  icon:'🍗',cal:165,protein:31,carbs:0,  fat:3.6, serving:'100g'},
  {name:'Brown Rice',     icon:'🍚',cal:216,protein:5, carbs:45, fat:1.8, serving:'1 cup'},
  {name:'Whole Egg',      icon:'🥚',cal:78, protein:6, carbs:0.6,fat:5,   serving:'1 egg'},
  {name:'Oatmeal',        icon:'🥣',cal:154,protein:5, carbs:27, fat:2.6, serving:'1 cup'},
  {name:'Saging',         icon:'🍌',cal:89, protein:1.1,carbs:23,fat:0.3, serving:'1 medium'},
  {name:'Greek Yogurt',   icon:'🥛',cal:100,protein:17,carbs:6,  fat:0.7, serving:'170g'},
  {name:'Isda',           icon:'🐟',cal:208,protein:20,carbs:0,  fat:13,  serving:'100g'},
  {name:'Sweet kamoti',   icon:'🍠',cal:86, protein:1.6,carbs:20,fat:0.1, serving:'100g'},
  {name:'Broccoli',       icon:'🥦',cal:34, protein:2.8,carbs:7, fat:0.4, serving:'1 cup'},
  {name:'Mani',           icon:'🥜',cal:164,protein:6, carbs:6,  fat:14,  serving:'28g'},
  {name:'Protein Shake',  icon:'💪',cal:120,protein:25,carbs:3,  fat:1.5, serving:'1 scoop'},
  {name:'White Rice',     icon:'🍚',cal:206,protein:4.3,carbs:45,fat:0.4, serving:'1 cup'},
  {name:'Tuna',           icon:'🐟',cal:109,protein:25,carbs:0,  fat:1,   serving:'100g'},
  {name:'Apple',          icon:'🍎',cal:52, protein:0.3,carbs:14,fat:0.2, serving:'1 medium'},
  {name:'Avocado',        icon:'🥑',cal:160,protein:2, carbs:9,  fat:15,  serving:'100g'},
  {name:'Cottage Cheese', icon:'🧀',cal:98, protein:11, carbs:3.4,fat:4.3,serving:'100g'},
  {name:'Bread (Whole)',  icon:'🍞',cal:69, protein:3.6,carbs:12,fat:1,   serving:'1 slice'},
  {name:'Milk (Low Fat)', icon:'🥛',cal:102,protein:8, carbs:12, fat:2.4, serving:'1 cup'},
  {name:'Peanut Butter',  icon:'🥜',cal:188,protein:8, carbs:6,  fat:16,  serving:'2 tbsp'},
  {name:'Orange',         icon:'🍊',cal:62, protein:1.2,carbs:15,fat:0.2, serving:'1 medium'},
  {name:'Baka',           icon:'🥩',cal:215,protein:26,carbs:0,  fat:12,  serving:'100g'},
  {name:'Spinach',        icon:'🥬',cal:7,  protein:0.9,carbs:1.1,fat:0.1,serving:'1 cup'},
  {name:'Pasta',          icon:'🍝',cal:220,protein:8, carbs:43, fat:1.3, serving:'1 cup'},
  {name:'Blueberries',    icon:'🫐',cal:84, protein:1.1,carbs:21,fat:0.5, serving:'1 cup'},
  {name:'Whey Protein',   icon:'💊',cal:113,protein:25,carbs:2,  fat:1,   serving:'1 scoop'},
  {name:'Pizza Slice',    icon:'🍕',cal:285,protein:12,carbs:36, fat:10,  serving:'1 slice'},
  {name:'Burger',         icon:'🍔',cal:354,protein:17,carbs:29, fat:17,  serving:'1 piece'},
  {name:'Coffee (Black)', icon:'☕',cal:2,  protein:0.3,carbs:0,  fat:0,  serving:'1 cup'},
];
const MEALS = ['Breakfast','Lunch','Dinner','Snacks'];
let nutMealTarget = '';

function getTodayLog() {
  const k = todayKey();
  if (!nutLogs[k]) nutLogs[k] = { Breakfast:[], Lunch:[], Dinner:[], Snacks:[] };
  return nutLogs[k];
}

function renderNutrition() {
  renderDietTips();
  const log = getTodayLog();
  const todayWorkoutCal = history.filter(h => h.date===todayKey()).reduce((s,h) => s+h.calories, 0);
  document.getElementById('nut-date-label').textContent =
    new Date().toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
  let totCal=0,totP=0,totC=0,totF=0;
  MEALS.forEach(m => { (log[m]||[]).forEach(f => { totCal+=f.cal; totP+=f.protein; totC+=f.carbs; totF+=f.fat; }); });
  const goalCal=nutGoals.calories||2000, goalP=nutGoals.protein||150, goalC=nutGoals.carbs||250, goalF=nutGoals.fat||65;
  const remaining=Math.max(goalCal-totCal+todayWorkoutCal,0), net=totCal-todayWorkoutCal;
  document.getElementById('nut-cal-eaten').textContent = Math.round(totCal);
  document.getElementById('nut-cal-goal').textContent  = goalCal;
  document.getElementById('nut-remaining').textContent = remaining;
  document.getElementById('nut-burned').textContent    = todayWorkoutCal;
  document.getElementById('nut-net').textContent       = Math.round(net);
  const calPct=Math.min(totCal/goalCal*100,100);
  document.getElementById('nut-cal-bar').style.width=calPct+'%';
  document.getElementById('nut-cal-bar').style.background=calPct>100?'var(--red)':calPct>85?'var(--yellow)':'var(--green)';
  const CIRC=163;
  function setRing(id,val,goal){ const off=CIRC-(Math.min(val/goal,1)*CIRC); document.getElementById(id).style.strokeDashoffset=off; }
  setRing('mr-protein',totP,goalP); document.getElementById('mr-p-val').textContent=Math.round(totP)+'g'; document.getElementById('mr-p-goal').textContent='/ '+goalP+'g';
  setRing('mr-carbs',totC,goalC);   document.getElementById('mr-c-val').textContent=Math.round(totC)+'g'; document.getElementById('mr-c-goal').textContent='/ '+goalC+'g';
  setRing('mr-fat',totF,goalF);     document.getElementById('mr-f-val').textContent=Math.round(totF)+'g'; document.getElementById('mr-f-goal').textContent='/ '+goalF+'g';
  document.getElementById('meal-groups-list').innerHTML=MEALS.map(m=>{
    const items=log[m]||[], mCal=items.reduce((s,f)=>s+f.cal,0);
    return `<div class="meal-group">
      <div class="meal-group-header">
        <div class="meal-group-name">${esc(mealIcon(m))} ${esc(m)}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="meal-group-cal">${Math.round(mCal)} kcal</div>
          <div class="add-food-btn" onclick="openFoodSheet('${esc(m)}')">＋</div>
        </div>
      </div>
      ${items.length?items.map((f,i)=>`
        <div class="food-item">
          <div class="food-icon">${esc(f.icon)}</div>
          <div class="food-info">
            <div class="food-name">${esc(f.name)}</div>
            <div class="food-macros">P:${esc(f.protein)}g  C:${esc(f.carbs)}g  F:${esc(f.fat)}g · ${esc(f.serving)}</div>
          </div>
          <div class="food-cal-val">${esc(f.cal)}</div>
          <button class="food-del" onclick="removeFood('${esc(m)}',${i})">✕</button>
        </div>`).join(''):
        `<div style="padding:14px 16px;font-size:0.78rem;color:var(--muted);text-align:center;">Tap ＋ to log ${esc(m.toLowerCase())}</div>`}
    </div>`;
  }).join('');
  const w=waterData[todayKey()]||0;
  document.getElementById('water-label').textContent=`${w} / 8 glasses`;
  document.getElementById('water-cups').innerHTML=Array.from({length:8},(_,i)=>
    `<div class="water-cup ${i<w?'filled':''}" onclick="toggleWater(${i})">💧</div>`).join('');
}

function mealIcon(m){ return {Breakfast:'🌅',Lunch:'☀️',Dinner:'🌙',Snacks:'🍎'}[m]||'🍽'; }

async function toggleWater(i){
  const k=todayKey(), cur=waterData[k]||0;
  waterData[k]= i < cur ? i : i+1;
  try { await API.putWater(waterData); } catch {}
  renderNutrition();
}
async function resetWater(){
  waterData[todayKey()]=0;
  try { await API.putWater(waterData); } catch {}
  renderNutrition();
}

async function removeFood(meal,idx){
  const log=getTodayLog();
  log[meal].splice(idx,1);
  try { await API.putNutLogs(nutLogs); } catch {}
  renderNutrition();
  toast('Food removed');
}

async function addFoodToMeal(food){
  const log=getTodayLog();
  log[nutMealTarget].push({...food});
  try { await API.putNutLogs(nutLogs); } catch {}
  closeSheet();
  renderNutrition();
  toast(`${food.name} added to ${nutMealTarget} 🥗`,'success');
}

function openFoodSheet(meal){
  nutMealTarget=meal;
  const sh=document.getElementById('sheet');
  document.getElementById('sheet-content').innerHTML=`
    <div class="sheet-handle"></div>
    <div class="sheet-title">${mealIcon(meal)} Add to ${meal}</div>
    <div class="food-search-wrap">
      <input class="food-search" id="food-search-input" type="text" placeholder="Search food…" oninput="filterFoodResults()" autofocus>
    </div>
    <div class="food-results" id="food-results-list"></div>`;
  sh.classList.add('open');
  setTimeout(()=>{ filterFoodResults(); document.getElementById('food-search-input')?.focus(); },100);
}

function filterFoodResults(){
  const q=(document.getElementById('food-search-input')?.value||'').toLowerCase();
  const list=q?FOOD_DB.filter(f=>f.name.toLowerCase().includes(q)):FOOD_DB;
  const slice=list.slice(0,12);
  document.getElementById('food-results-list').innerHTML=slice.map(f=>`
    <div class="food-result-item" onclick='addFoodToMeal(${JSON.stringify(f)})'>
      <div class="fri-icon">${esc(f.icon)}</div>
      <div>
        <div class="fri-name">${esc(f.name)}</div>
        <div style="font-size:0.68rem;color:var(--muted2);font-family:'DM Mono',monospace;">P:${esc(f.protein)}g C:${esc(f.carbs)}g F:${esc(f.fat)}g · ${esc(f.serving)}</div>
      </div>
      <div class="fri-cal">${esc(f.cal)} kcal</div>
    </div>`).join('');
}

function openNutGoalsSheet(){
  const sh=document.getElementById('sheet');
  document.getElementById('sheet-content').innerHTML=`
    <div class="sheet-handle"></div>
    <div class="sheet-title">⚙️ Nutrition Goals</div>
    <label class="blabel">Daily Calories</label>
    <input class="binput" id="ng-cal" type="number" value="${nutGoals.calories}" placeholder="2000">
    <label class="blabel">Protein (g)</label>
    <input class="binput" id="ng-p" type="number" value="${nutGoals.protein}" placeholder="150">
    <label class="blabel">Carbs (g)</label>
    <input class="binput" id="ng-c" type="number" value="${nutGoals.carbs}" placeholder="250">
    <label class="blabel">Fat (g)</label>
    <input class="binput" id="ng-f" type="number" value="${nutGoals.fat}" placeholder="65">
    <button class="sheet-btn primary" onclick="saveNutGoals()" style="margin-top:8px;">Save Goals</button>
    <button class="sheet-btn ghost" onclick="closeSheet()">Cancel</button>`;
  sh.classList.add('open');
}

async function saveNutGoals(){
  nutGoals={ calories:parseInt(document.getElementById('ng-cal').value)||2000, protein:parseInt(document.getElementById('ng-p').value)||150, carbs:parseInt(document.getElementById('ng-c').value)||250, fat:parseInt(document.getElementById('ng-f').value)||65 };
  try { await API.putNutGoals(nutGoals); } catch {}
  closeSheet(); renderNutrition(); toast('Nutrition goals updated ✅');
}

// ═══════════════════════════════════════════════════════════
// CUSTOM WORKOUT BUILDER
// ═══════════════════════════════════════════════════════════
const BUILDER_EMOJIS=['💪','🔥','⚡','🏋️','🦵','🎯','🏃','🧘','🤸','🥊','🏊','🚴'];
const BUILDER_COLORS=['#ff6b2b','#00d4ff','#39d353','#ff4757','#c44dff','#ffd32a','#ff6eb4','#74b9ff'];
let bStep=1, bExercises=[], bSelectedEmoji='💪', bSelectedColor='#ff6b2b', bEditId=null;

function openBuilder(prefill=null){
  bStep=1; bExercises=[]; bSelectedEmoji='💪'; bSelectedColor='#ff6b2b'; bEditId=null;
  document.getElementById('b-name').value=prefill?.name||'';
  document.getElementById('b-category').value=prefill?.category||'Strength';
  document.getElementById('b-difficulty').value=prefill?.difficulty||'Beginner';
  document.getElementById('b-duration').value=prefill?.duration||'';
  document.getElementById('b-calories').value=prefill?.calories||'';
  if (prefill){ bExercises=[...prefill.exercises]; bSelectedEmoji=prefill.emoji; bSelectedColor=prefill.color; bEditId=prefill.id; }
  if (selectedExercise) { bExercises=[{ id:'bx-'+Date.now(), name:selectedExercise.name, icon:selectedExercise.icon, image:selectedExercise.image||null, muscle:selectedExercise.muscle, type:'reps', sets:3, reps:10, weight:0 }]; selectedExercise=null; bStep=2; }
  document.getElementById('emoji-picker').innerHTML=BUILDER_EMOJIS.map(e=>`<div class="emoji-opt ${e===bSelectedEmoji?'selected':''}" onclick="selectEmoji('${e}')">${e}</div>`).join('');
  document.getElementById('color-picker').innerHTML=BUILDER_COLORS.map(c=>`<div class="color-opt ${c===bSelectedColor?'selected':''}" style="background:${c}" onclick="selectColor('${c}')"></div>`).join('');
  if (bStep===1){ document.getElementById('builder-step1').style.display='block'; document.getElementById('builder-step2').style.display='none'; document.getElementById('builder-next-btn').textContent='Next: Add Exercises →'; document.getElementById('builder-back-btn').textContent='Cancel'; }
  else { document.getElementById('builder-step1').style.display='none'; document.getElementById('builder-step2').style.display='block'; document.getElementById('builder-next-btn').textContent='Save Workout ✓'; document.getElementById('builder-back-btn').textContent='← Back'; renderBuilderExList(); }
  document.getElementById('builder-screen').classList.add('open');
}
function closeBuilder(){ document.getElementById('builder-screen').classList.remove('open'); }
function selectEmoji(e){ bSelectedEmoji=e; document.querySelectorAll('.emoji-opt').forEach(el=>el.classList.toggle('selected',el.textContent===e)); }
function selectColor(c){ bSelectedColor=c; document.querySelectorAll('.color-opt').forEach(el=>el.classList.toggle('selected',el.style.background===c||el.style.background===`rgb(${hexToRgb(c)})`)); }
function hexToRgb(hex){ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `${r}, ${g}, ${b}`; }

function builderNext(){
  if (bStep===1){
    if (!document.getElementById('b-name').value.trim()){ toast('Please enter a workout name','orange'); return; }
    bStep=2;
    document.getElementById('builder-step1').style.display='none';
    document.getElementById('builder-step2').style.display='block';
    document.getElementById('builder-next-btn').textContent='Save Workout ✓';
    document.getElementById('builder-back-btn').textContent='← Back';
    renderBuilderExList();
  } else { saveBuilder(); }
}
function builderBack(){
  if (bStep===1){ closeBuilder(); return; }
  bStep=1;
  document.getElementById('builder-step1').style.display='block';
  document.getElementById('builder-step2').style.display='none';
  document.getElementById('builder-next-btn').textContent='Next: Add Exercises →';
  document.getElementById('builder-back-btn').textContent='Cancel';
}

function renderBuilderExList(){
  const el=document.getElementById('builder-ex-list');
  document.getElementById('builder-ex-empty').style.display=bExercises.length?'none':'block';
  const items=bExercises.map((e,i)=>`
    <div class="builder-ex-item">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="font-size:1.3rem;">${e.icon}</div>
        <div>
          <div style="font-weight:700;font-size:0.85rem;">${esc(e.name)}</div>
          <div style="font-size:0.7rem;color:var(--muted2);">${e.type==='timed'?e.duration+'s':e.sets+'×'+e.reps} · ${esc(e.muscle)}</div>
        </div>
      </div>
      <button onclick="removeBuilderEx(${i})" style="background:var(--red-dim);border:none;color:var(--red);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:0.75rem;">✕</button>
    </div>`).join('');
  el.innerHTML='<div id="builder-ex-empty" style="text-align:center;padding:24px;color:var(--muted);font-size:0.82rem;'+(bExercises.length?'display:none':'')+'">No exercises yet. Tap + to add.</div>'+items;
}
function removeBuilderEx(i){ bExercises.splice(i,1); renderBuilderExList(); }

function openExPickerSheet(){
  const sh=document.getElementById('sheet');
  document.getElementById('sheet-content').innerHTML=`
    <div class="sheet-handle"></div>
    <div class="sheet-title">Select Exercise</div>
    <div class="food-search-wrap"><input class="food-search" id="ex-pick-search" type="text" placeholder="Search…" oninput="filterExPicker()"></div>
    <div class="food-results" id="ex-pick-list"></div>`;
  sh.classList.add('open');
  filterExPicker();
}
function filterExPicker(){
  const q=(document.getElementById('ex-pick-search')?.value||'').toLowerCase();
  const list=q?ALL_EXERCISES.filter(e=>e.name.toLowerCase().includes(q)):ALL_EXERCISES;
  document.getElementById('ex-pick-list').innerHTML=list.slice(0,20).map(e=>`
    <div class="food-result-item" onclick="addBuilderExercise('${esc(e.name)}')">
      <div class="fri-icon">${e.icon}</div>
      <div><div class="fri-name">${e.name}</div><div style="font-size:0.68rem;color:var(--muted2);">🎯 ${e.muscle} · ${e.difficulty}</div></div>
    </div>`).join('');
}
function addBuilderExercise(name){
  const e=ALL_EXERCISES.find(x=>x.name===name); if(!e) return;
  bExercises.push({ id:'bx-'+Date.now(), name:e.name, icon:e.icon, image:e.image||null, muscle:e.muscle, type:'reps', sets:3, reps:10, weight:0 });
  closeSheet(); renderBuilderExList(); toast(e.name+' added','success');
}

async function saveBuilder(){
  const name=document.getElementById('b-name').value.trim();
  if (!name){ toast('Workout needs a name','orange'); return; }
  if (!bExercises.length){ toast('Add at least one exercise','orange'); return; }
  const workout={
    name, emoji:bSelectedEmoji, color:bSelectedColor,
    category:document.getElementById('b-category').value,
    difficulty:document.getElementById('b-difficulty').value,
    duration:parseInt(document.getElementById('b-duration').value)||30,
    calories:parseInt(document.getElementById('b-calories').value)||250,
    exercises:bExercises, custom:true,
  };
  try {
    if (bEditId) {
      await API.updateCustomWorkout(bEditId, workout);
      const idx=customWorkouts.findIndex(w=>w.id===bEditId);
      if (idx>=0) customWorkouts[idx]={...customWorkouts[idx],...workout};
      toast('Workout updated ✓','success');
    } else {
      const saved=await API.addCustomWorkout(workout);
      customWorkouts.push(saved);
      toast('Custom workout saved 🎉','success');
    }
  } catch {
    customWorkouts.push({ id:'local-'+Date.now(), ...workout });
    toast('Saved locally','success');
  }
  closeBuilder();
  goTo('workouts');
}

async function deleteCustomWorkout(id){
  try { await API.deleteCustomWorkout_(id); } catch {}
  customWorkouts=customWorkouts.filter(w=>w.id!==id);
  closeSheet(); renderWorkouts();
  toast('Workout deleted','orange');
}

// ═══════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════
const CAL_PLAN = {
  0:{label:'Rest Day',            color:'rgba(255,255,255,0.15)',emoji:'😴',workout:null},
  1:{label:'Shoulders + Back',   color:'#ff6b2b',emoji:'🔺',workout:'w1'},
  2:{label:'Chest + Core',       color:'#4f9eff',emoji:'🔱',workout:'w5'},
  3:{label:'V-Shape Grind',      color:'#2ee8c4',emoji:'⚡',workout:'w5'},
  4:{label:'Shoulders + Back',   color:'#ff6b2b',emoji:'🔺',workout:'w1'},
  5:{label:'Chest + Core',       color:'#4f9eff',emoji:'💪',workout:'w4'},
  6:{label:'Cardio / Active Rest',color:'#a78bfa',emoji:'🏃',workout:'w6'},
};
const REST_TIPS=[
  'Prioritize 7–9 hrs of sleep tonight — muscles rebuild during deep sleep.',
  'Do 10 min of light stretching to flush out lactic acid from yesterday.',
  'Eat your protein even on rest days — muscles repair on days OFF.',
  'Foam roll your lats and shoulders for 5 min to reduce next-day soreness.',
  'Hydrate extra today — rest days are great for flushing out toxins.',
  'Active recovery: a 20-min walk boosts circulation without taxing muscles.',
];
const CHAMP_TIPS=[
  {name:'Jeff Seid',icon:'🏆',trait:'Y-Frame King',tip:'Train rear delts and upper back 2× more than chest. Wide lats + capped shoulders = the ultimate Y-frame illusion.'},
  {name:'Frank Zane',icon:'⚡',trait:'Aesthetic Legend',tip:'Vacuum pose daily. Sucking in the stomach and holding for 60s shrinks the waist over months, amplifying the V-taper dramatically.'},
  {name:'Steve Cook',icon:'🔥',trait:'Modern Classic',tip:'Never skip shoulder warm-up. Rotator cuff work for 10 min before pressing prevents injury and improves shoulder roundness.'},
  {name:'Arnold S.',icon:'💎',trait:'Mass + Shape',tip:'Train with full range of motion. Partial reps build bulk; full ROM sculpts the caps and striations that define elite physiques.'},
  {name:'Ryan Terry',icon:'🌟',trait:'Men\'s Physique Pro',tip:'Oblique training is just as important as ab training. A tapered waist from the side is built by side planks and wood chops — not crunches.'},
  {name:'Chloe Ting',icon:'👑',trait:'Core & Cardio Queen',tip:'Consistency over intensity. 30-min daily movement beats 2-hour gym sessions 3× a week for body recomposition and sustainable fat loss.'},
];

let calViewDate=new Date(), calSelectedDate=localDateStr(new Date());
function calPrevMonth(){calViewDate.setMonth(calViewDate.getMonth()-1);renderCalendar();}
function calNextMonth(){calViewDate.setMonth(calViewDate.getMonth()+1);renderCalendar();}
function calToday(){calViewDate=new Date();calSelectedDate=localDateStr(new Date());renderCalendar();}

function renderCalendar(){
  const today=new Date(), todayStr=localDateStr(today);
  const y=calViewDate.getFullYear(), m=calViewDate.getMonth();
  document.getElementById('cal-month-label').textContent=calViewDate.toLocaleDateString([],{month:'long',year:'numeric'}).toUpperCase();
  const firstDay=new Date(y,m,1).getDay(), daysInMonth=new Date(y,m+1,0).getDate();
  const histMap={};
  history.forEach(h=>{ if(!histMap[h.date]) histMap[h.date]=[]; histMap[h.date].push(h); });
  const monthEntries=history.filter(h=>{ const [hy,hm]=h.date.split('-').map(Number); return hy===y && hm===(m+1); });
  const monthDone=new Set(monthEntries.map(h=>h.date)).size;
  const monthCal=monthEntries.reduce((s,h)=>s+h.calories,0);
  const monthMins=monthEntries.reduce((s,h)=>s+h.duration,0);
  let scheduledCount=0;
  for(let d=1;d<=daysInMonth;d++){const dow=new Date(y,m,d).getDay();if([1,2,3,4,5,6].includes(dow))scheduledCount++;}
  document.getElementById('cal-month-stats').innerHTML=`
    <div class="cal-mstat"><div class="cal-mstat-val" style="color:var(--neon)">${monthDone}</div><div class="cal-mstat-lbl">Done</div></div>
    <div class="cal-mstat-div"></div>
    <div class="cal-mstat"><div class="cal-mstat-val" style="color:var(--orange)">${scheduledCount}</div><div class="cal-mstat-lbl">Scheduled</div></div>
    <div class="cal-mstat-div"></div>
    <div class="cal-mstat"><div class="cal-mstat-val" style="color:var(--cyan)">${monthMins}</div><div class="cal-mstat-lbl">Mins</div></div>
    <div class="cal-mstat-div"></div>
    <div class="cal-mstat"><div class="cal-mstat-val" style="color:var(--yellow)">${monthCal}</div><div class="cal-mstat-lbl">Kcal</div></div>`;
  let html='';
  for(let i=0;i<firstDay;i++) html+='<div class="cal-cell empty"></div>';
  for(let d=1;d<=daysInMonth;d++){
    const dateObj=new Date(y,m,d), dow=dateObj.getDay(), plan=CAL_PLAN[dow], ds=localDateStr(dateObj);
    const isToday=ds===todayStr, isSelected=ds===calSelectedDate;
    const entries=histMap[ds]||[], isDone=entries.length>0;
    const todayMidnight=new Date(today.getFullYear(),today.getMonth(),today.getDate());
    const isPast=dateObj<todayMidnight;
    const countBadge=isDone&&entries.length>1?`<div class="cal-count-badge">×${entries.length}</div>`:'';
    html+=`<div class="cal-cell ${isToday?'today':''} ${isDone?'done':''} ${isSelected?'selected':''} ${isPast&&!isDone?'past':''}" data-date="${ds}" onclick="calCellClick('${ds}',${dow})">
      <div class="cal-day-num">${d}</div>
      <div class="cal-day-dot" style="background:${plan.color};"></div>
      <div class="cal-day-emoji">${isDone?'✅':plan.emoji}</div>
      ${countBadge}
    </div>`;
  }
  document.getElementById('cal-grid').innerHTML=html;
  document.getElementById('champ-cards').innerHTML=CHAMP_TIPS.map(c=>`
    <div class="champ-card">
      <div class="champ-card-top">
        <div class="champ-icon">${c.icon}</div>
        <div><div class="champ-name">${c.name}</div><div class="champ-trait">${c.trait}</div></div>
      </div>
      <div class="champ-tip-text">"${c.tip}"</div>
    </div>`).join('');
  if (calSelectedDate) renderCalDayDetail(calSelectedDate);
}

function renderCalDayDetail(ds){
  const el=document.getElementById('cal-day-detail'); if(!el) return;
  const dateObj=new Date(ds+'T12:00:00'), dow=dateObj.getDay(), plan=CAL_PLAN[dow];
  const entries=history.filter(h=>h.date===ds), isDone=entries.length>0;
  const todayStr=localDateStr(new Date()), isFuture=ds>todayStr, isToday=ds===todayStr;
  const dateLabel=dateObj.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const workout=plan.workout?[...WORKOUTS,...customWorkouts].find(x=>x.id===plan.workout):null;
  let html=`<div class="cal-detail-header"><div><div class="cal-detail-date">${dateLabel}</div><div class="cal-detail-plan" style="color:${plan.color}">${plan.emoji} ${plan.label}</div></div><div class="cal-detail-close" onclick="closeCalDetail()">✕</div></div>`;
  if(isDone){
    html+=`<div class="cal-detail-badge done-badge">✅ ${entries.length} Workout${entries.length>1?'s':''} Logged</div>`;
    entries.forEach(e=>{html+=`<div class="cal-detail-session"><span class="cal-detail-emoji">${e.emoji||'💪'}</span><div class="cal-detail-session-info"><div class="cal-detail-session-name">${esc(e.workoutName)}</div><div class="cal-detail-session-meta">⏱ ${e.duration} min · 🔥 ${e.calories} kcal · 💪 ${e.exercises} exercises</div></div></div>`;});
    if(!isFuture&&workout) html+=`<button class="cal-detail-btn secondary" onclick="closeCalDetail();showWorkoutSheet('${esc(plan.workout)}')">➕ Log Another</button>`;
  } else if(plan.workout===null){
    const tip=REST_TIPS[dateObj.getDate()%REST_TIPS.length];
    html+=`<div class="cal-detail-badge rest-badge">😴 Rest & Recovery</div><div class="cal-rest-tip"><div class="cal-rest-tip-icon">💡</div><div class="cal-rest-tip-text">${tip}</div></div>`;
  } else if(workout){
    html+=`<div class="cal-detail-badge ${isFuture?'future-badge':'missed-badge'}">${isFuture?'📅 Scheduled':'⚠️ Missed'}</div>
      <div class="cal-detail-workout-preview">
        <div class="cal-detail-wname">${esc(workout.emoji)} ${esc(workout.name)}</div>
        <div class="cal-detail-wmeta">${workout.exercises.length} exercises · ${workout.duration} min · ~${workout.calories} kcal</div>
        <div class="cal-detail-tags">
          <span class="tag" style="background:${esc(workout.color)}20;color:${esc(workout.color)}">${esc(workout.category)}</span>
          <span class="tag" style="background:rgba(255,255,255,0.06);color:var(--muted2)">${esc(workout.difficulty)}</span>
        </div>
        <div class="cal-detail-exercises">
          ${workout.exercises.slice(0,4).map(e=>`<div class="cal-detail-ex-row"><span>${e.icon}</span><span>${esc(e.name)}</span><span style="margin-left:auto;font-size:0.65rem;font-family:'DM Mono',monospace;color:var(--muted2)">${e.type==='timed'?e.duration+'s':e.sets+'×'+e.reps}</span></div>`).join('')}
          ${workout.exercises.length>4?`<div style="font-size:0.7rem;color:var(--muted);padding:6px 0;">+${workout.exercises.length-4} more exercises</div>`:''}
        </div>
      </div>
      ${!isFuture||isToday?`<button class="cal-detail-btn primary" onclick="closeCalDetail();showWorkoutSheet('${esc(plan.workout)}')">▶ Start Workout</button>`:''}`;
  }
  el.innerHTML=html; el.classList.add('open');
}

function closeCalDetail(){
  const el=document.getElementById('cal-day-detail'); if(el) el.classList.remove('open');
  calSelectedDate=null;
  document.querySelectorAll('.cal-cell.selected').forEach(c=>c.classList.remove('selected'));
}
function calCellClick(ds,dow){
  if(calSelectedDate===ds){closeCalDetail();return;}
  calSelectedDate=ds;
  document.querySelectorAll('.cal-cell.selected').forEach(c=>c.classList.remove('selected'));
  const cell=document.querySelector(`.cal-cell[data-date="${ds}"]`); if(cell) cell.classList.add('selected');
  renderCalDayDetail(ds);
}

// ═══════════════════════════════════════════════════════════
// DIET TIPS
// ═══════════════════════════════════════════════════════════
const DIET_TIPS={
  shoulder:{label:'🔺 Shoulder Day Fuel',color:'#ff6b2b',timing:'Pre: 1–2 hrs before · Post: within 45 min',tips:[
    {icon:'🍗',title:'High Protein Pre-Workout',body:'Eat 30–40g protein 1–2 hrs before: chicken, eggs, or a protein shake. Muscles need amino acids ready for shoulder pressing volume.'},
    {icon:'🍌',title:'Fast Carbs Post-Workout',body:'Within 30 min after, eat a banana + protein shake. Fast carbs spike insulin, driving nutrients into worked shoulder muscles for rapid repair.'},
    {icon:'🐟',title:'Omega-3 for Joint Health',body:'Shoulders are complex joints. Eat salmon, tuna or sardines 3×/week. Omega-3s reduce joint inflammation from heavy pressing movements.'},
    {icon:'💧',title:'Hydrate Heavily',body:'Drink 500ml water 1 hr before training. Shoulder pressing drops performance fast when dehydrated — even 2% fluid loss cuts strength.'},
    {icon:'🥚',title:'Leucine-Rich Foods',body:'Eggs and Greek yogurt are packed with leucine, the amino acid that directly triggers muscle protein synthesis in deltoid tissue.'},
  ]},
  back:{label:'🏹 Back Day Fuel',color:'#2ee8c4',timing:'Pre: 90 min before · Post: 30–60 min after',tips:[
    {icon:'🥩',title:'Creatine + Protein Combo',body:'Back pulls require maximal force output. Pair creatine (5g/day) with 35g protein pre-workout. Creatine boosts pulling strength by 10–20%.'},
    {icon:'🍠',title:'Complex Carbs for Endurance',body:'Back workouts are high-volume. Eat sweet potato or brown rice 90 min before — complex carbs sustain energy across all sets of pull-ups and rows.'},
    {icon:'🥬',title:'Magnesium-Rich Greens',body:'Spinach and broccoli are rich in magnesium, which prevents muscle cramps and improves recovery in the lats and rhomboids after pulling sessions.'},
    {icon:'🍌',title:'Potassium for Muscle Contractions',body:'Bananas pre-workout improve neuromuscular efficiency — better mind-muscle connection during pull-ups and rows means better lat activation.'},
    {icon:'💊',title:'Post-Workout Anti-Inflammatory',body:'Eat berries (blueberries, cherries) after back day. Their antioxidants combat the oxidative stress from high-rep pulling and speed up recovery.'},
  ]},
  core:{label:'🔥 Core Day Fuel',color:'#a78bfa',timing:'Pre: light meal · Post: protein-focused',tips:[
    {icon:'🥣',title:'Light Pre-Core Meal',body:'Core training on a full stomach is uncomfortable. Eat a small meal 2 hrs before: oatmeal + egg whites. Avoid heavy fats or fiber right before.'},
    {icon:'☕',title:'Caffeine Enhances Endurance',body:'A black coffee 30 min before core work increases endurance output during planks, mountain climbers, and hollow holds by up to 15%.'},
    {icon:'🫐',title:'Antioxidants for Ab Recovery',body:'Core muscles are trained frequently. Blueberries and spinach help reduce soreness so you can train abs consistently 4–5× per week.'},
    {icon:'🐟',title:'Protein for Visible Abs',body:'Visible abs require low body fat. Lean proteins (tuna, chicken, Greek yogurt) keep you full while maintaining a calorie deficit to reduce belly fat.'},
    {icon:'💧',title:'Cut Sodium Day Before',body:'Water retention hides core definition. The day before core training, reduce sodium intake and drink extra water to flush retained fluid from the midsection.'},
  ]},
  rest:{label:'😴 Rest Day Fuel',color:'#fbbf24',timing:'Focus: recovery nutrition all day',tips:[
    {icon:'🥩',title:'Keep Protein High',body:'Rest days still need 1.6–2g protein per kg of bodyweight. Muscles repair on rest days — protein is the raw material. Don\'t drop intake.'},
    {icon:'🥑',title:'Healthy Fats for Hormones',body:'Eat avocado, peanut butter, and eggs on rest days. Dietary fats support testosterone and growth hormone production, key for muscle repair.'},
    {icon:'🍇',title:'Lower Carbs on Rest Days',body:'Reduce carb intake by 20–30% on rest days since you\'re not burning glycogen. Focus on vegetables and fibrous carbs instead of rice or pasta.'},
    {icon:'🫖',title:'Anti-Inflammatory Foods',body:'Turmeric tea, ginger, and tart cherry juice on rest days significantly reduce delayed muscle soreness (DOMS) and improve next-day readiness.'},
    {icon:'🧀',title:'Slow-Release Protein Before Bed',body:'Cottage cheese or casein shake before sleep delivers amino acids overnight — the body\'s prime muscle-repair window is during deep sleep.'},
  ]},
};
let activeDietTab='shoulder';
function switchDietTab(tab,evt){ activeDietTab=tab; document.querySelectorAll('.diet-tab').forEach(b=>b.classList.remove('active')); if(evt&&evt.target) evt.target.classList.add('active'); renderDietTips(); }
function renderDietTips(){
  const data=DIET_TIPS[activeDietTab], el=document.getElementById('diet-tip-content'); if(!el) return;
  el.innerHTML=`<div class="diet-timing" style="border-left:3px solid ${data.color};">⏱ ${data.timing}</div>${data.tips.map(t=>`<div class="diet-tip-card"><div class="diet-tip-icon">${t.icon}</div><div class="diet-tip-text"><div class="diet-tip-title">${t.title}</div><div class="diet-tip-body">${t.body}</div></div></div>`).join('')}`;
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
let notifications=[], notifIdCounter=0;
function pushNotif(icon,title,body,action=null){
  const id=++notifIdCounter;
  notifications.unshift({id,icon,title,body,action,time:new Date(),read:false});
  const badge=document.getElementById('bell-badge');
  const unread=notifications.filter(n=>!n.read).length;
  badge.style.display=unread?'flex':'none';
  badge.textContent=unread;
  showNotifBanner(icon,title,body,action);
}
function showNotifBanner(icon,title,body,action){
  document.getElementById('notif-icon').textContent=icon;
  document.getElementById('notif-title').textContent=title;
  document.getElementById('notif-body').textContent=body;
  document.getElementById('notif-time').textContent='now';
  const banner=document.getElementById('notif-banner');
  const sweep=document.getElementById('notif-sweep-fill');
  banner.classList.add('show');
  sweep.style.transition='none'; sweep.style.width='100%';
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ sweep.style.transition='width 4s linear'; sweep.style.width='0%'; }); });
  const btn=document.getElementById('notif-action-btn');
  btn.style.display=action?'block':'none';
  setTimeout(()=>banner.classList.remove('show'),4000);
}
function dismissNotif(){document.getElementById('notif-banner').classList.remove('show');}
function notifAction(){document.getElementById('notif-banner').classList.remove('show');}
function openNotifCenter(){
  const el=document.getElementById('notif-center-body');
  notifications.forEach(n=>n.read=true);
  document.getElementById('bell-badge').style.display='none';
  el.innerHTML=notifications.length?notifications.map(n=>`
    <div class="notif-center-item">
      <div class="notif-center-icon">${n.icon}</div>
      <div class="notif-center-content">
        <div class="notif-center-title">${esc(n.title)}</div>
        <div class="notif-center-body">${esc(n.body)}</div>
        <div class="notif-center-time">${n.time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    </div>`).join(''):'<div style="text-align:center;padding:40px;color:var(--muted);">No notifications yet</div>';
  document.getElementById('notif-center').classList.add('open');
}
function closeNotifCenter(){document.getElementById('notif-center').classList.remove('open');}
function clearAllNotifs(){notifications=[];document.getElementById('bell-badge').style.display='none';closeNotifCenter();}
function notifExerciseStart(name,muscle,type,info){pushNotif('💪',`Now: ${name}`,`${muscle} · ${type==='timed'?info+'s':info}`);}
function notifExerciseDone(name){pushNotif('✅',`${name} done!`,'Great set! Rest up.');}
function notifRestStart(secs,nextName){pushNotif('⏱','Rest Time',`${secs}s · Up next: ${nextName||'last exercise'}`);}
function notifRestDone(){pushNotif('🔥','Rest over!','Time for the next set!');}

function scheduleWorkoutReminder(){
  const now=new Date(),h=now.getHours();
  const todayDone=history.filter(x=>x.date===todayKey()).length;
  if(!todayDone && h>=6 && h<22){
    setTimeout(()=>pushNotif('🏋️','Workout Reminder','You haven\'t trained yet today. Let\'s get after it!'),3000);
  }
}
function scheduleMotivation(){
  const msgs=['You\'re one workout away from a better mood. Let\'s go! 💪','Consistency beats perfection. Show up today.','Your only competition is yesterday\'s self.','Rest days rebuild. Workout days define. Today is a workout day.'];
  const msg=msgs[Math.floor(Math.random()*msgs.length)];
  setTimeout(()=>pushNotif('🔥','Daily Motivation',msg),8000);
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
initAuth();
