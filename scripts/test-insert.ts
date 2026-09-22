import { getDb, initDb } from '../server/db/connection.js';

async function testCreateDC() {
  try {
    await initDb();
    const db = await getDb();
    
    // Test creating a sample DC
    const businessId = 'grow-naturals';
    const customerName = 'Koushik';
    const customerPhone = '9876543210';
    const dispatchDate = '2026-09-20';
    const vehicleNo = 'TN 09 BH 0987';
    const driverName = 'Ramesh';
    const notes = 'Delivered at site';
    const items = [
      { product_id: null, product_name: 'Ficus Bonsai S-Shape (8")', quantity: 2, unit: 'Nos', unit_price: 1250, total: 2500 },
      { product_id: null, product_name: 'Red Terracotta Pot (10")', quantity: 2, unit: 'Nos', unit_price: 350, total: 700 }
    ];

    let totalAmount = 0;
    items.forEach(it => { totalAmount += it.total; });
    const initialPaid = 0;
    const dueAmount = totalAmount;
    const paymentStatus = 'unpaid';

    const countRes = await db.query(`SELECT COUNT(*) as count FROM delivery_challans WHERE business_id = $1`, [businessId]);
    const prefix = 'DC-GN-';
    const challanNumber = `${prefix}${1001 + Number(countRes.rows[0]?.count || 0)}`;
    const challanId = `dc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    console.log('Inserting challan:', challanId, challanNumber);

    await db.query(
      `INSERT INTO delivery_challans (
        id, business_id, challan_number, customer_id, customer_name, customer_phone, project_id,
        quotation_id, dispatch_date, vehicle_no, driver_name, status,
        total_amount, paid_amount, due_amount, payment_status, payment_method,
        payment_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'dispatched', $12, $13, $14, $15, $16, $17, $18)`,
      [
        challanId,
        businessId,
        challanNumber,
        null,
        customerName.trim(),
        customerPhone.trim(),
        null,
        null,
        dispatchDate,
        vehicleNo,
        driverName,
        totalAmount,
        initialPaid,
        dueAmount,
        paymentStatus,
        '',
        null,
        notes
      ]
    );

    console.log('Inserted delivery_challan successfully!');

    for (const item of items) {
      await db.query(
        `INSERT INTO challan_items (id, challan_id, product_id, product_name, quantity, unit, unit_price, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `dc-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          challanId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit,
          item.unit_price,
          item.total
        ]
      );
    }
    console.log('Inserted items successfully!');

    const allDcs = await db.query('SELECT * FROM delivery_challans WHERE business_id = $1', [businessId]);
    console.log('Current DB Challans for business:', allDcs.rows);

  } catch (err) {
    console.error('Create DC error:', err);
  } finally {
    process.exit(0);
  }
}

testCreateDC();
