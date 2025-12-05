import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

import routes from './routes';

app.use(cors({
  origin: ['https://qs-back.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id']
}));
app.use(express.json());

app.use('/api', routes);
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('QS Inclusão API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
