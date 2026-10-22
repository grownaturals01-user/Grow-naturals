import { getDb } from './connection.js';

export async function seedDatabase(): Promise<void> {
  const db = await getDb();

  console.log('[DB Seed] Verifying database core seed data...');

  // 1. Businesses
  await db.query(`
    INSERT INTO businesses (id, name, legal_name, gstin, address, phone, email, invoice_prefix, invoice_footer, currency, default_low_stock, is_taxable)
    VALUES 
    ('grow-naturals', 'Grow Naturals', 'Grow Naturals Private Limited', '27AABCG1234F1Z5', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '+91 98220 12345', 'billing@grownaturals.in', 'GN00', 'Thank you for choosing Grow Naturals! Handcrafted botanical elegance for your space.', 'INR', 5, true),
    ('nikhlesh-nursery', 'Nikhlesh Nursery', 'Nikhlesh Nursery & Farm', '', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '+91 98220 67890', 'sales@nikhleshnursery.in', 'NN00', 'Thank you for choosing Nikhlesh Nursery. Live green, grow happy! Farm fresh plants & saplings.', 'INR', 8, false)
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

  // 3. Customers
  const custCount = await db.query(`SELECT COUNT(*) as count FROM customers`);
  if (Number(custCount.rows[0]?.count) === 0) {
    console.log('[DB Seed] Seeding default customers...');
    await db.query(`
      INSERT INTO customers (id, name, phone, email, address, gstin, customer_type, credit_limit, closing_balance)
      VALUES
      ('cust-1', 'Aachiya', '9876543210', 'aachiya@example.com', 'Madurai, Tamil Nadu', '', 'Retailer', 50000, 0),
      ('cust-2', 'Aarsha', '9443210987', 'aarsha@example.com', 'Bangalore, Karnataka', '', 'Consumer', 25000, 0),
      ('cust-3', 'Aarthi', '9842109876', 'aarthi@example.com', 'Chennai, Tamil Nadu', '33AAAAA0000A1Z5', 'Wholesaler', 100000, 836.99),
      ('cust-4', 'Abby', '9123456780', 'abby@example.com', 'Coimbatore, Tamil Nadu', '', 'Consumer', 15000, 0),
      ('cust-5', 'Abi Rhuban', '9988776655', 'abi@example.com', 'Madurai, Tamil Nadu', '', 'Consumer', 20000, 0),
      ('cust-6', 'Anita Sharma', '9811223344', 'anita@example.com', 'Indiranagar, Bangalore', '29BBBBB1111B1Z2', 'Corporate / Institutional', 250000, 5600),
      ('cust-7', 'Oberoi Luxury Resorts', '9870011223', 'procurement@oberoi.com', 'MG Road, Bangalore', '29CCCCC2222C1Z3', 'Corporate / Institutional', 500000, 44800),
      ('cust-8', 'Gowtham Nursery', '9443012345', 'gowtham@nursery.com', 'Madurai, Tamil Nadu', '33DDDDD3333D1Z4', 'Nursery / Landscaper', 150000, 4500),
      ('cust-9', 'MDA Pots and Plants', '9842012345', 'mda@pots.com', 'Salem, Tamil Nadu', '33EEEEE4444E1Z5', 'Wholesaler', 300000, 325513.01)
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  // 4. Default Sample Sales Invoices
  const invCount = await db.query(`SELECT COUNT(*) as count FROM invoices`);
  if (Number(invCount.rows[0]?.count) === 0) {
    console.log('[DB Seed] Seeding default sales invoices...');
    await db.query(`
      INSERT INTO invoices (id, business_id, invoice_number, customer_id, customer_name, customer_phone, subtotal, discount_amount, tax_amount, total_amount, payment_method, payment_status, created_at)
      VALUES
      ('inv-001', 'grow-naturals', 'INV-2026-081', 'cust-7', 'Oberoi Luxury Resorts', '+91 98700 11223', 411542.37, 0, 74077.63, 485620.00, 'upi', 'paid', NOW() - INTERVAL '2 days'),
      ('inv-002', 'grow-naturals', 'INV-2026-079', 'cust-6', 'Anita Sharma', '+91 98112 23344', 205237.70, 0, 36942.79, 242180.49, 'bank_transfer', 'paid', NOW() - INTERVAL '4 days'),
      ('inv-003', 'grow-naturals', 'INV-2026-077', 'cust-2', 'Aarsha Living Spaces', '+91 94432 10987', 159791.53, 0, 28762.47, 188554.00, 'upi', 'paid', NOW() - INTERVAL '6 days'),
      ('inv-004', 'grow-naturals', 'INV-2026-074', 'cust-4', 'Abby Botanical Interiors', '+91 91234 56780', 122881.36, 0, 22118.64, 145000.00, 'card', 'paid', NOW() - INTERVAL '8 days'),
      ('inv-005', 'grow-naturals', 'INV-2026-083', 'cust-9', 'MDA Pots and Plants', '+91 98420 12345', 148593.81, 0, 26746.88, 175340.69, 'credit', 'unpaid', NOW() - INTERVAL '1 day'),
      ('inv-006', 'grow-naturals', 'INV-2026-072', 'cust-8', 'Gowtham Nursery', '+91 94430 12345', 71567.80, 0, 12882.20, 84450.00, 'credit', 'unpaid', NOW() - INTERVAL '10 days')
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  // 5. Clean out any legacy dump categories and products
  try {
    await db.query(`DELETE FROM products WHERE id LIKE 'prod-gn-%' OR id LIKE 'prod-nn-%';`);
    await db.query(`DELETE FROM categories WHERE id LIKE 'cat-gn-%' OR id LIKE 'cat-nn-%';`);
    await db.query(`DELETE FROM subcategories WHERE id LIKE 'subcat-%';`);
  } catch (cleanErr) {
    console.warn('[DB Seed] Warning while cleaning dump records:', cleanErr);
  }

  console.log('[DB Seed] Verification completed successfully (dump data removed)!');
}
