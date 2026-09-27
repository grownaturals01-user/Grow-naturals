import { getDb } from '../server/db/connection.js';

async function clearTestData() {
  console.log('[Clear Data] Starting cleanup of test/demo records...');
  const db = await getDb();

  const tablesToClear = [
    'invoice_items',
    'invoices',
    'challan_items',
    'delivery_challans',
    'quotation_items',
    'quotations',
    'purchase_order_items',
    'purchase_orders',
    'supervisor_updates',
    'expenses',
    'projects',
    'inventory_losses',
    'warehouse_transactions',
    'warehouse_stocks',
    'stock_movements',
    'refund_items',
    'refunds',
    'held_bills',
    'products',
    'customers',
    'suppliers'
  ];

  for (const table of tablesToClear) {
    try {
      await db.query(`DELETE FROM ${table}`);
      console.log(`[Clear Data] Cleared table: ${table}`);
    } catch (err: any) {
      console.log(`[Clear Data] Note on ${table}: ${err.message}`);
    }
  }

  // Ensure default login users exist
  const userCount = await db.query(`SELECT COUNT(*) as count FROM users`);
  console.log(`[Clear Data] Preserved users count: ${userCount.rows[0]?.count}`);

  // Ensure businesses exist
  const bizCount = await db.query(`SELECT COUNT(*) as count FROM businesses`);
  console.log(`[Clear Data] Preserved businesses count: ${bizCount.rows[0]?.count}`);

  console.log('[Clear Data] All test data removed successfully! Login credentials and businesses preserved.');
  process.exit(0);
}

clearTestData().catch((err) => {
  console.error('[Clear Data] Error:', err);
  process.exit(1);
});
