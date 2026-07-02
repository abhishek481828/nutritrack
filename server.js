require('dotenv').config();
const { validateEnv } = require('./config/env');
validateEnv();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const fs      = require('fs');
const path    = require('path');
const connectDB = require('./config/db');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const logger = require('./utils/logger');
const { setupSwagger } = require('./config/swagger');

const authRoutes      = require('./routes/authRoutes');
const foodRoutes      = require('./routes/foodRoutes');
const foodLogsRoutes  = require('./routes/foodLogsRoutes');
const uploadRoutes    = require('./routes/uploadRoutes');
const dietRoutes      = require('./routes/dietRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const chatRoutes      = require('./routes/chatRoutes');
const reportRoutes    = require('./routes/reportRoutes');

// ── Connect to MongoDB ─────────────────────────────────────────────
connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';
const clientBuildPath = path.join(__dirname, 'client', 'dist');
const shouldServeClient = process.env.SERVE_CLIENT === 'true' || fs.existsSync(clientBuildPath);

// Disable ETag to avoid browser 304 cache responses for API calls.
app.set('etag', false);

// ── Trust reverse proxy (Render, Railway, Heroku) ──────────────────
app.set('trust proxy', 1);

// ── Security headers (helmet) ──────────────────────────────────────
app.use(helmet({
  // Allow inline scripts/styles needed by Vite's React build
  contentSecurityPolicy: isProd ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// ── Global rate limiter ────────────────────────────────────────────
app.use(globalLimiter);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── CORS ───────────────────────────────────────────────────────────
const allowedOrigins = new Set(
  [process.env.CLIENT_URL, process.env.CORS_ORIGIN]
    .filter(Boolean)
    .flatMap((value) => value.split(',').map((origin) => origin.trim()))
    .filter(Boolean)
);

allowedOrigins.add('http://localhost:5173');
allowedOrigins.add('http://localhost:5174');

const isLocalDevOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body parsing ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Always send fresh API responses so recommendation widgets stay in sync.
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// ── Swagger UI ──────────────────────────────────────────────────────
setupSwagger(app);

// ── Root route ─────────────────────────────────────────────────────
// In development, send users to the Vite frontend.
// In production, return API status unless the client build is present on this server.
app.get('/', (req, res) => {
  if (isProd && shouldServeClient) {
    return res.sendFile(path.join(clientBuildPath, 'index.html'));
  }

  if (isProd) {
    return res.json({ success: true, message: 'NutriTrack API is running.' });
  }

  return res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
});

// ── API routes ─────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/foods',     foodRoutes);
app.use('/api/food-logs', foodLogsRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/diet',      dietRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/report',    reportRoutes);

// ── Serve React build in production ───────────────────────────────
if (isProd && shouldServeClient) {
  const clientBuild = clientBuildPath;

  // Serve static assets (JS, CSS, images)
  app.use(express.static(clientBuild));

  // SPA fallback — all non-API routes return index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
} else {
  // Dev: unknown routes still use a clean JSON 404
  app.use(notFound);
}

app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
