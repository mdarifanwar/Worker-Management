const path = require('path');
const express = require('express');

const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

let cookieParser;
try {
  cookieParser = require('cookie-parser');
} catch (err) {
  console.warn('cookie-parser not installed. Install cookie-parser for cookie-based auth to work in some routes.');
}
require('dotenv').config();
require('./config/passport');

const app = express();


// Configure trust proxy for deployment platforms
if (process.env.TRUST_PROXY) {
  // Allow explicit override (useful for production when you control the proxy)
  app.set('trust proxy', process.env.TRUST_PROXY);
} else if (process.env.NODE_ENV === 'production') {
  // Trust first proxy in production (required for Render, Heroku, etc.)
  app.set('trust proxy', 1);
} else {
  // Default to trusting the first proxy in non-production environments
  app.set('trust proxy', 1);
}

console.log('Express trust proxy value:', app.get('trust proxy'));
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(helmet());
// Enable gzip compression for responses to reduce bandwidth and improve latency
app.use(compression());

// CORS configuration for cross-origin cookie support
const allowedOrigins = [
  'https://worker-management-peach.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://localhost:3000',
  'https://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
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

// Basic API rate limiter tuned for a modest 50-100 user app
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Serve uploaded files (company logos) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.removeHeader && res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader && res.removeHeader('Content-Security-Policy');
  // Reflect the request origin if allowed to avoid CORS mismatches (supports multiple frontend hosts)
  try {
    const origin = req.get('origin');
    if (origin && allowedOrigins.indexOf(origin) !== -1) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (process.env.CORS_ORIGIN) {
      res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
    }
  } catch (e) {
    // fallback to env or localhost
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:3000');
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  // Cache uploaded static assets for one day to reduce repeated transfers
  res.header('Cache-Control', 'public, max-age=86400');
  next();
}, express.static('uploads', { maxAge: '1d' }));

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
app.use('/api/workers', require('./routes/workers'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/reset', require('./routes/reset'));
// Provide asset helpers (logo base64 proxy)
app.use('/api/assets', require('./routes/assets'));
// Debug route removed for production/smaller footprint

// Serve frontend build assets when running in production from the project
// root `frontend/build` directory. Files are cached for 30 days.
try {
  const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
  const fs = require('fs');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendBuildPath)) {
    app.use(express.static(frontendBuildPath, { maxAge: '30d' }));
    // All other routes should serve index.html (SPA)
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
    console.log('Serving frontend from:', frontendBuildPath);
  }
} catch (e) {
  console.warn('Failed to enable frontend static serving:', e && e.message);
}

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
