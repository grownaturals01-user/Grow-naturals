import { getDb } from './connection.js';

export async function seedDatabase(): Promise<void> {
  const db = await getDb();

  const existingBiz = await db.query(`SELECT COUNT(*) as count FROM businesses`);
  if (Number(existingBiz.rows[0]?.count) > 0) {
    console.log('[DB Seed] Database already has seeded data.');
    return;
  }

  console.log('[DB Seed] Seeding businesses, users, and base categories...');

  // 1. Businesses
  await db.query(`
    INSERT INTO businesses (id, name, legal_name, gstin, address, phone, email, invoice_prefix, invoice_footer, currency, default_low_stock, is_taxable)
    VALUES 
    ('grow-naturals', 'Grow Naturals', 'Grow Naturals Private Limited', '27AABCG1234F1Z5', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '+91 98220 12345', 'billing@grownaturals.in', 'GN-', 'Thank you for choosing Grow Naturals! Handcrafted botanical elegance for your space.', 'INR', 5, true),
    ('nikhlesh-nursery', 'Nikhlesh Nursery', 'Nikhlesh Nursery & Farm', '', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '+91 98220 67890', 'sales@nikhleshnursery.in', 'NN-', 'Thank you for choosing Nikhlesh Nursery. Live green, grow happy! Farm fresh plants & saplings.', 'INR', 8, false)
    ON CONFLICT (id) DO NOTHING
  `);

  // 2. Users (Staff login credentials)
  const fullPermissions = JSON.stringify({
    dashboard: true,
    pos: true,
    quotations: true,
    delivery_challans: true,
    inventory: true,
    projects: true,
    purchases: true,
    expenses: true,
    refunds: true,
    invoices: true,
    staff: true,
    settings: true
  });

  const managerPermissions = JSON.stringify({
    dashboard: true,
    pos: true,
    quotations: true,
    delivery_challans: true,
    inventory: true,
    projects: true,
    purchases: true,
    expenses: true,
    refunds: true,
    invoices: true,
    staff: false,
    settings: false
  });

  const cashierPermissions = JSON.stringify({
    dashboard: true,
    pos: true,
    quotations: false,
    delivery_challans: false,
    inventory: true,
    projects: false,
    purchases: false,
    expenses: false,
    refunds: true,
    invoices: true,
    staff: false,
    settings: false
  });

  const supervisorPermissions = JSON.stringify({
    dashboard: false,
    pos: false,
    quotations: false,
    delivery_challans: true,
    inventory: false,
    projects: true,
    purchases: false,
    expenses: true,
    refunds: false,
    invoices: false,
    staff: false,
    settings: false
  });

  await db.query(`
    INSERT INTO users (id, name, username, email, password_hash, role, phone, status, permissions)
    VALUES
    ('usr-admin', 'Vikram Deshmukh', 'admin', 'admin@grownaturals.com', 'admin123', 'admin', '+91 98000 11111', 'active', $1),
    ('usr-manager', 'Sneha Patil', 'manager', 'manager@grownaturals.com', 'manager123', 'manager', '+91 98000 22222', 'active', $2),
    ('usr-cashier', 'Amit Verma', 'cashier', 'cashier@grownaturals.com', 'cashier123', 'cashier', '+91 98000 33333', 'active', $3),
    ('usr-supervisor', 'Rajesh Kulkarni', 'rajesh', 'supervisor@grownaturals.com', 'sup123', 'supervisor', '+91 98000 44444', 'active', $4)
    ON CONFLICT (id) DO NOTHING
  `, [fullPermissions, managerPermissions, cashierPermissions, supervisorPermissions]);

  console.log('[DB Seed] Seeding completed (Login credentials & businesses initialized)!');
}
