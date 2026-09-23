import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './db/connection.js';
import { seedDatabase } from './db/seed.js';

import authRouter from './routes/auth.js';
import businessesRouter from './routes/businesses.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import posRouter from './routes/pos.js';
import invoicesRouter from './routes/invoices.js';
import quotationsRouter from './routes/quotations.js';
import deliveryChallansRouter from './routes/deliveryChallans.js';
import projectsRouter from './routes/projects.js';
import supervisorsRouter from './routes/supervisors.js';
import suppliersRouter from './routes/suppliers.js';
import purchasesRouter from './routes/purchases.js';
import expensesRouter from './routes/expenses.js';
import refundsRouter from './routes/refunds.js';
import customersRouter from './routes/customers.js';
import staffRouter from './routes/staff.js';
import reportsRouter from './routes/reports.js';
import printRouter from './routes/print.js';
import lossesRouter from './routes/losses.js';
import warehouseRouter from './routes/warehouse.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging in development
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[API] ${req.method} ${req.url} (Biz: ${req.headers['x-business-id'] || 'none'})`);
  }
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), server: 'GrowNaturals API' });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/businesses', businessesRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/pos', posRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/delivery-challans', deliveryChallansRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/supervisors', supervisorsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/refunds', refundsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/staff', staffRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/print', printRouter);
app.use('/api/inventory-losses', lossesRouter);
app.use('/api/warehouse', warehouseRouter);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

async function startServer() {
  try {
    console.log('[Server] Initializing PostgreSQL database...');
    await initDb();
    console.log('[Server] Seeding demo database records...');
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🌱 GrowNaturals Backend Server running on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();
