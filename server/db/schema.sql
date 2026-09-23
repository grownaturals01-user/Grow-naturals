-- PostgreSQL Schema for GrowNaturals Billing (Dual Business Architecture)

-- 1. Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  gstin VARCHAR(32) DEFAULT '',
  address TEXT DEFAULT '',
  phone VARCHAR(32) DEFAULT '',
  email VARCHAR(128) DEFAULT '',
  invoice_prefix VARCHAR(16) NOT NULL,
  invoice_footer TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  currency VARCHAR(8) DEFAULT 'INR',
  default_low_stock INTEGER DEFAULT 5,
  is_taxable BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users / Staff (Shared across businesses, role-based + per-module permissions)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(128) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL, -- 'admin', 'manager', 'cashier', 'staff', 'supervisor'
  phone VARCHAR(32) DEFAULT '',
  status VARCHAR(16) DEFAULT 'active',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers (Shared across businesses)
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) DEFAULT '',
  email VARCHAR(128) DEFAULT '',
  address TEXT DEFAULT '',
  gstin VARCHAR(32) DEFAULT '',
  customer_type VARCHAR(32) DEFAULT 'customer',
  credit_limit NUMERIC(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Suppliers (Shared across businesses)
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) DEFAULT '',
  phone VARCHAR(32) DEFAULT '',
  email VARCHAR(128) DEFAULT '',
  address TEXT DEFAULT '',
  gstin VARCHAR(32) DEFAULT '',
  payment_terms TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Categories (Scoped strictly to business)
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  name VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL, -- 'plants', 'pots', 'fertilizers', 'flowers', 'general'
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Products (Strictly scoped to business - independent stock)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(32) NOT NULL, -- 'plants', 'pots', 'fertilizers', 'flowers', 'general'
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  barcode VARCHAR(64) DEFAULT '',
  cost_price NUMERIC(12,2) DEFAULT 0.00,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  gst_rate NUMERIC(5,2) DEFAULT 0.00, -- Grow Naturals: configurable; Nikhlesh Nursery: 0.00
  hsn_code VARCHAR(32) DEFAULT '',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  supplier_id VARCHAR(64) REFERENCES suppliers(id) ON DELETE SET NULL,
  image_url TEXT DEFAULT '',
  discount_pieces INTEGER DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0.00,
  attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Stock Movements (Audit log)
CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL, -- 'purchase', 'sale', 'refund', 'adjustment'
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reference_type VARCHAR(32) DEFAULT '', -- 'invoice', 'po', 'refund', 'manual'
  reference_id VARCHAR(64) DEFAULT '',
  notes TEXT DEFAULT '',
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7b. Inventory Losses & Damages
CREATE TABLE IF NOT EXISTS inventory_losses (
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
);

-- 7c. Warehouse Stocks (Dedicated warehouse / greenhouse stock pool)
CREATE TABLE IF NOT EXISTS warehouse_stocks (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  location_bin VARCHAR(64) DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_warehouse_stock UNIQUE (business_id, product_id)
);

-- 7d. Warehouse Transactions (Sales, Damages, Inward, Transfers)
CREATE TABLE IF NOT EXISTS warehouse_transactions (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL, -- 'sale', 'damage', 'inward', 'transfer_to_shop', 'transfer_from_shop', 'adjustment'
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
);

-- 8. Projects (Scoped to business)
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  company VARCHAR(255) DEFAULT '',
  supervisor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  status VARCHAR(32) DEFAULT 'active', -- 'planning', 'active', 'completed', 'on_hold'
  budget NUMERIC(12,2) DEFAULT 0.00,
  description TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Supervisor Progress Updates
CREATE TABLE IF NOT EXISTS supervisor_updates (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supervisor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT NOT NULL,
  status_change VARCHAR(32) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Invoices (Scoped to business)
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  invoice_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) DEFAULT '',
  project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  cgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  sgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'cash', -- 'cash', 'card', 'upi', 'credit', 'split'
  payment_status VARCHAR(32) NOT NULL DEFAULT 'paid',
  notes TEXT DEFAULT '',
  created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(64) PRIMARY KEY,
  invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(64) DEFAULT '',
  hsn_code VARCHAR(32) DEFAULT '',
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0.00,
  gst_rate NUMERIC(5,2) DEFAULT 0.00,
  tax_amount NUMERIC(12,2) DEFAULT 0.00,
  total NUMERIC(12,2) NOT NULL
);

-- 12. Quotations (Scoped to business)
CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  quotation_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) DEFAULT '',
  customer_gstin VARCHAR(32) DEFAULT '',
  customer_address TEXT DEFAULT '',
  valid_until DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12,2) DEFAULT 0.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) DEFAULT 'draft', -- 'draft', 'sent', 'converted_to_dc', 'converted_to_invoice', 'expired'
  converted_id VARCHAR(64) DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
  id VARCHAR(64) PRIMARY KEY,
  quotation_id VARCHAR(64) NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  gst_rate NUMERIC(5,2) DEFAULT 0.00,
  total NUMERIC(12,2) NOT NULL
);

-- 14. Delivery Challans (Scoped to business)
CREATE TABLE IF NOT EXISTS delivery_challans (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  challan_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(32) DEFAULT '',
  project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
  quotation_id VARCHAR(64) REFERENCES quotations(id) ON DELETE SET NULL,
  dispatch_date DATE DEFAULT CURRENT_DATE,
  vehicle_no VARCHAR(64) DEFAULT '',
  driver_name VARCHAR(128) DEFAULT '',
  status VARCHAR(32) DEFAULT 'dispatched', -- 'dispatched', 'delivered'
  total_amount NUMERIC(12,2) DEFAULT 0.00,
  paid_amount NUMERIC(12,2) DEFAULT 0.00,
  due_amount NUMERIC(12,2) DEFAULT 0.00,
  payment_status VARCHAR(32) DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid', 'billed'
  payment_method VARCHAR(32) DEFAULT '',
  payment_date TIMESTAMP,
  payment_notes TEXT DEFAULT '',
  invoice_id VARCHAR(64) DEFAULT '',
  approval_status VARCHAR(32) DEFAULT 'approved', -- 'approved', 'pending_approval', 'rejected'
  approved_by VARCHAR(64) DEFAULT '',
  approved_at TIMESTAMP,
  approval_reason TEXT DEFAULT '',
  credit_limit_at_creation NUMERIC(12,2) DEFAULT 0.00,
  credit_exceeded_amount NUMERIC(12,2) DEFAULT 0.00,
  due_date DATE,
  reminder_notes TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Challan Items
CREATE TABLE IF NOT EXISTS challan_items (
  id VARCHAR(64) PRIMARY KEY,
  challan_id VARCHAR(64) NOT NULL REFERENCES delivery_challans(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit VARCHAR(32) DEFAULT 'Nos',
  unit_price NUMERIC(12,2) DEFAULT 0.00,
  total NUMERIC(12,2) DEFAULT 0.00
);

-- 16. Expense Categories (User-definable, scoped to business)
CREATE TABLE IF NOT EXISTS expense_categories (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  name VARCHAR(128) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Expenses (Scoped to business, optionally tagged to project)
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  category_id VARCHAR(64) REFERENCES expense_categories(id) ON DELETE SET NULL,
  project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(32) DEFAULT 'cash',
  date DATE DEFAULT CURRENT_DATE,
  recipient VARCHAR(255) DEFAULT '',
  reference_no VARCHAR(64) DEFAULT '',
  notes TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Purchase Orders (Scoped to business)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  po_number VARCHAR(64) UNIQUE NOT NULL,
  supplier_id VARCHAR(64) NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_invoice_no VARCHAR(64) DEFAULT '',
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'received', 'cancelled'
  subtotal NUMERIC(12,2) DEFAULT 0.00,
  tax_amount NUMERIC(12,2) DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(32) DEFAULT 'due', -- 'paid', 'partial', 'due'
  paid_amount NUMERIC(12,2) DEFAULT 0.00,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id VARCHAR(64) PRIMARY KEY,
  po_id VARCHAR(64) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL
);

-- 20. Refunds (Strictly against existing invoice, with auto-restock)
CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  refund_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  total_refund_amount NUMERIC(12,2) NOT NULL,
  refund_method VARCHAR(32) DEFAULT 'cash',
  reason TEXT DEFAULT '',
  created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Refund Items
CREATE TABLE IF NOT EXISTS refund_items (
  id VARCHAR(64) PRIMARY KEY,
  refund_id VARCHAR(64) NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  tax_refund NUMERIC(12,2) DEFAULT 0.00,
  total NUMERIC(12,2) NOT NULL
);

-- 22. Custom Inventory Modules
CREATE TABLE IF NOT EXISTS inventory_modules (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES businesses(id),
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(64) NOT NULL,
  caption TEXT DEFAULT '',
  icon VARCHAR(64) DEFAULT '📦',
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_quotations_business ON quotations(business_id);
CREATE INDEX IF NOT EXISTS idx_challans_business ON delivery_challans(business_id);
CREATE INDEX IF NOT EXISTS idx_pos_business ON purchase_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_refunds_business ON refunds(business_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_modules_biz ON inventory_modules(business_id);
CREATE INDEX IF NOT EXISTS idx_inv_modules_slug ON inventory_modules(slug);
