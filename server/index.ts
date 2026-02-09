import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import shrinkRay from 'shrink-ray-current';
import path from 'path';
import { fileURLToPath } from 'url';

import { getDatabase } from './config/database';
import { createDatabaseService } from './services/database.service';
import { createDevRevService } from './services/devrev.service';
import syncRoutes from './routes/sync';
import ticketRoutes from './routes/tickets';
import automationPlansRoutes from './routes/automationPlans';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors());
app.use(shrinkRay());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize services
let db: any;
let dbService: any;
let devRevService: any;

try {
  db = getDatabase();
  dbService = createDatabaseService(db);
  devRevService = createDevRevService();
  console.log('✓ Services initialized');
} catch (error) {
  console.error('Failed to initialize services:', error);
  process.exit(1);
}

// Add services to app locals for route handlers
app.locals.db = db;
app.locals.dbService = dbService;
app.locals.devRevService = devRevService;

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const info = dbService.getDatabaseInfo();
  res.json({
    status: 'healthy',
    database: 'connected',
    tickets: info.ticketCount,
    syncRecords: info.syncCount,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/sync', syncRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/automation-plans', automationPlansRoutes);

// Serve static files from public (for favicon, etc)
app.use(express.static(path.join(__dirname, '../public')));

// Serve React build if it exists
const buildPath = path.join(__dirname, '../dist');
try {
  const fs = await import('fs').then(m => m.promises);
  await fs.access(buildPath);
  console.log(`✓ Serving React build from: ${buildPath}`);

  app.use(express.static(buildPath));

  // SPA fallback - serve index.html for unknown routes
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} catch (error) {
  console.warn(`⚠ Build directory not found at ${buildPath}. Running in API-only mode.`);
  console.warn('Make sure to run: npm run build');
}

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: true,
    message: 'Not Found',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (db) {
    db.close();
  }
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`
╔════════════════════════════════════╗
║   QA Dashboard Backend Server      ║
╠════════════════════════════════════╣
║ 🚀 Server running on port ${port}       ║
║ 📝 API: http://localhost:${port}/api   ║
║ ✓ Database connected               ║
╚════════════════════════════════════╝
  `);
});
