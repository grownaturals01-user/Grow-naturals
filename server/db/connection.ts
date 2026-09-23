import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

export interface DbClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  exec(text: string): Promise<void>;
  close(): Promise<void>;
}

let dbInstance: DbClient | null = null;

export async function getDb(): Promise<DbClient> {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.startsWith('pglite:') && !databaseUrl.startsWith('file:')) {
    console.log('[DB] Connecting to external PostgreSQL database...');
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });

    dbInstance = {
      async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const res = await pool.query(text, params);
        return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
      },
      async exec(text: string): Promise<void> {
        await pool.query(text);
      },
      async close() {
        await pool.end();
      }
    };
  } else {
    const dataDir = path.resolve(__dirname, '../../data/postgres');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    } else {
      // Clean up stale lock files from previous unclean shutdowns
      const staleFiles = ['postmaster.pid', '.s.PGSQL.5432.lock.out', '.s.PGSQL.5432.lock'];
      for (const sf of staleFiles) {
        const fp = path.join(dataDir, sf);
        if (fs.existsSync(fp)) {
          try { fs.unlinkSync(fp); } catch (e) {}
        }
      }
    }
    console.log(`[DB] Starting embedded PostgreSQL (PGlite) at: ${dataDir}`);
    const { PGlite } = await import('@electric-sql/pglite');
    const pglite = new PGlite(dataDir);
    await pglite.waitReady;

    dbInstance = {
      async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const res = await pglite.query<T>(text, params);
        return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length };
      },
      async exec(text: string): Promise<void> {
        await pglite.exec(text);
      },
      async close() {
        await pglite.close();
      }
    };
  }

  return dbInstance;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
  const schemaPath = path.resolve(__dirname, './schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[DB] Ensuring database schema...');
  await db.exec(schemaSql);

  // Run dynamic migrations for delivery_challans and challan_items
  const migrations = [
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(32) DEFAULT '';`,
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0.00;`,
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0.00;`,
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS due_amount NUMERIC(12,2) DEFAULT 0.00;`,
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'unpaid';`,
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) DEFAULT '';`,
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;`,
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS payment_notes TEXT DEFAULT '';`,
    `ALTER TABLE delivery_challans ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(64) DEFAULT '';`,
    `ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0.00;`,
    `ALTER TABLE challan_items ADD COLUMN IF NOT EXISTS total NUMERIC(12,2) DEFAULT 0.00;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=500&auto=format&fit=crop&q=60' WHERE id = 'prod-gn-1' AND (image_url IS NULL OR image_url = '');`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&auto=format&fit=crop&q=60' WHERE id = 'prod-gn-2' AND (image_url IS NULL OR image_url = '');`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1599598425947-5202edd564c5?w=500&auto=format&fit=crop&q=60' WHERE id = 'prod-gn-3' AND (image_url IS NULL OR image_url = '');`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop&q=60' WHERE id = 'prod-gn-4' AND (image_url IS NULL OR image_url = '');`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500&auto=format&fit=crop&q=60' WHERE id = 'prod-gn-5' AND (image_url IS NULL OR image_url = '');`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1585336261026-7756f7ef506f?w=500&auto=format&fit=crop&q=60' WHERE id = 'prod-gn-6' AND (image_url IS NULL OR image_url = '');`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&auto=format&fit=crop&q=60' WHERE id = 'prod-gn-7' AND (image_url IS NULL OR image_url = '');`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT false;`,
    `UPDATE businesses SET is_taxable = true WHERE id = 'grow-naturals';`,
    `CREATE TABLE IF NOT EXISTS inventory_losses (
      id VARCHAR(64) PRIMARY KEY,
      business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      loss_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
      reason VARCHAR(64) NOT NULL,
      notes TEXT DEFAULT '',
      reported_by VARCHAR(64) DEFAULT '',
      damage_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS warehouse_stocks (
      id VARCHAR(64) PRIMARY KEY,
      business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      location_bin VARCHAR(64) DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_warehouse_stock UNIQUE (business_id, product_id)
    );`,
    `CREATE TABLE IF NOT EXISTS warehouse_transactions (
      id VARCHAR(64) PRIMARY KEY,
      business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
      product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      type VARCHAR(32) NOT NULL,
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      unit_price NUMERIC(12,2) DEFAULT 0.00,
      total_amount NUMERIC(12,2) DEFAULT 0.00,
      buyer_name VARCHAR(255) DEFAULT '',
      damage_reason VARCHAR(64) DEFAULT '',
      reference_no VARCHAR(64) DEFAULT '',
      notes TEXT DEFAULT '',
      performed_by VARCHAR(128) DEFAULT '',
      transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const m of migrations) {
    try {
      await db.exec(m);
    } catch (e: any) {
      // Ignore if column already exists
    }
  }

  console.log('[DB] Database schema initialized and verified.');
}
