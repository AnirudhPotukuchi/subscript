import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { HTTP_STATUS } from './constants';

dotenv.config();

const app = express();

// Standard Middlewares
app.use(cors({
  origin: true, // Allow client connection dynamically
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({ status: 'UP', message: 'College Network API is operational.' });
});

// Load Router
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
});

export default app;
