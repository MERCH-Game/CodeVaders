import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import auth from './lib/auth.js';
import prisma from './lib/prisma.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Mount Better Auth handler before body parsers to avoid stream consumption issues
app.all('/api/auth', toNodeHandler(auth));
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());


app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CodeVaders API is running',
  });
});

app.get('/api/db-health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
    });
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable',
    });
  }
});

export default app;
