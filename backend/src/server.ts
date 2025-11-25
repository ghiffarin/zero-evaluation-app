import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'PD-OS API',
    version: '1.0.0',
    description: 'Personal Development Operating System API',
    docs: '/api/health',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║         PD-OS Backend Server               ║
╠════════════════════════════════════════════╣
║  Status:  Running                          ║
║  Port:    ${PORT}                             ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                    ║
║  API:     http://localhost:${PORT}/api         ║
╚════════════════════════════════════════════╝
  `);
});

export default app;
