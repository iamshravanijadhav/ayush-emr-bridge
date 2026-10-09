import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { patientsRouter } from './routes/patients.js';
import { mappingsRouter } from './routes/mappings.js';
import { dashboardRouter } from './routes/dashboard.js';
import { requireAuth } from './middleware/auth.js';
import { notFound, errorHandler } from './utils/errors.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.frontendOrigin.split(',').map(v => v.trim()), credentials: false }));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.use('/api', healthRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/patients', requireAuth, patientsRouter);
app.use('/api/mappings', requireAuth, mappingsRouter);
app.use(notFound);
app.use(errorHandler);
