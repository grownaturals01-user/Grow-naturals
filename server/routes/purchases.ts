import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/purchases
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { status, payment_status, supplier_id, search } = req.query;

    const db = await getDb();
    let query = `
      SELECT po.*,
             s.name as supplier_name,
             s.phone as supplier_phone,
             (po.total_amount - po.paid_amount) as outstanding_due,
             (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.po_id = po.id) as item_count
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.business_id = $1
    `;
    const params: any[] = [businessId];
    let paramIndex = 2;

    if (status) {
      query += ` AND po.status = $${paramIndex++}`;
      params.push(status);
    }

    if (payment_status) {
      query += ` AND po.payment_status = $${paramIndex++}`;
      params.push(payment_status);
    }

    if (supplier_id) {
      query += ` AND po.supplier_id = $${paramIndex++}`;
      params.push(supplier_id);
    }

    if (search) {
      query += ` AND (po.po_number ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex} OR po.supplier_invoice_no ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY po.order_date DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/purchases/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const poRes = await db.query(
      `SELECT po.*,
              s.name as supplier_name,
              s.contact_person,
              s.phone as supplier_phone,
              s.email as supplier_email,
              s.address as supplier_address,
              s.gstin as supplier_gstin,
              (po.total_amount - po.paid_amount) as outstanding_due,
              b.name as business_name
       FROM purchase_orders po
       JOIN suppliers s ON po.supplier_id = s.id
       JOIN businesses b ON po.business_id = b.id
       WHERE po.id = $1`,
      [req.params.id]
    );

    if (poRes.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const po = poRes.rows[0];
    const itemsRes = await db.query(
      `SELECT * FROM purchase_order_items WHERE po_id = $1 ORDER BY id ASC`,
      [po.id]
    );

    res.json({
      ...po,
      items: itemsRes.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/purchases
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const { supplier_id, supplier_invoice_no, order_date, delivery_date, items, tax_amount, paid_amount, notes, auto_receive } = req.body;

    if (!supplier_id) {
      return res.status(400).json({ error: 'Supplier is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const db = await getDb();
    const countRes = await db.query(`SELECT COUNT(*) as count FROM purchase_orders WHERE business_id = $1`, [businessId]);
    const prefix = businessId === 'grow-naturals' ? 'PO-GN-' : 'PO-NN-';
    const poNumber = `${prefix}${1001 + Number(countRes.rows[0]?.count || 0)}`;
    const poId = `po-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    let subtotal = 0;
    const processedItems: any[] = [];
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const lineTotal = qty * price;
      subtotal += lineTotal;

      processedItems.push({
        id: `poitem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        po_id: poId,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: qty,
        unit_price: price,
        total: lineTotal
      });
    }

    const tax = Number(tax_amount) || 0;
    const totalAmount = subtotal + tax;
    const paid = Number(paid_amount) || 0;
    const paymentStatus = paid >= totalAmount ? 'paid' : (paid > 0 ? 'partial' : 'due');
    const initialStatus = auto_receive ? 'received' : 'pending';

    await db.query(
      `INSERT INTO purchase_orders (
        id, business_id, po_number, supplier_id, supplier_invoice_no, order_date,
        delivery_date, status, subtotal, tax_amount, total_amount, payment_status,
        paid_amount, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        poId,
        businessId,
        poNumber,
        supplier_id,
        supplier_invoice_no || '',
        order_date || new Date().toISOString().split('T')[0],
        delivery_date || null,
        initialStatus,
        subtotal,
        tax,
        totalAmount,
        paymentStatus,
        paid,
        notes || ''
      ]
    );

    for (const item of processedItems) {
      await db.query(
        `INSERT INTO purchase_order_items (id, po_id, product_id, product_name, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [item.id, item.po_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.total]
      );

      // If auto_receive is set, immediately increase stock and log movement
      if (auto_receive && item.product_id) {
        const prodRes = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [item.product_id]);
        if (prodRes.rows.length > 0) {
          const oldStock = prodRes.rows[0].stock_quantity;
          const newStock = oldStock + item.quantity;
          await db.query(`UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newStock, item.product_id]);
          await db.query(
            `INSERT INTO stock_movements (id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity, reference_type, reference_id, notes)
             VALUES ($1, $2, $3, 'purchase', $4, $5, $6, 'po', $7, $8)`,
            [`sm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`, businessId, item.product_id, item.quantity, oldStock, newStock, poNumber, `Stock Received via PO #${poNumber}`]
          );
        }
      }
    }

    res.status(201).json({ id: poId, po_number: poNumber, total_amount: totalAmount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/purchases/:id/status - Update order status (auto-increments stock on 'received')
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'received', 'pending', 'cancelled'

    const db = await getDb();
    const poRes = await db.query(`SELECT * FROM purchase_orders WHERE id = $1`, [id]);
    if (poRes.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const po = poRes.rows[0];
    const previousStatus = po.status;

    await db.query(`UPDATE purchase_orders SET status = $1 WHERE id = $2`, [status, id]);

    // If changing from pending to received, automatically increase stock!
    if (previousStatus !== 'received' && status === 'received') {
      const itemsRes = await db.query(`SELECT * FROM purchase_order_items WHERE po_id = $1`, [id]);
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          const prodRes = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [item.product_id]);
          if (prodRes.rows.length > 0) {
            const oldStock = prodRes.rows[0].stock_quantity;
            const newStock = oldStock + item.quantity;
            await db.query(`UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newStock, item.product_id]);
            await db.query(
              `INSERT INTO stock_movements (id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity, reference_type, reference_id, notes)
               VALUES ($1, $2, $3, 'purchase', $4, $5, $6, 'po', $7, $8)`,
              [`sm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`, po.business_id, item.product_id, item.quantity, oldStock, newStock, po.po_number, `Stock Received via PO #${po.po_number}`]
            );
          }
        }
      }
    }

    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/purchases/:id/payment - Update supplier payment status & paid amount
router.put('/:id/payment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paid_amount } = req.body;

    const db = await getDb();
    const poRes = await db.query(`SELECT total_amount FROM purchase_orders WHERE id = $1`, [id]);
    if (poRes.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const total = Number(poRes.rows[0].total_amount);
    const paid = Number(paid_amount) || 0;
    const paymentStatus = paid >= total ? 'paid' : (paid > 0 ? 'partial' : 'due');

    await db.query(
      `UPDATE purchase_orders SET paid_amount = $1, payment_status = $2 WHERE id = $3`,
      [paid, paymentStatus, id]
    );

    res.json({ success: true, paid_amount: paid, payment_status: paymentStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
