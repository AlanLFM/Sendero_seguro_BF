import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import reportsRoutes from './routes/reports.js';
import alertsRoutes from './routes/alerts.js';
import contactsRoutes from './routes/contacts.js';
import routesRoutes from './routes/routes.js';
import zonesRoutes from './routes/zones.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://web.interactiveagents.lat',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('[CORS] Origen bloqueado:', origin);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/zones', zonesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`[SERVER] Backend corriendo en puerto ${PORT}`);
  console.log(`[SERVER] Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] CORS permitidos: ${allowedOrigins.join(', ')}`);
  console.log('========================================');
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Excepcion no capturada:');
  console.error('[FATAL] Mensaje:', err.message);
  console.error('[FATAL] Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Promesa rechazada no manejada:');
  console.error('[FATAL] Razon:', reason);
});
