import { getDb, initDb } from '../server/db/connection.js';

async function main() {
  try {
    await initDb();
    const db = await getDb();
    const cols = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'delivery_challans'
    `);
    console.log('Columns in delivery_challans:', cols.rows);

    const itemCols = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'challan_items'
    `);
    console.log('Columns in challan_items:', itemCols.rows);

    const existingDcs = await db.query('SELECT * FROM delivery_challans');
    console.log('Existing delivery challans count:', existingDcs.rows.length, existingDcs.rows);

  } catch (err) {
    console.error('Test DB error:', err);
  } finally {
    process.exit(0);
  }
}

main();
