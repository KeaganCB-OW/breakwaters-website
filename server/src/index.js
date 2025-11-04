import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import recruitmentOfficerRoutes from './routes/recruitmentOfficerRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';

dotenv.config();

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const MAX_BODY_SIZE = process.env.API_MAX_BODY_SIZE || '100kb';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX_REQUESTS || 500),
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 10),
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_BODY_SIZE }));
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/officers', recruitmentOfficerRoutes);
app.use('/api/assignments', assignmentRoutes);

app.get('/api/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to MySQL');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to MySQL', error);
    process.exit(1);
  }
};

startServer();
