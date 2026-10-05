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

  // 4. Categories
  const catCount = await db.query(`SELECT COUNT(*) as count FROM categories`);
  if (Number(catCount.rows[0]?.count) === 0) {
    console.log('[DB Seed] Seeding default categories...');
    await db.query(`
      INSERT INTO categories (id, business_id, name, type, description, sort_order)
      VALUES
      ('cat-gn-1', 'grow-naturals', 'Indoor Plants', 'plants', 'Purifying and decorative indoor flora', 1),
      ('cat-gn-2', 'grow-naturals', 'Outdoor Plants', 'plants', 'Sunlight loving garden and ornamental plants', 2),
      ('cat-gn-3', 'grow-naturals', 'Ceramic Pots', 'pots', 'Handcrafted ceramic planters and tabletop pots', 3),
      ('cat-gn-4', 'grow-naturals', 'Terracotta & Fiber Pots', 'pots', 'Heavy duty garden and balcony planters', 4),
      ('cat-gn-5', 'grow-naturals', 'Organic Fertilizers', 'fertilizers', 'Bio-fertilizers, vermicompost & plant boosters', 5),
      ('cat-gn-6', 'grow-naturals', 'Exotic Flowers', 'flowers', 'Orchids, Anthuriums and flowering succulents', 6),
      ('cat-nn-1', 'nikhlesh-nursery', 'Fruit Saplings', 'plants', 'Grafted high-yield mango, guava, and citrus saplings', 1),
      ('cat-nn-2', 'nikhlesh-nursery', 'Timber & Shade Trees', 'plants', 'Teak, Mahogany, and fast growing shade saplings', 2),
      ('cat-nn-3', 'nikhlesh-nursery', 'Flowering Shrubs', 'plants', 'Bougainvillea, Jasmine, and Hibiscus varieties', 3),
      ('cat-nn-4', 'nikhlesh-nursery', 'Farm Soil & Cocopeat', 'fertilizers', 'Sterilized potting mix, compost & red soil blocks', 4)
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  // 5. Products
  const prodCount = await db.query(`SELECT COUNT(*) as count FROM products`);
  if (Number(prodCount.rows[0]?.count) === 0) {
    console.log('[DB Seed] Seeding default products for Grow Naturals & Nikhlesh Nursery...');
    await db.query(`
      INSERT INTO products (id, business_id, category_id, type, name, sku, barcode, cost_price, sale_price, gst_rate, hsn_code, stock_quantity, low_stock_threshold, unit, image_url)
      VALUES
      ('prod-gn-1', 'grow-naturals', 'cat-gn-1', 'plants', 'Monstera Deliciosa (Swiss Cheese Plant)', 'GN-MON-01', '8901001001', 350.00, 650.00, 18.00, '0602', 45, 5, 'PCS', ''),
      ('prod-gn-2', 'grow-naturals', 'cat-gn-1', 'plants', 'Fiddle Leaf Fig (Ficus Lyrata)', 'GN-FID-02', '8901001002', 480.00, 890.00, 18.00, '0602', 28, 4, 'PCS', ''),
      ('prod-gn-3', 'grow-naturals', 'cat-gn-1', 'plants', 'Snake Plant Golden (Sansevieria Trifasciata)', 'GN-SNK-03', '8901001003', 180.00, 390.00, 18.00, '0602', 80, 10, 'PCS', ''),
      ('prod-gn-4', 'grow-naturals', 'cat-gn-1', 'plants', 'Areca Palm (Indoor Air Purifier)', 'GN-ARC-04', '8901001004', 250.00, 520.00, 18.00, '0602', 60, 8, 'PCS', ''),
      ('prod-gn-5', 'grow-naturals', 'cat-gn-1', 'plants', 'Peace Lily (Spathiphyllum)', 'GN-PCE-05', '8901001005', 200.00, 450.00, 18.00, '0602', 35, 5, 'PCS', ''),
      ('prod-gn-6', 'grow-naturals', 'cat-gn-1', 'plants', 'ZZ Plant (Zamioculcas Zamiifolia)', 'GN-ZZP-06', '8901001006', 320.00, 580.00, 18.00, '0602', 40, 5, 'PCS', ''),
      ('prod-gn-7', 'grow-naturals', 'cat-gn-3', 'pots', 'Matte White Ceramic Planter (8 Inch)', 'GN-POT-07', '8901001007', 220.00, 450.00, 18.00, '6912', 120, 15, 'PCS', ''),
      ('prod-gn-8', 'grow-naturals', 'cat-gn-3', 'pots', 'Terracotta Handcrafted Ribbed Pot (10 Inch)', 'GN-POT-08', '8901001008', 150.00, 320.00, 18.00, '6912', 95, 12, 'PCS', ''),
      ('prod-gn-9', 'grow-naturals', 'cat-gn-5', 'fertilizers', 'Organic Vermicompost Enricher (5 Kg Bag)', 'GN-FER-09', '8901001009', 110.00, 240.00, 5.00, '3101', 150, 20, 'BAG', ''),
      ('prod-gn-10', 'grow-naturals', 'cat-gn-5', 'fertilizers', 'Bio-Neem Organic Spray (500ml)', 'GN-FER-10', '8901001010', 95.00, 199.00, 18.00, '3808', 75, 10, 'BTL', ''),
      ('prod-gn-11', 'grow-naturals', 'cat-gn-6', 'flowers', 'Phalaenopsis Orchid (Potted Flowering)', 'GN-FLW-11', '8901001011', 650.00, 1250.00, 18.00, '0603', 18, 3, 'PCS', ''),
      ('prod-gn-12', 'grow-naturals', 'cat-gn-6', 'flowers', 'Anthurium Red Bloom (Air Purifier)', 'GN-FLW-12', '8901001012', 380.00, 720.00, 18.00, '0603', 25, 4, 'PCS', ''),
      ('prod-nn-1', 'nikhlesh-nursery', 'cat-nn-1', 'plants', 'Alphonso Mango Grafted Sapling', 'NN-MNG-01', '8902002001', 120.00, 250.00, 0.00, '0602', 180, 25, 'PCS', ''),
      ('prod-nn-2', 'nikhlesh-nursery', 'cat-nn-1', 'plants', 'Taiwan Pink Guava Sapling', 'NN-GVA-02', '8902002002', 80.00, 180.00, 0.00, '0602', 200, 30, 'PCS', ''),
      ('prod-nn-3', 'nikhlesh-nursery', 'cat-nn-1', 'plants', 'Kagzi Lime (Lemon) Sapling', 'NN-LMN-03', '8902002003', 65.00, 140.00, 0.00, '0602', 250, 30, 'PCS', ''),
      ('prod-nn-4', 'nikhlesh-nursery', 'cat-nn-2', 'plants', 'Tissue Culture Teak Wood (Sagwan)', 'NN-TEK-04', '8902002004', 45.00, 95.00, 0.00, '0602', 500, 50, 'PCS', ''),
      ('prod-nn-5', 'nikhlesh-nursery', 'cat-nn-3', 'plants', 'Bougainvillea Multi-Color Grafted', 'NN-BOU-05', '8902002005', 90.00, 220.00, 0.00, '0602', 140, 20, 'PCS', ''),
      ('prod-nn-6', 'nikhlesh-nursery', 'cat-nn-4', 'fertilizers', 'Premium Red Soil & Cowdung Compost (25 Kg)', 'NN-SOIL-06', '8902002006', 160.00, 350.00, 0.00, '3101', 80, 15, 'BAG', '')
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  console.log('[DB Seed] Verification & Seeding completed successfully!');
}
