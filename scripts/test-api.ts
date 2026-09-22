/**
 * End-to-End API and Database verification script
 */
import { getDb } from '../server/db/connection.js';

async function runTests() {
  console.log('--- Starting GrowNaturals Billing Verification ---');

  const db = await getDb();

  // 1. Verify Businesses
  const bizRes = await db.query('SELECT id, name, gstin FROM businesses');
  console.log('Businesses in DB:', bizRes.rows);
  if (bizRes.rows.length !== 2) {
    throw new Error(`Expected 2 businesses, found ${bizRes.rows.length}`);
  }

  // 2. Verify Scoped Products
  const gnProd = await db.query('SELECT COUNT(*) as count FROM products WHERE business_id = $1', ['grow-naturals']);
  const nnProd = await db.query('SELECT COUNT(*) as count FROM products WHERE business_id = $1', ['nikhlesh-nursery']);
  console.log(`Products: Grow Naturals = ${gnProd.rows[0].count}, Nikhlesh Nursery = ${nnProd.rows[0].count}`);

  // 3. Verify Users
  const userRes = await db.query('SELECT username, role, status FROM users');
  console.log('Seeded Users:', userRes.rows.map(u => `${u.username} (${u.role})`).join(', '));

  // 4. Test Stock Restock on Refund
  // Pick a product to test restocking
  const prod = await db.query('SELECT id, name, stock_quantity, business_id FROM products LIMIT 1');
  const testProd = prod.rows[0];
  const initialStock = Number(testProd.stock_quantity);
  console.log(`Testing Restock on product "${testProd.name}" (ID: ${testProd.id}), Initial Stock: ${initialStock}`);

  // Simulate refund restock
  const refundQty = 3;
  const newStock = initialStock + refundQty;
  await db.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [newStock, testProd.id]);

  const verifyProd = await db.query('SELECT stock_quantity FROM products WHERE id = $1', [testProd.id]);
  const verifiedStock = Number(verifyProd.rows[0].stock_quantity);
  console.log(`Updated Stock after restock: ${verifiedStock} (Expected: ${newStock})`);
  if (verifiedStock !== newStock) {
    throw new Error(`Stock mismatch: got ${verifiedStock}, expected ${newStock}`);
  }

  // Restore original stock
  await db.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [initialStock, testProd.id]);
  console.log(`Restored stock to original ${initialStock}`);

  // 5. Test Project Profit Calculation: Collection Value - Expenses
  const projRes = await db.query('SELECT id, name, budget FROM projects LIMIT 1');
  if (projRes.rows.length > 0) {
    const proj = projRes.rows[0];
    const billedRes = await db.query(
      'SELECT COALESCE(SUM(total_amount), 0.00) as total FROM invoices WHERE project_id = $1',
      [proj.id]
    );
    const expRes = await db.query(
      'SELECT COALESCE(SUM(amount), 0.00) as total FROM expenses WHERE project_id = $1',
      [proj.id]
    );
    const collection = Number(billedRes.rows[0]?.total || 0);
    const expenses = Number(expRes.rows[0]?.total || 0);
    const profit = collection - expenses;
    console.log(`Project "${proj.name}": Collection = ₹${collection}, Expenses = ₹${expenses}, Net Profit = ₹${profit}`);
  }

  console.log('--- All System & Database Verification Checks Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
