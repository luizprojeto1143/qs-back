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
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['https://qs-back.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];

    // Strict CORS: Only allow exact matches from allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date(), version: '10.15' });
});

app.get('/', (req, res) => {
  res.send('QS Inclusão API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (v10.15 - High Performance)`);
});
