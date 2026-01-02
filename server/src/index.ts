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

// Security Middleware
app.use(helmet());

app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id']
}));
app.use(express.json());

app.use('/api', routes);
app.use('/uploads', express.static('uploads'));

// Centralized Error Handler
app.use(errorHandler);

import compression from 'compression';

// ...

// Security Middleware
app.use(helmet());
app.use(compression()); // Gzip Compression

// ...

app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const prisma = (await import('./prisma')).default;
    const userCount = await prisma.user.count();
    res.status(200).json({
      status: 'UP',
      timestamp: new Date(),
      version: '10.16',
      database: 'CONNECTED',
      userCount: userCount,
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date(),
      version: '10.16',
      database: 'DISCONNECTED',
      error: error?.message,
      env: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
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
    origin: true,
    credentials: true
  }
});

// Tornar o io acessível globalmente (opcional, ou exportar)
(global as any).io = io;

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_company', (companyId) => {
    socket.join(`company:${companyId}`);
    console.log(`Socket ${socket.id} joined company:${companyId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (v10.17 - WebSocket Enabled)`);
});

export { io };
