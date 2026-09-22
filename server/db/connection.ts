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
    `ALTER TABLE quotations ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(32) DEFAULT '';`,
    `ALTER TABLE quotations ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT '';`,
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(32) DEFAULT 'customer';`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_pieces INTEGER DEFAULT 0;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0.00;`,
    `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-gn-1';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-gn-2';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1599598425947-5202edd564c5?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-gn-3';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-gn-4';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-gn-5';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-gn-6';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-gn-7';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1596434300655-e48d3ff3dd5e?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-nn-1';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1546548970-71785318a17b?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-nn-2';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1536511135898-752b0d49281c?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-nn-3';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-nn-4';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-nn-5';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-nn-6';`,
    `UPDATE products SET image_url = 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?w=500&auto=format&fit=crop&q=80' WHERE id = 'prod-nn-7';`,
    `CREATE TABLE IF NOT EXISTS inventory_modules (
      id VARCHAR(64) PRIMARY KEY,
      business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
      name VARCHAR(128) NOT NULL,
      slug VARCHAR(64) NOT NULL,
      caption TEXT DEFAULT '',
      icon VARCHAR(64) DEFAULT '📦',
      image_url TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_inv_modules_biz ON inventory_modules(business_id);`,
    `CREATE INDEX IF NOT EXISTS idx_inv_modules_slug ON inventory_modules(slug);`
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
