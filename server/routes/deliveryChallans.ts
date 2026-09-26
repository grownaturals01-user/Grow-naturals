import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/delivery-challans
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { status, payment_status, approval_status, customer, search, project_id } = req.query;

    const db = await getDb();
    let query = `
      SELECT dc.*, 
             b.name as business_name,
             p.name as project_name,
             (SELECT COUNT(*) FROM challan_items ci WHERE ci.challan_id = dc.id) as item_count
      FROM delivery_challans dc
      LEFT JOIN businesses b ON dc.business_id = b.id
      LEFT JOIN projects p ON dc.project_id = p.id
      WHERE ($1 = 'all' OR $1 = 'combined' OR dc.business_id = $1)
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

    if (approval_status && approval_status !== 'all') {
      query += ` AND dc.approval_status = $${paramIndex++}`;
      params.push(approval_status);
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

// GET /api/delivery-challans/due-reminders
router.get('/due-reminders', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();

    const query = `
      SELECT dc.*, 
             p.name as project_name,
             (SELECT COUNT(*) FROM challan_items ci WHERE ci.challan_id = dc.id) as item_count
      FROM delivery_challans dc
      LEFT JOIN projects p ON dc.project_id = p.id
      WHERE dc.business_id = $1 
        AND dc.payment_status != 'paid'
        AND dc.due_amount > 0
        AND dc.due_date IS NOT NULL
      ORDER BY dc.due_date ASC
    `;

    const result = await db.query(query, [businessId]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows = result.rows.map((row: any) => {
      const dDate = new Date(row.due_date);
      dDate.setHours(0, 0, 0, 0);
      const diffTime = dDate.getTime() - today.getTime();
      const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let reminderCategory = 'upcoming';
      if (daysUntilDue < 0) {
        reminderCategory = 'overdue';
      } else if (daysUntilDue === 0) {
        reminderCategory = 'due_today';
      } else if (daysUntilDue <= 3) {
        reminderCategory = 'due_soon';
      }

      return {
        ...row,
        days_until_due: daysUntilDue,
        reminder_category: reminderCategory
      };
    });

    const overdue = rows.filter((r: any) => r.reminder_category === 'overdue');
    const dueToday = rows.filter((r: any) => r.reminder_category === 'due_today');
    const dueSoon = rows.filter((r: any) => r.reminder_category === 'due_soon');

    res.json({
      reminders: rows,
      summary: {
        total_pending: rows.length,
        overdue_count: overdue.length,
        due_today_count: dueToday.length,
        due_soon_count: dueSoon.length,
        total_due_amount: rows.reduce((s: number, r: any) => s + (Number(r.due_amount) || 0), 0)
      }
    });
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

// PUT /api/delivery-challans/:id/due-date
router.put('/:id/due-date', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { due_date, reminder_notes } = req.body;
    const db = await getDb();

    await db.query(
      `UPDATE delivery_challans 
       SET due_date = $1, reminder_notes = COALESCE($2, reminder_notes)
       WHERE id = $3`,
      [due_date || null, reminder_notes || '', id]
    );

    const updated = await db.query(`SELECT * FROM delivery_challans WHERE id = $1`, [id]);
    res.json(updated.rows[0]);
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
      items,
      due_date,
      reminder_notes
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

    // Check Customer Credit Limit
    let customerCreditLimit = 0;
    let customerCurrentDues = 0;

    if (validCustomerId) {
      const custRes = await db.query(`SELECT credit_limit FROM customers WHERE id = $1`, [validCustomerId]);
      if (custRes.rows.length > 0) {
        customerCreditLimit = Number(custRes.rows[0].credit_limit) || 0;
      }
    } else if (customer_name) {
      const custRes = await db.query(`SELECT credit_limit FROM customers WHERE name ILIKE $1`, [customer_name.trim()]);
      if (custRes.rows.length > 0) {
        customerCreditLimit = Number(custRes.rows[0].credit_limit) || 0;
      }
    }

    // Calculate customer's existing unpaid balance from previous Delivery Challans
    const duesRes = await db.query(
      `SELECT COALESCE(SUM(due_amount), 0) as total_dues 
       FROM delivery_challans 
       WHERE business_id = $1 
         AND payment_status != 'paid' 
         AND (customer_id = $2 OR customer_name ILIKE $3)`,
      [businessId, validCustomerId || 'non-existent-id', customer_name.trim()]
    );
    customerCurrentDues = Number(duesRes.rows[0]?.total_dues) || 0;

    let approvalStatus = 'approved';
    let approvalReason = '';
    let creditExceededAmount = 0;

    if (customerCreditLimit > 0) {
      const projectedTotalDue = customerCurrentDues + dueAmount;
      if (projectedTotalDue > customerCreditLimit) {
        approvalStatus = 'pending_approval';
        creditExceededAmount = projectedTotalDue - customerCreditLimit;
        approvalReason = `Credit limit of ₹${customerCreditLimit.toFixed(2)} exceeded by ₹${creditExceededAmount.toFixed(2)} (Current dues: ₹${customerCurrentDues.toFixed(2)} + New DC due: ₹${dueAmount.toFixed(2)} = ₹${projectedTotalDue.toFixed(2)})`;
      }
    }

    await db.query(
      `INSERT INTO delivery_challans (
        id, business_id, challan_number, customer_id, customer_name, customer_phone, project_id,
        quotation_id, dispatch_date, vehicle_no, driver_name, status,
        total_amount, paid_amount, due_amount, payment_status, payment_method,
        payment_date, notes,
        approval_status, approval_reason, credit_limit_at_creation, credit_exceeded_amount,
        due_date, reminder_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'dispatched', $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
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
        notes || '',
        approvalStatus,
        approvalReason,
        customerCreditLimit,
        creditExceededAmount,
        due_date || (dueAmount > 0 ? new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0] : null),
        reminder_notes || ''
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
      payment_status: paymentStatus,
      approval_status: approvalStatus,
      approval_reason: approvalReason,
      credit_limit_at_creation: customerCreditLimit,
      credit_exceeded_amount: creditExceededAmount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/delivery-challans/:id/approve - Approve Credit Limit Exceeded DC
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approved_by = 'Manager' } = req.body;

    const db = await getDb();
    const dcRes = await db.query(`SELECT * FROM delivery_challans WHERE id = $1`, [id]);
    if (dcRes.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery challan not found' });
    }

    await db.query(
      `UPDATE delivery_challans 
       SET approval_status = 'approved',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [approved_by, id]
    );

    res.json({ success: true, message: 'Delivery Challan approved successfully', approval_status: 'approved' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/delivery-challans/:id/reject - Reject Credit Limit Exceeded DC
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'Credit limit exceeded override rejected', rejected_by = 'Manager' } = req.body;

    const db = await getDb();
    const dcRes = await db.query(`SELECT * FROM delivery_challans WHERE id = $1`, [id]);
    if (dcRes.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery challan not found' });
    }

    await db.query(
      `UPDATE delivery_challans 
       SET approval_status = 'rejected',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           approval_reason = $2
       WHERE id = $3`,
      [rejected_by, reason, id]
    );

    res.json({ success: true, message: 'Delivery Challan rejected', approval_status: 'rejected' });
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
    const dcCheck = await db.query(`SELECT approval_status FROM delivery_challans WHERE id = $1`, [id]);
    if (dcCheck.rows.length > 0 && dcCheck.rows[0].approval_status === 'pending_approval') {
      return res.status(400).json({ error: 'Cannot change status of Delivery Challan while credit limit approval is pending.' });
    }

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
    if (create_invoice && challan.approval_status === 'pending_approval') {
      return res.status(400).json({ error: 'Cannot convert Delivery Challan to Invoice while Credit Limit Approval is pending.' });
    }

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
