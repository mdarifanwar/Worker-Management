const path = require('path');
const express = require('express');

const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');

let cookieParser;
try {
  cookieParser = require('cookie-parser');
} catch (err) {
  console.warn('cookie-parser not installed. Install cookie-parser for cookie-based auth to work in some routes.');
}
require('dotenv').config();
require('./config/passport');

const app = express();


if (process.env.TRUST_PROXY) {
  // Allow explicit override (useful for production when you control the proxy)
  app.set('trust proxy', process.env.TRUST_PROXY);
} else if (process.env.NODE_ENV !== 'production') {
  // Default to trusting the first proxy in non-production environments
  app.set('trust proxy', 1);
}

console.log('Express trust proxy value:', app.get('trust proxy'));

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-service-name.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session store: prefer a Mongo-backed store in production
// If `connect-mongo` is installed and MONGODB_URI is available, use it.
// Otherwise fall back to the default MemoryStore (NOT for production).
let sessionOptions = {
  secret: process.env.SESSION_SECRET || 'session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

try {
  const MongoStore = require('connect-mongo');
  const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/worker-management';
  // Create a MongoStore if running in an environment with a Mongo DB
  if (mongoUrl) {
    sessionOptions.store = MongoStore.create({ mongoUrl, collectionName: 'sessions' });
    console.log('Using MongoDB-backed session store.');
  }
} catch (err) {
  console.warn('connect-mongo not installed or failed to load. Using default session store. Install connect-mongo for production sessions.');
}

app.use(session(sessionOptions));
// Use cookie parser if available so we can read HttpOnly cookies in middleware
if (cookieParser) {
  app.use(cookieParser());
} else {
  // Lightweight cookie parser fallback so req.cookies is available
  app.use((req, res, next) => {
    req.cookies = req.cookies || {};
    const cookieHeader = req.headers && req.headers.cookie;
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        const key = parts.shift().trim();
        const value = parts.join('=').trim();
        try {
          req.cookies[key] = decodeURIComponent(value);
        } catch (e) {
          req.cookies[key] = value;
        }
      });
    }
    next();
  });
}
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files (company logos) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.removeHeader && res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader && res.removeHeader('Content-Security-Policy');
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static('uploads'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/worker-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/google'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/reset', require('./routes/reset'));
// Temporary debug routes (remove in production)
app.use('/api/debug', require('./routes/debug'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5002;

// Helpful startup diagnostics for OAuth debugging
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:3000';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`;

console.log(`Configured FRONTEND_ORIGIN: ${FRONTEND_ORIGIN}`);
console.log(`Configured GOOGLE_CALLBACK_URL: ${GOOGLE_CALLBACK_URL}`);

// For local development prefer binding to IPv4 loopback so frontend proxy can connect.
// Allow override via HOST env var (set to 0.0.0.0 for containerized / remote runs).
const HOST = process.env.HOST || '0.0.0.0';
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});