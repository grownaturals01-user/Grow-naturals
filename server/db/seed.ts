import { getDb } from './connection.js';

export async function seedDatabase(): Promise<void> {
  const db = await getDb();

  const existingBiz = await db.query(`SELECT COUNT(*) as count FROM businesses`);
  if (Number(existingBiz.rows[0]?.count) > 0) {
    console.log('[DB Seed] Database already has seeded data.');
    return;
  }

  console.log('[DB Seed] Seeding businesses, users, categories, products, partners, and initial records...');

  // 1. Businesses
  await db.query(`
    INSERT INTO businesses (id, name, legal_name, gstin, address, phone, email, invoice_prefix, invoice_footer, currency, default_low_stock)
    VALUES 
    ('grow-naturals', 'Grow Naturals', 'Grow Naturals Private Limited', '27AABCG1234F1Z5', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '+91 98220 12345', 'billing@grownaturals.in', 'GN-', 'Thank you for choosing Grow Naturals! Handcrafted botanical elegance for your space.', 'INR', 5),
    ('nikhlesh-nursery', 'Nikhlesh Nursery', 'Nikhlesh Nursery & Farm', '', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '+91 98220 67890', 'sales@nikhleshnursery.in', 'NN-', 'Thank you for choosing Nikhlesh Nursery. Live green, grow happy! Farm fresh plants & saplings.', 'INR', 8)
  `);

  // 2. Users (Staff)
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
  `, [fullPermissions, managerPermissions, cashierPermissions, supervisorPermissions]);

  // 3. Customers (Shared)
  await db.query(`
    INSERT INTO customers (id, name, phone, email, address, gstin)
    VALUES
    ('cust-1', 'Oberoi Luxury Resorts', '+91 99112 23344', 'procurement@oberoi.demo', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '27AABCO8888M1Z1'),
    ('cust-2', 'Green Valley Residences HOA', '+91 98221 44556', 'hoa@greenvalley.demo', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', ''),
    ('cust-3', 'Anita Sharma', '+91 97654 32100', 'anita.s@example.com', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '')
  `);

  // 4. Suppliers (Shared)
  await db.query(`
    INSERT INTO suppliers (id, name, contact_person, phone, email, address, gstin, payment_terms)
    VALUES
    ('supp-1', 'Kaveri Flora Wholesale', 'Suresh Kaveri', '+91 98450 11223', 'orders@kaveriflora.demo', 'Flower Mandi, Yard 4, Bangalore', '29AABCK9900L1Z2', 'Net 15 Days'),
    ('supp-2', 'Pottery Craft Works', 'Ramesh Kumhar', '+91 98230 44556', 'craft@potterycraft.demo', 'Industrial Estate, Khurja, UP', '09AABCP1122P1Z8', 'Net 30 Days'),
    ('supp-3', 'AgroGreen Fertilizers & Bio', 'Dr. Arvind Joshi', '+91 94220 77889', 'contact@agrogreen.demo', 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu', '27AABCA3344J1Z4', '100% Advance')
  `);

  // 5. Expense Categories
  await db.query(`
    INSERT INTO expense_categories (id, business_id, name, description)
    VALUES
    ('expcat-gn-1', 'grow-naturals', 'Plant Nutrition & Soil Stock', 'Raw potting mixes, vermicompost & foliar boosters'),
    ('expcat-gn-2', 'grow-naturals', 'Site Labour & Installation', 'Wages for site plant installation and landscaping crew'),
    ('expcat-gn-3', 'grow-naturals', 'Store Operations & Utilities', 'Electricity, water bill, counter supplies'),
    ('expcat-nn-1', 'nikhlesh-nursery', 'Farm Labour & Weeding', 'Daily farm crew wages'),
    ('expcat-nn-2', 'nikhlesh-nursery', 'Sapling Procurement', 'Bulk saplings from local green nurseries'),
    ('expcat-nn-3', 'nikhlesh-nursery', 'Tractor & Transport', 'Diesel and vehicle dispatch for field deliveries')
  `);

  // 6. Categories
  await db.query(`
    INSERT INTO categories (id, business_id, name, type, description, sort_order)
    VALUES
    ('cat-gn-plants', 'grow-naturals', 'Indoor Tropicals & Bonsai', 'plants', 'Exotic potted plants, hardy indoor greenery & bonsai', 1),
    ('cat-gn-pots', 'grow-naturals', 'Glazed Ceramic & Planters', 'pots', 'Artisan glazed pots, self-watering pots & planters', 2),
    ('cat-gn-fert', 'grow-naturals', 'Organic Nutrients & Foliar Sprays', 'fertilizers', 'Bio boosters, seaweed tonics, neem sprays', 3),
    ('cat-gn-flowers', 'grow-naturals', 'Exotic Arrangements & Bouquets', 'flowers', 'Fresh cut lilies, orchids, and luxury arrangements', 4),

    ('cat-nn-plants', 'nikhlesh-nursery', 'Fruit & Timber Saplings', 'plants', 'Grafted fruit trees, shade saplings and hedge plants', 1),
    ('cat-nn-pots', 'nikhlesh-nursery', 'Terracotta & Nursery Grow Bags', 'pots', 'Traditional red clay pots, polybags and grow bags', 2),
    ('cat-nn-fert', 'nikhlesh-nursery', 'Vermicompost & Farm Manure', 'fertilizers', 'Bulk enriched compost, cow dung manure, bio enzymes', 3),
    ('cat-nn-flowers', 'nikhlesh-nursery', 'Loose Fresh Farm Flowers', 'flowers', 'Daily farm-cut marigold, jasmine, and rose flowers', 4)
  `);

  // 7. Products for Grow Naturals (Taxable, Configurable GST)
  await db.query(`
    INSERT INTO products (id, business_id, category_id, type, name, sku, barcode, cost_price, sale_price, gst_rate, hsn_code, stock_quantity, low_stock_threshold, supplier_id, attributes)
    VALUES
    ('prod-gn-1', 'grow-naturals', 'cat-gn-plants', 'plants', 'Ficus Bonsai S-Shape (8")', 'GN-PL-001', '89010010001', 650.00, 1250.00, 12.00, '0602', 18, 5, 'supp-1',
     '{"pot_size": "8 inch ceramic", "height": "1.2 ft", "sunlight": "Bright indirect", "watering": "2x weekly", "difficulty": "Easy"}'::jsonb),
    ('prod-gn-2', 'grow-naturals', 'cat-gn-plants', 'plants', 'Monstera Deliciosa (Swiss Cheese)', 'GN-PL-002', '89010010002', 400.00, 890.00, 12.00, '0602', 24, 6, 'supp-1',
     '{"pot_size": "10 inch nursery", "height": "2.5 ft", "sunlight": "Medium to bright", "watering": "Weekly", "difficulty": "Beginner"}'::jsonb),
    ('prod-gn-3', 'grow-naturals', 'cat-gn-plants', 'plants', 'Sansevieria Snake Plant Laurentii', 'GN-PL-003', '89010010003', 220.00, 480.00, 12.00, '0602', 35, 8, 'supp-1',
     '{"pot_size": "6 inch pot", "height": "1.5 ft", "sunlight": "Any light", "watering": "Bi-weekly", "difficulty": "Very Easy"}'::jsonb),
    ('prod-gn-4', 'grow-naturals', 'cat-gn-pots', 'pots', 'Royal Indigo Glazed Ceramic Pot (10")', 'GN-PT-001', '89010010004', 320.00, 750.00, 18.00, '6912', 15, 4, 'supp-2',
     '{"material": "Glazed Ceramic", "size": "10 inch", "color": "Royal Indigo", "drainage": "Yes"}'::jsonb),
    ('prod-gn-5', 'grow-naturals', 'cat-gn-pots', 'pots', 'Terrazzo Minimalist Cylinder (12")', 'GN-PT-002', '89010010005', 550.00, 1200.00, 18.00, '6810', 9, 3, 'supp-2',
     '{"material": "Fiberstone / Terrazzo", "size": "12 inch", "color": "Granite Off-White", "drainage": "Yes"}'::jsonb),
    ('prod-gn-6', 'grow-naturals', 'cat-gn-fert', 'fertilizers', 'Organic Seaweed Bio-Tonic 500ml', 'GN-FT-001', '89010010006', 140.00, 320.00, 5.00, '3101', 40, 10, 'supp-3',
     '{"composition": "Cold pressed kelp extract", "unit_size": "500 ml", "is_organic": "Yes", "safety_notes": "Non-toxic, safe for pets and children"}'::jsonb),
    ('prod-gn-7', 'grow-naturals', 'cat-gn-flowers', 'flowers', 'Luxury Orchid & Lily Bouquet', 'GN-FL-001', '89010010007', 650.00, 1500.00, 18.00, '0603', 12, 3, 'supp-1',
     '{"occasion": "Celebration / Corporate", "arrangement_style": "Tall Glass Vase", "shelf_life": "6 days", "vase_included": "Yes"}'::jsonb)
  `);

  // 8. Products for Nikhlesh Nursery (Non-taxable: gst_rate = 0.00)
  await db.query(`
    INSERT INTO products (id, business_id, category_id, type, name, sku, barcode, cost_price, sale_price, gst_rate, hsn_code, stock_quantity, low_stock_threshold, supplier_id, attributes)
    VALUES
    ('prod-nn-1', 'nikhlesh-nursery', 'cat-nn-plants', 'plants', 'Alphonso Mango Grafted Sapling', 'NN-PL-001', '89020010001', 110.00, 220.00, 0.00, '0602', 120, 20, 'supp-1',
     '{"pot_size": "Polybag 5L", "height": "2.5 ft", "sunlight": "Full sun", "watering": "Daily", "difficulty": "Moderate"}'::jsonb),
    ('prod-nn-2', 'nikhlesh-nursery', 'cat-nn-plants', 'plants', 'Kesar Mango Grafted Sapling', 'NN-PL-002', '89020010002', 105.00, 210.00, 0.00, '0602', 95, 15, 'supp-1',
     '{"pot_size": "Polybag 5L", "height": "2.0 ft", "sunlight": "Full sun", "watering": "Daily", "difficulty": "Moderate"}'::jsonb),
    ('prod-nn-3', 'nikhlesh-nursery', 'cat-nn-plants', 'plants', 'Guava (Sardar L-49) High Yield', 'NN-PL-003', '89020010003', 75.00, 160.00, 0.00, '0602', 80, 15, 'supp-1',
     '{"pot_size": "Polybag 3L", "height": "2.0 ft", "sunlight": "Full sun", "watering": "Regular", "difficulty": "Easy"}'::jsonb),
    ('prod-nn-4', 'nikhlesh-nursery', 'cat-nn-pots', 'pots', 'Heavy Duty Farm Grow Bag 12x12', 'NN-PT-001', '89020010004', 22.00, 45.00, 0.00, '3923', 450, 50, 'supp-2',
     '{"material": "HDPE UV-Stabilized", "size": "12x12 inch", "color": "Green / Orange", "drainage": "Yes"}'::jsonb),
    ('prod-nn-5', 'nikhlesh-nursery', 'cat-nn-pots', 'pots', 'Clay Round Gamla (10" Terracotta)', 'NN-PT-002', '89020010005', 45.00, 95.00, 0.00, '6912', 110, 20, 'supp-2',
     '{"material": "Traditional Terracotta", "size": "10 inch", "color": "Earthy Red", "drainage": "Yes"}'::jsonb),
    ('prod-nn-6', 'nikhlesh-nursery', 'cat-nn-fert', 'fertilizers', 'Pure Organic Vermicompost (25kg)', 'NN-FT-001', '89020010006', 210.00, 380.00, 0.00, '3101', 80, 15, 'supp-3',
     '{"composition": "Earthworm cast enriched with cow dung", "unit_size": "25 kg sack", "is_organic": "Yes", "safety_notes": "100% natural, store in dry place"}'::jsonb),
    ('prod-nn-7', 'nikhlesh-nursery', 'cat-nn-flowers', 'flowers', 'Loose Fresh Orange Marigold (5kg)', 'NN-FL-001', '89020010007', 150.00, 320.00, 0.00, '0603', 30, 10, 'supp-1',
     '{"occasion": "Mandir / Pooja / Festive", "arrangement_style": "Loose Farm Fresh", "shelf_life": "2 days", "vase_included": "No"}'::jsonb)
  `);

  // 9. Initial Project for Grow Naturals
  await db.query(`
    INSERT INTO projects (id, business_id, name, client_name, company, supervisor_id, start_date, end_date, status, budget, description)
    VALUES
    ('proj-gn-1', 'grow-naturals', 'Oberoi Luxury Rooftop Garden', 'Oberoi Luxury Resorts', 'Oberoi Hotels Group', 'usr-supervisor',
     CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '45 days', 'active', 150000.00, 'Complete landscape design, potted bonsai installation, and automated drip irrigation for guest executive lounge.')
  `);

  // 10. Sample Project Expense
  await db.query(`
    INSERT INTO expenses (id, business_id, category_id, project_id, amount, payment_method, date, recipient, reference_no, notes)
    VALUES
    ('exp-gn-1', 'grow-naturals', 'expcat-gn-2', 'proj-gn-1', 12500.00, 'upi', CURRENT_DATE - INTERVAL '5 days', 'Madurai Green Landscapers', 'UPI/294821', 'Phase 1 planter positioning and soil bedding labour wages')
  `);

  // 11. Sample Invoices for Grow Naturals & Nikhlesh Nursery
  // Grow Naturals Invoice #GN-1001
  await db.query(`
    INSERT INTO invoices (id, business_id, invoice_number, customer_id, customer_name, customer_phone, project_id, subtotal, discount_amount, tax_amount, cgst_amount, sgst_amount, total_amount, payment_method, payment_status, notes, created_by)
    VALUES
    ('inv-gn-1', 'grow-naturals', 'GN-1001', 'cust-1', 'Oberoi Luxury Resorts', '+91 99112 23344', 'proj-gn-1',
     42000.00, 2000.00, 4800.00, 2400.00, 2400.00, 44800.00, 'upi', 'paid', 'Advance billing for terrace planter collection', 'usr-admin')
  `);

  await db.query(`
    INSERT INTO invoice_items (id, invoice_id, product_id, product_name, sku, hsn_code, quantity, unit_price, discount, gst_rate, tax_amount, total)
    VALUES
    ('inv-item-gn-1', 'inv-gn-1', 'prod-gn-1', 'Ficus Bonsai S-Shape (8")', 'GN-PL-001', '0602', 20, 1250.00, 1000.00, 12.00, 2880.00, 26880.00),
    ('inv-item-gn-2', 'inv-gn-1', 'prod-gn-4', 'Royal Indigo Glazed Ceramic Pot (10")', 'GN-PT-001', '6912', 20, 750.00, 1000.00, 18.00, 2520.00, 16520.00)
  `);

  // Nikhlesh Nursery Invoice #NN-1001 (Non-taxable, ₹0.00 tax rows)
  await db.query(`
    INSERT INTO invoices (id, business_id, invoice_number, customer_id, customer_name, customer_phone, subtotal, discount_amount, tax_amount, cgst_amount, sgst_amount, total_amount, payment_method, payment_status, notes, created_by)
    VALUES
    ('inv-nn-1', 'nikhlesh-nursery', 'NN-1001', 'cust-2', 'Green Valley Residences HOA', '+91 98221 44556',
     12800.00, 300.00, 0.00, 0.00, 0.00, 12500.00, 'cash', 'paid', 'Estate fruit orchard batch supply', 'usr-cashier')
  `);

  await db.query(`
    INSERT INTO invoice_items (id, invoice_id, product_id, product_name, sku, hsn_code, quantity, unit_price, discount, gst_rate, tax_amount, total)
    VALUES
    ('inv-item-nn-1', 'inv-nn-1', 'prod-nn-1', 'Alphonso Mango Grafted Sapling', 'NN-PL-001', '0602', 40, 220.00, 200.00, 0.00, 0.00, 8600.00),
    ('inv-item-nn-2', 'inv-nn-1', 'prod-nn-6', 'Pure Organic Vermicompost (25kg)', 'NN-FT-001', '3101', 11, 380.00, 100.00, 0.00, 0.00, 4080.00)
  `);

  // 12. Sample Quotation for Grow Naturals
  await db.query(`
    INSERT INTO quotations (id, business_id, quotation_number, customer_id, customer_name, customer_phone, valid_until, subtotal, discount, tax_amount, total_amount, status, notes)
    VALUES
    ('quote-gn-1', 'grow-naturals', 'QT-GN-1001', 'cust-3', 'Anita Sharma', '+91 97654 32100', CURRENT_DATE + INTERVAL '15 days',
     8400.00, 400.00, 1080.00, 9080.00, 'draft', 'Balcony garden green makeover quotation')
  `);

  await db.query(`
    INSERT INTO quotation_items (id, quotation_id, product_id, product_name, quantity, unit_price, gst_rate, total)
    VALUES
    ('qitem-1', 'quote-gn-1', 'prod-gn-2', 'Monstera Deliciosa (Swiss Cheese)', 4, 890.00, 12.00, 3560.00),
    ('qitem-2', 'quote-gn-1', 'prod-gn-5', 'Terrazzo Minimalist Cylinder (12")', 4, 1200.00, 18.00, 4800.00)
  `);

  // 14. Sample Delivery Challans for Grow Naturals & Nikhlesh Nursery
  await db.query(`
    INSERT INTO delivery_challans (
      id, business_id, challan_number, customer_id, customer_name, customer_phone, project_id,
      dispatch_date, vehicle_no, driver_name, status,
      total_amount, paid_amount, due_amount, payment_status, payment_method, payment_date, notes
    ) VALUES
    ('dc-gn-1', 'grow-naturals', 'DC-GN-1001', 'cust-1', 'Oberoi Luxury Resorts', '+91 99112 23344', 'proj-gn-1',
     CURRENT_DATE - INTERVAL '2 days', 'MH 12 AB 4589', 'Ramesh (Tempo)', 'dispatched',
     18500.00, 5000.00, 13500.00, 'partially_paid', 'cash', CURRENT_TIMESTAMP - INTERVAL '2 days',
     'Site Phase 1 Plants & Pots. Balance due upon site supervisor sign-off.'),
    ('dc-gn-2', 'grow-naturals', 'DC-GN-1002', 'cust-1', 'Oberoi Luxury Resorts', '+91 99112 23344', 'proj-gn-1',
     CURRENT_DATE - INTERVAL '1 day', 'MH 12 CD 7821', 'Suresh', 'dispatched',
     9200.00, 0.00, 9200.00, 'unpaid', '', null,
     'Phase 2 additional soil bags and fertilizer packs dispatched to rooftop.'),
    ('dc-nn-1', 'nikhlesh-nursery', 'DC-NN-1001', 'cust-2', 'Green Valley Residences HOA', '+91 98221 44556', null,
     CURRENT_DATE - INTERVAL '3 days', 'MH 12 EV 9012', 'Vinod', 'dispatched',
     8800.00, 0.00, 8800.00, 'unpaid', '', null,
     'Avenue tree saplings for boundary green wall.')
  `);

  await db.query(`
    INSERT INTO challan_items (id, challan_id, product_id, product_name, quantity, unit, unit_price, total)
    VALUES
    ('dc-item-1', 'dc-gn-1', 'prod-gn-1', 'Ficus Bonsai S-Shape (8")', 10, 'Nos', 1250.00, 12500.00),
    ('dc-item-2', 'dc-gn-1', 'prod-gn-4', 'Royal Indigo Glazed Ceramic Pot (10")', 10, 'Nos', 600.00, 6000.00),
    ('dc-item-3', 'dc-gn-2', 'prod-nn-6', 'Pure Organic Vermicompost (25kg)', 20, 'Bags', 380.00, 7600.00),
    ('dc-item-4', 'dc-gn-2', 'prod-gn-2', 'Monstera Deliciosa (Swiss Cheese)', 2, 'Nos', 800.00, 1600.00),
    ('dc-item-5', 'dc-nn-1', 'prod-nn-1', 'Alphonso Mango Grafted Sapling', 40, 'Nos', 220.00, 8800.00)
  `);

  console.log('[DB Seed] Seeding completed successfully!');
}
