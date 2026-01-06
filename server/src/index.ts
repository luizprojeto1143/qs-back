// Deploy trigger: 2025-12-11 22:56
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust as needed
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || "*"]
    }
  }
}));

// CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173,https://qs-back.vercel.app').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id']
}));

// Basic Rate Limiting (In-memory)
const rateLimit = new Map();
app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxReq = 2000; // Allow more requests for polling

  const record = rateLimit.get(ip) || { count: 0, startTime: now };

  if (now - record.startTime > windowMs) {
    record.count = 1;
    record.startTime = now;
  } else {
    record.count++;
  }

  rateLimit.set(ip, record);

  if (record.count > maxReq) {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
    return;
  }
  next();
});

app.use(express.json());

app.use('/api', routes);
app.use('/uploads', express.static('uploads'));

// Centralized Error Handler
app.use(errorHandler);

import compression from 'compression';

// Compression Middleware
app.use(compression());

// Health Check Endpoint (Sanitized)
app.get('/health', async (req, res) => {
  try {
    // Check DB connection only, do not expose counts
    const prisma = (await import('./prisma')).default;
    await prisma.$queryRaw`SELECT 1`; // Lightweight check

    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'QS Inclusão API'
    });
  } catch (error) {
    // Do not log full error details to client
    console.error('Health check failed');
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/', (req, res) => {
  res.send('QS Inclusão API is running');
});

import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Securely share IO instance via app locals
app.set('io', io);

io.on('connection', (socket) => {
  // console.log(`Socket connected: ${socket.id}`); // Remove logspam

  socket.on('join_company', (companyId) => {
    socket.join(`company:${companyId}`);
    // console.log(`Socket ${socket.id} joined company:${companyId}`);
  });

  socket.on('disconnect', () => {
    // console.log(`Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (v10.17 - WebSocket Enabled)`);
});

export { io };
