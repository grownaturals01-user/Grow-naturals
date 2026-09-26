import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/refunds
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { search } = req.query;

    const db = await getDb();
    let query = `
      SELECT r.*,
             b.name as business_name,
             i.invoice_number,
             u.name as cashier_name,
             (SELECT COUNT(*) FROM refund_items ri WHERE ri.refund_id = r.id) as item_count
      FROM refunds r
      LEFT JOIN businesses b ON r.business_id = b.id
      JOIN invoices i ON r.invoice_id = i.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE ($1 = 'all' OR $1 = 'combined' OR r.business_id = $1)
    `;
    const params: any[] = [businessId];

    if (search) {
      query += ` AND (r.refund_number ILIKE $2 OR i.invoice_number ILIKE $2 OR r.customer_name ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/refunds/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const refRes = await db.query(
      `SELECT r.*,
              i.invoice_number,
              i.payment_method as original_payment_method,
              u.name as cashier_name
       FROM refunds r
       JOIN invoices i ON r.invoice_id = i.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (refRes.rows.length === 0) {
      return res.status(404).json({ error: 'Refund record not found' });
    }

    const refund = refRes.rows[0];
    const items = await db.query(
      `SELECT * FROM refund_items WHERE refund_id = $1 ORDER BY id ASC`,
      [refund.id]
    );

    res.json({
      ...refund,
      items: items.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/refunds (Strictly against an existing invoice, auto-restocks items)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { invoice_id, items, reason, refund_method, created_by } = req.body;

    if (!invoice_id) {
      return res.status(400).json({ error: 'Refunds must be processed against an existing invoice. Standalone refunds are not allowed.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item to refund is required.' });
    }

    const db = await getDb();

    // Verify invoice exists
    const invRes = await db.query(
      `SELECT id, business_id, invoice_number, customer_id, customer_name, payment_method, total_amount
       FROM invoices WHERE id = $1 OR invoice_number = $1`,
      [invoice_id]
    );

    if (invRes.rows.length === 0) {
      return res.status(404).json({ error: 'Target invoice not found.' });
    }

    const invoice = invRes.rows[0];
    const businessId = invoice.business_id;

    // Generate refund number
    const countRes = await db.query(`SELECT COUNT(*) as count FROM refunds WHERE business_id = $1`, [businessId]);
    const prefix = businessId === 'grow-naturals' ? 'RF-GN-' : 'RF-NN-';
    const refundNumber = `${prefix}${1001 + Number(countRes.rows[0]?.count || 0)}`;
    const refundId = `ref-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    let totalRefundAmount = 0;
    const processedItems: any[] = [];

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || 0;
      const taxRefund = Number(item.tax_refund) || 0;
      const lineTotal = (qty * unitPrice) + taxRefund;

      totalRefundAmount += lineTotal;

      processedItems.push({
        id: `ref-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        refund_id: refundId,
        product_id: item.product_id || null,
        product_name: item.product_name || 'Refunded Item',
        quantity: qty,
        unit_price: unitPrice,
        tax_refund: taxRefund,
        total: lineTotal
      });
    }

    // Insert refund record
    await db.query(
      `INSERT INTO refunds (
        id, business_id, invoice_id, refund_number, customer_id, customer_name,
        total_refund_amount, refund_method, reason, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        refundId,
        businessId,
        invoice.id,
        refundNumber,
        invoice.customer_id,
        invoice.customer_name,
        totalRefundAmount,
        refund_method || invoice.payment_method || 'cash',
        reason || 'Customer returned items',
        created_by || null
      ]
    );

    // Insert items & AUTOMATICALLY RESTOCK INVENTORY
    for (const item of processedItems) {
      await db.query(
        `INSERT INTO refund_items (id, refund_id, product_id, product_name, quantity, unit_price, tax_refund, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, item.refund_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.tax_refund, item.total]
      );

      // Auto-restock product stock
      if (item.product_id) {
        const prodRes = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [item.product_id]);
        if (prodRes.rows.length > 0) {
          const oldStock = prodRes.rows[0].stock_quantity;
          const newStock = oldStock + item.quantity;

          await db.query(
            `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newStock, item.product_id]
          );

          await db.query(
            `INSERT INTO stock_movements (
              id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity,
              reference_type, reference_id, notes, user_id
            ) VALUES ($1, $2, $3, 'refund', $4, $5, $6, 'refund', $7, $8, $9)`,
            [
              `sm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
              businessId,
              item.product_id,
              item.quantity,
              oldStock,
              newStock,
              refundNumber,
              `Restocked via Refund #${refundNumber} against Invoice #${invoice.invoice_number}`,
              created_by || null
            ]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      refund_id: refundId,
      refund_number: refundNumber,
      total_refund_amount: totalRefundAmount
    });
  } catch (error: any) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
