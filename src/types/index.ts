/**
 * GrowNaturals Billing — Unified TypeScript Interfaces
 */

export type BusinessId = string;

export interface Business {
  id: BusinessId;
  name: string;
  legal_name: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  invoice_prefix: string;
  invoice_footer: string;
  logo_url: string;
  currency: string;
  default_low_stock: number;
  is_taxable?: boolean;
  created_at?: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'staff' | 'supervisor';

export interface UserPermissions {
  dashboard?: boolean;
  pos?: boolean;
  quotations?: boolean;
  delivery_challans?: boolean;
  inventory?: boolean;
  projects?: boolean;
  purchases?: boolean;
  expenses?: boolean;
  refunds?: boolean;
  invoices?: boolean;
  staff?: boolean;
  settings?: boolean;
  losses?: boolean;
  [key: string]: boolean | undefined;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  phone: string;
  status: 'active' | 'inactive';
  permissions: UserPermissions;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  invoice_count?: number;
  total_spent?: number;
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  payment_terms: string;
  total_po_count?: number;
  total_purchased?: number;
  outstanding_due?: number;
  created_at?: string;
}

export type CategoryType = 'plants' | 'pots' | 'fertilizers' | 'flowers' | 'general';

export interface Category {
  id: string;
  business_id: string;
  name: string;
  type: CategoryType;
  description: string;
  sort_order: number;
  product_count?: number;
}

export interface PlantAttributes {
  pot_size?: string;
  height?: string;
  sunlight?: string;
  watering?: string;
  difficulty?: string;
}

export interface PotAttributes {
  material?: string;
  size?: string;
  color?: string;
  drainage?: string;
}

export interface FertilizerAttributes {
  composition?: string;
  unit_size?: string;
  is_organic?: string;
  safety_notes?: string;
}

export interface FlowerAttributes {
  occasion?: string;
  arrangement_style?: string;
  shelf_life?: string;
  vase_included?: string;
}

export interface Product {
  id: string;
  business_id: BusinessId;
  category_id?: string | null;
  category_name?: string;
  type: CategoryType;
  name: string;
  sku: string;
  barcode: string;
  cost_price: number;
  sale_price: number;
  gst_rate: number;
  hsn_code: string;
  stock_quantity: number;
  low_stock_threshold: number;
  supplier_id?: string | null;
  supplier_name?: string;
  image_url?: string;
  attributes: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: string;
  business_id: string;
  product_id: string;
  type: 'purchase' | 'sale' | 'refund' | 'adjustment';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type: string;
  reference_id: string;
  notes: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id?: string;
  product_id?: string | null;
  product_name: string;
  sku?: string;
  hsn_code?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  gst_rate: number;
  tax_amount: number;
  total: number;
}

export interface Invoice {
  id: string;
  business_id: BusinessId;
  invoice_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  project_id?: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes: string;
  created_by?: string;
  cashier_name?: string;
  project_name?: string;
  business_name?: string;
  business_legal_name?: string;
  business_gstin?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_footer?: string;
  item_count?: number;
  created_at: string;
  items?: InvoiceItem[];
}

export interface QuotationItem {
  id: string;
  quotation_id?: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  total: number;
}

export interface Quotation {
  id: string;
  business_id: BusinessId;
  quotation_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  valid_until?: string | null;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'converted_to_dc' | 'converted_to_invoice' | 'expired';
  converted_id?: string;
  notes: string;
  created_at: string;
  items?: QuotationItem[];
  business_name?: string;
  legal_name?: string;
  business_gstin?: string;
  business_address?: string;
  business_phone?: string;
  invoice_footer?: string;
}

export interface ChallanItem {
  id: string;
  challan_id?: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  total?: number;
}

export interface DeliveryChallan {
  id: string;
  business_id: BusinessId;
  challan_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string;
  project_id?: string | null;
  quotation_id?: string | null;
  dispatch_date: string;
  vehicle_no: string;
  driver_name: string;
  status: 'dispatched' | 'delivered';
  total_amount?: number;
  paid_amount?: number;
  due_amount?: number;
  payment_status?: 'unpaid' | 'partially_paid' | 'paid' | 'billed';
  payment_method?: string;
  payment_date?: string;
  payment_notes?: string;
  invoice_id?: string;
  notes: string;
  created_at: string;
  project_name?: string;
  item_count?: number;
  items?: ChallanItem[];
  business_name?: string;
  legal_name?: string;
  business_gstin?: string;
  business_address?: string;
  business_phone?: string;
  invoice_footer?: string;
}

export interface CustomerDCSummary {
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string;
  challan_count: number;
  unpaid_challan_count: number;
  total_dispatched_amount: number;
  total_paid_amount: number;
  total_due_balance: number;
  latest_dispatch_date: string;
  challans: DeliveryChallan[];
}

export interface Project {
  id: string;
  business_id: BusinessId;
  name: string;
  client_name: string;
  company: string;
  supervisor_id?: string | null;
  supervisor_name?: string;
  supervisor_phone?: string;
  supervisor_email?: string;
  start_date?: string | null;
  end_date?: string | null;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  budget: number;
  description: string;
  collection_value: number;
  total_expenses: number;
  profit: number;
  margin_percent: number;
  created_at?: string;
  invoices?: Invoice[];
  expenses?: Expense[];
  updates?: SupervisorUpdate[];
  challans?: DeliveryChallan[];
}

export interface SupervisorUpdate {
  id: string;
  project_id: string;
  supervisor_id?: string | null;
  supervisor_name?: string;
  notes: string;
  status_change?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  business_id: string;
  name: string;
  description: string;
  expense_count?: number;
  total_spent?: number;
}

export interface Expense {
  id: string;
  business_id: BusinessId;
  category_id?: string | null;
  category_name?: string;
  project_id?: string | null;
  project_name?: string;
  amount: number;
  payment_method: string;
  date: string;
  recipient: string;
  reference_no: string;
  notes: string;
  created_at?: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id?: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  business_id: BusinessId;
  po_number: string;
  supplier_id: string;
  supplier_name?: string;
  supplier_phone?: string;
  supplier_invoice_no: string;
  order_date: string;
  delivery_date?: string | null;
  status: 'pending' | 'received' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'paid' | 'partial' | 'due';
  paid_amount: number;
  outstanding_due?: number;
  notes: string;
  created_at: string;
  items?: PurchaseOrderItem[];
}

export interface RefundItem {
  id: string;
  refund_id?: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_refund: number;
  total: number;
}

export interface Refund {
  id: string;
  business_id: BusinessId;
  invoice_id: string;
  invoice_number?: string;
  refund_number: string;
  customer_id?: string | null;
  customer_name: string;
  total_refund_amount: number;
  refund_method: string;
  original_payment_method?: string;
  reason: string;
  created_by?: string;
  cashier_name?: string;
  created_at: string;
  items?: RefundItem[];
}

export interface POSCartItem {
  product_id: string;
  product_name: string;
  sku: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  gst_rate: number;
  stock_quantity: number;
}

export interface OfflineSaleQueueItem {
  id: string;
  business_id: BusinessId;
  invoice_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  payment_method: string;
  notes: string;
  created_by?: string;
  created_at: string;
  items: any[];
  synced: boolean;
}

export interface HeldBill {
  id: string;
  hold_number: string;
  business_id: BusinessId;
  customer_name: string;
  customer_phone: string;
  items: POSCartItem[];
  discount_amount: number;
  saved_at: string;
}

export type LossReason =
  | 'withered_decay'
  | 'pest_infection'
  | 'root_rot'
  | 'physical_damage'
  | 'transit_breakage'
  | 'expired'
  | 'weather_extreme'
  | 'other';

export interface InventoryLoss {
  id: string;
  business_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  product_type?: string;
  product_image_url?: string;
  current_stock?: number;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  loss_amount: number;
  reason: LossReason;
  notes?: string;
  reported_by?: string;
  damage_date: string;
  created_at?: string;
}

export interface InventoryLossMetrics {
  total_loss_amount: number;
  total_items_lost: number;
  total_records: number;
  today_loss_amount: number;
  today_items_lost: number;
  top_reasons: { reason: string; occurrences: number; units_lost: number; total_amount: number }[];
  top_products: { name: string; sku: string; type: string; units_lost: number; total_amount: number }[];
}

export type WarehouseTransactionType =
  | 'sale'
  | 'damage'
  | 'inward'
  | 'transfer_to_shop'
  | 'transfer_from_shop'
  | 'adjustment';

export interface WarehouseItem {
  id: string;
  business_id: string;
  name: string;
  sku: string;
  barcode?: string;
  type: string;
  cost_price: number;
  sale_price: number;
  shop_stock: number;
  low_stock_threshold: number;
  image_url?: string;
  category_name?: string;
  warehouse_stock: number;
  location_bin?: string;
  warehouse_valuation: number;
  total_sold_units: number;
  total_sold_amount: number;
  total_damaged_units: number;
  total_damaged_amount: number;
  total_transferred_to_shop: number;
}

export interface WarehouseTransaction {
  id: string;
  business_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  product_type?: string;
  product_image_url?: string;
  category_name?: string;
  type: WarehouseTransactionType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_price: number;
  total_amount: number;
  buyer_name?: string;
  damage_reason?: string;
  reference_no?: string;
  notes?: string;
  performed_by?: string;
  transaction_date: string;
  created_at: string;
}

export interface WarehouseMetrics {
  total_warehouse_units: number;
  total_warehouse_valuation: number;
  total_products_tracked: number;
  total_sales_units: number;
  total_sales_amount: number;
  sales_transactions_count: number;
  total_damage_units: number;
  total_damage_amount: number;
  damage_records_count: number;
  total_transfers_units: number;
  transfer_records_count: number;
}

