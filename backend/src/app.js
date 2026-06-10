import 'express-async-errors'; // Patches async route handlers to forward errors to the global handler
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import apiRoutes from './routes/index.js';
import { globalErrorHandler } from './middleware/error.middleware.js';

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────

/**
 * Helmet sets HTTP response headers to protect against well-known web vulnerabilities:
 * - Content-Security-Policy
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - Strict-Transport-Security (in production)
 */
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────

/**
 * Allows the Next.js frontend (and Postman in dev) to reach the API.
 * credentials: true is required so the browser sends the httpOnly cookie
 * on /api/auth/refresh requests.
 */
const allowedOrigins = [
  process.env.CLIENT_URL,                               // configurable via env var
  'http://localhost:3000',                              // local Next.js dev
  'http://localhost:5001',                              // local backend self-calls
  'https://blog-application-one-tan.vercel.app',        // production Vercel frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
      }
    },
    credentials: true, // Allow cookies (refresh token)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-delete-code', 'X-Delete-Code'],
  })
);

// ─── Request Parsing ──────────────────────────────────────────────────────────

app.use(express.json({ limit: '5mb' }));         // Parse JSON bodies (5mb limit for htmlContent)
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded form bodies
app.use(cookieParser());                          // Parse cookies (needed for refresh token)

// ─── HTTP Request Logger ──────────────────────────────────────────────────────

/**
 * Morgan logs every incoming request.
 * 'dev' format: METHOD /path STATUS response-time ms
 * Skip in test environment to keep test output clean.
 */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Passport (OAuth) ─────────────────────────────────────────────────────────

/**
 * Initialize Passport middleware.
 * We do NOT use passport.session() because auth is stateless JWT.
 */
app.use(passport.initialize());

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api', apiRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

/**
 * Catch-all for any route that wasn't matched above.
 * Must come AFTER all route registrations.
 */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found. Check the API documentation.',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

/**
 * Must be the LAST middleware registered.
 * express-async-errors ensures async controller errors reach here automatically.
 */
app.use(globalErrorHandler);

export default app;
