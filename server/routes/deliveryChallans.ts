import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/delivery-challans
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { status, payment_status, customer, search, project_id } = req.query;

    const db = await getDb();
    let query = `
      SELECT dc.*, 
             p.name as project_name,
             (SELECT COUNT(*) FROM challan_items ci WHERE ci.challan_id = dc.id) as item_count
      FROM delivery_challans dc
      LEFT JOIN projects p ON dc.project_id = p.id
      WHERE dc.business_id = $1
    `;
    const params: any[] = [businessId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND dc.status = $${paramIndex++}`;
      params.push(status);
    }

    if (payment_status && payment_status !== 'all') {
      query += ` AND dc.payment_status = $${paramIndex++}`;
      params.push(payment_status);
    }

    if (customer) {
      query += ` AND dc.customer_name ILIKE $${paramIndex++}`;
      params.push(`%${customer}%`);
    }

    if (project_id) {
      query += ` AND dc.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    if (search) {
      query += ` AND (dc.challan_number ILIKE $${paramIndex} OR dc.customer_name ILIKE $${paramIndex} OR dc.vehicle_no ILIKE $${paramIndex} OR dc.customer_phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY dc.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/delivery-challans/customers-summary
// Groups delivery challans by customer with total due, total dispatched, and all linked challans
router.get('/customers-summary', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { search } = req.query;

    const db = await getDb();
    
    // Fetch all challans for this business
    let query = `
      SELECT dc.*, 
             p.name as project_name,
             (SELECT COUNT(*) FROM challan_items ci WHERE ci.challan_id = dc.id) as item_count
      FROM delivery_challans dc
      LEFT JOIN projects p ON dc.project_id = p.id
      WHERE dc.business_id = $1
    `;
    const params: any[] = [businessId];
    if (search) {
      query += ` AND (dc.customer_name ILIKE $2 OR dc.customer_phone ILIKE $2 OR dc.challan_number ILIKE $2)`;
      params.push(`%${search}%`);
    }
    query += ` ORDER BY dc.created_at DESC`;

    const result = await db.query(query, params);
    const rows = result.rows;

    // Group rows by customer_name
    const customerMap: Record<string, any> = {};

    for (const dc of rows) {
      const cKey = (dc.customer_name || 'Walk-in Customer').trim();
      if (!customerMap[cKey]) {
        customerMap[cKey] = {
          customer_id: dc.customer_id || null,
          customer_name: cKey,
          customer_phone: dc.customer_phone || '',
          challan_count: 0,
          unpaid_challan_count: 0,
          total_dispatched_amount: 0,
          total_paid_amount: 0,
          total_due_balance: 0,
          latest_dispatch_date: dc.dispatch_date,
          challans: []
        };
      }

      const total = Number(dc.total_amount) || 0;
      const paid = Number(dc.paid_amount) || 0;
      const due = Number(dc.due_amount) || Math.max(0, total - paid);

      customerMap[cKey].challan_count += 1;
      if (due > 0) {
        customerMap[cKey].unpaid_challan_count += 1;
      }
      customerMap[cKey].total_dispatched_amount += total;
      customerMap[cKey].total_paid_amount += paid;
      customerMap[cKey].total_due_balance += due;
      customerMap[cKey].challans.push(dc);
    }

    const summaries = Object.values(customerMap).sort((a: any, b: any) => b.total_due_balance - a.total_due_balance);
    res.json(summaries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/delivery-challans/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const dcRes = await db.query(
      `SELECT dc.*, 
              p.name as project_name,
              b.name as business_name,
              b.legal_name,
              b.gstin as business_gstin,
              b.address as business_address,
              b.phone as business_phone,
              b.invoice_footer
       FROM delivery_challans dc
       LEFT JOIN projects p ON dc.project_id = p.id
       LEFT JOIN businesses b ON dc.business_id = b.id
       WHERE dc.id = $1`,
      [req.params.id]
    );

    if (dcRes.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery Challan not found' });
    }

    const challan = dcRes.rows[0];
    const itemsRes = await db.query(
      `SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id ASC`,
      [challan.id]
    );

    res.json({
      ...challan,
      items: itemsRes.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/delivery-challans
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const {
      customer_id,
      customer_name,
      customer_phone,
      project_id,
      quotation_id,
      dispatch_date,
      vehicle_no,
      driver_name,
      notes,
      paid_amount = 0,
      payment_method = '',
      items
    } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Calculate total amount from items
    let totalAmount = 0;
    const computedItems = items.map((it) => {
      const qty = Number(it.quantity) || 1;
      const unitPrice = Number(it.unit_price) || 0;
      const total = Number(it.total) || qty * unitPrice;
      totalAmount += total;
      return {
        ...it,
        quantity: qty,
        unit_price: unitPrice,
        total: total,
      };
    });

    const initialPaid = Number(paid_amount) || 0;
    const dueAmount = Math.max(0, totalAmount - initialPaid);
    let paymentStatus = 'unpaid';
    if (dueAmount <= 0 && totalAmount > 0) {
      paymentStatus = 'paid';
    } else if (initialPaid > 0) {
      paymentStatus = 'partially_paid';
    }

    const db = await getDb();
    const countRes = await db.query(`SELECT COUNT(*) as count FROM delivery_challans WHERE business_id = $1`, [businessId]);
    const prefix = businessId === 'grow-naturals' ? 'DC-GN-' : 'DC-NN-';
    let nextNum = 1001 + Number(countRes.rows[0]?.count || 0);
    let challanNumber = `${prefix}${nextNum}`;
    let exists = await db.query(`SELECT 1 FROM delivery_challans WHERE challan_number = $1`, [challanNumber]);
    while (exists.rows.length > 0) {
      nextNum++;
      challanNumber = `${prefix}${nextNum}`;
      exists = await db.query(`SELECT 1 FROM delivery_challans WHERE challan_number = $1`, [challanNumber]);
    }

    const challanId = `dc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Verify foreign keys to avoid constraint violations
    let validCustomerId: string | null = null;
    if (customer_id) {
      const custCheck = await db.query(`SELECT 1 FROM customers WHERE id = $1`, [customer_id]);
      if (custCheck.rows.length > 0) {
        validCustomerId = customer_id;
      }
    }

    let validProjectId: string | null = null;
    if (project_id) {
      const projCheck = await db.query(`SELECT 1 FROM projects WHERE id = $1`, [project_id]);
      if (projCheck.rows.length > 0) {
        validProjectId = project_id;
      }
    }

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
        validCustomerId,
        customer_name.trim(),
        customer_phone ? customer_phone.trim() : '',
        validProjectId,
        quotation_id || null,
        dispatch_date || new Date().toISOString().split('T')[0],
        vehicle_no || '',
        driver_name || '',
        totalAmount,
        initialPaid,
        dueAmount,
        paymentStatus,
        initialPaid > 0 ? (payment_method || 'cash') : '',
        initialPaid > 0 ? new Date().toISOString() : null,
        notes || ''
      ]
    );

    for (const item of computedItems) {
      let validProductId: string | null = null;
      if (item.product_id) {
        const prodCheck = await db.query(`SELECT 1 FROM products WHERE id = $1`, [item.product_id]);
        if (prodCheck.rows.length > 0) {
          validProductId = item.product_id;
        }
      }

      await db.query(
        `INSERT INTO challan_items (id, challan_id, product_id, product_name, quantity, unit, unit_price, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          `dc-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          challanId,
          validProductId,
          item.product_name,
          item.quantity,
          item.unit || 'Nos',
          item.unit_price,
          item.total
        ]
      );
    }

    res.status(201).json({
      id: challanId,
      challan_number: challanNumber,
      total_amount: totalAmount,
      due_amount: dueAmount,
      payment_status: paymentStatus
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/delivery-challans/:id/status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'dispatched', 'delivered'

    const db = await getDb();
    await db.query(
      `UPDATE delivery_challans SET status = $1 WHERE id = $2`,
      [status || 'delivered', id]
    );

    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/delivery-challans/:id/payments - Record Payment / Clear Due
router.post('/:id/payments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, payment_method = 'cash', notes = '', create_invoice = false } = req.body;

    const paymentVal = Number(amount);
    if (!paymentVal || paymentVal <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const db = await getDb();
    const dcRes = await db.query(`SELECT * FROM delivery_challans WHERE id = $1`, [id]);
    if (dcRes.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery challan not found' });
    }

    const challan = dcRes.rows[0];
    const currentTotal = Number(challan.total_amount) || 0;
    const currentPaid = Number(challan.paid_amount) || 0;
    const newPaid = currentPaid + paymentVal;
    const newDue = Math.max(0, currentTotal - newPaid);
    const newStatus = newDue <= 0 ? 'paid' : 'partially_paid';

    await db.query(
      `UPDATE delivery_challans 
       SET paid_amount = $1, 
           due_amount = $2, 
           payment_status = $3, 
           payment_method = $4, 
           payment_date = CURRENT_TIMESTAMP, 
           payment_notes = $5
       WHERE id = $6`,
      [newPaid, newDue, newStatus, payment_method, notes, id]
    );

    let createdInvoiceId = null;
    if (create_invoice) {
      // Create formal invoice record
      const countRes = await db.query(`SELECT COUNT(*) as count FROM invoices WHERE business_id = $1`, [challan.business_id]);
      const prefix = challan.business_id === 'grow-naturals' ? 'INV-GN-' : 'INV-NN-';
      const invNumber = `${prefix}${1001 + Number(countRes.rows[0]?.count || 0)}`;
      createdInvoiceId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      await db.query(
        `INSERT INTO invoices (
          id, business_id, invoice_number, customer_id, customer_name, customer_phone,
          project_id, subtotal, discount_amount, tax_amount, total_amount, payment_method, payment_status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10, 'paid', $11)`,
        [
          createdInvoiceId,
          challan.business_id,
          invNumber,
          challan.customer_id,
          challan.customer_name,
          challan.customer_phone || '',
          challan.project_id,
          currentTotal,
          currentTotal,
          payment_method,
          `Generated from Delivery Challan ${challan.challan_number}. ${notes}`
        ]
      );

      // Copy challan items to invoice items
      const itemsRes = await db.query(`SELECT * FROM challan_items WHERE challan_id = $1`, [id]);
      for (const item of itemsRes.rows) {
        await db.query(
          `INSERT INTO invoice_items (
            id, invoice_id, product_id, product_name, quantity, unit_price, total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            `inv-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            createdInvoiceId,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.total
          ]
        );
      }

      await db.query(
        `UPDATE delivery_challans SET invoice_id = $1, payment_status = 'billed' WHERE id = $2`,
        [createdInvoiceId, id]
      );
    }

    res.json({
      success: true,
      paid_amount: newPaid,
      due_amount: newDue,
      payment_status: create_invoice ? 'billed' : newStatus,
      invoice_id: createdInvoiceId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/delivery-challans/bulk-payment - Settle due for multiple delivery challans of a customer
router.post('/bulk-payment', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { challan_ids, amount, payment_method = 'cash', notes = '', convert_to_invoice = false } = req.body;

    if (!challan_ids || !Array.isArray(challan_ids) || challan_ids.length === 0) {
      return res.status(400).json({ error: 'Please select at least one delivery challan' });
    }

    let remainingPayment = Number(amount) || 0;
    const db = await getDb();

    // Fetch the selected challans
    const placeholders = challan_ids.map((_, i) => `$${i + 1}`).join(',');
    const dcRes = await db.query(
      `SELECT * FROM delivery_challans WHERE id IN (${placeholders}) ORDER BY created_at ASC`,
      challan_ids
    );

    if (dcRes.rows.length === 0) {
      return res.status(404).json({ error: 'No delivery challans found' });
    }

    const firstDc = dcRes.rows[0];
    let totalSettled = 0;
    const allItemsToInvoice: any[] = [];

    for (const challan of dcRes.rows) {
      const total = Number(challan.total_amount) || 0;
      const currentPaid = Number(challan.paid_amount) || 0;
      const currentDue = Number(challan.due_amount) || Math.max(0, total - currentPaid);

      if (remainingPayment <= 0 && currentDue > 0) {
        continue;
      }

      const paymentForThisDc = Math.min(remainingPayment, currentDue);
      const newPaid = currentPaid + paymentForThisDc;
      const newDue = Math.max(0, total - newPaid);
      const newStatus = newDue <= 0 ? 'paid' : 'partially_paid';

      remainingPayment -= paymentForThisDc;
      totalSettled += paymentForThisDc;

      await db.query(
        `UPDATE delivery_challans 
         SET paid_amount = $1, 
             due_amount = $2, 
             payment_status = $3, 
             payment_method = $4, 
             payment_date = CURRENT_TIMESTAMP, 
             payment_notes = $5
         WHERE id = $6`,
        [newPaid, newDue, newStatus, payment_method, notes, challan.id]
      );

      // Collect items for consolidated invoice
      if (convert_to_invoice) {
        const itRes = await db.query(`SELECT * FROM challan_items WHERE challan_id = $1`, [challan.id]);
        allItemsToInvoice.push(...itRes.rows);
      }
    }

    let createdInvoiceId = null;
    if (convert_to_invoice && allItemsToInvoice.length > 0) {
      const countRes = await db.query(`SELECT COUNT(*) as count FROM invoices WHERE business_id = $1`, [businessId]);
      const prefix = businessId === 'grow-naturals' ? 'INV-GN-' : 'INV-NN-';
      const invNumber = `${prefix}${1001 + Number(countRes.rows[0]?.count || 0)}`;
      createdInvoiceId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      let subtotal = 0;
      allItemsToInvoice.forEach(it => { subtotal += Number(it.total) || (Number(it.quantity) * Number(it.unit_price)); });

      await db.query(
        `INSERT INTO invoices (
          id, business_id, invoice_number, customer_id, customer_name, customer_phone,
          project_id, subtotal, discount_amount, tax_amount, total_amount, payment_method, payment_status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10, 'paid', $11)`,
        [
          createdInvoiceId,
          businessId,
          invNumber,
          firstDc.customer_id,
          firstDc.customer_name,
          firstDc.customer_phone || '',
          firstDc.project_id,
          subtotal,
          subtotal,
          payment_method,
          `Consolidated Invoice for Challans: ${dcRes.rows.map(d => d.challan_number).join(', ')}. ${notes}`
        ]
      );

      for (const item of allItemsToInvoice) {
        await db.query(
          `INSERT INTO invoice_items (
            id, invoice_id, product_id, product_name, quantity, unit_price, total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            `inv-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            createdInvoiceId,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_price || 0,
            item.total || 0
          ]
        );
      }

      // Mark all these challans as billed
      const updatePlaceholders = challan_ids.map((_, i) => `$${i + 2}`).join(',');
      await db.query(
        `UPDATE delivery_challans SET invoice_id = $1, payment_status = 'billed' WHERE id IN (${updatePlaceholders})`,
        [createdInvoiceId, ...challan_ids]
      );
    }

    res.json({
      success: true,
      total_settled: totalSettled,
      invoice_id: createdInvoiceId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
