import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/quotations
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { status, search } = req.query;

    const db = await getDb();
    let query = `
      SELECT q.*, (SELECT COUNT(*) FROM quotation_items qi WHERE qi.quotation_id = q.id) as item_count
      FROM quotations q
      WHERE q.business_id = $1
    `;
    const params: any[] = [businessId];
    let paramIndex = 2;

    if (status) {
      query += ` AND q.status = $${paramIndex++}`;
      params.push(status);
    }

    if (search) {
      query += ` AND (q.quotation_number ILIKE $${paramIndex} OR q.customer_name ILIKE $${paramIndex} OR q.customer_phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY q.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quotations/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const qRes = await db.query(
      `SELECT q.*, b.name as business_name, b.legal_name, b.gstin as business_gstin, b.address as business_address, b.phone as business_phone, b.invoice_footer
       FROM quotations q
       LEFT JOIN businesses b ON q.business_id = b.id
       WHERE q.id = $1`,
      [req.params.id]
    );

    if (qRes.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = qRes.rows[0];
    const itemsRes = await db.query(
      `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC`,
      [quotation.id]
    );

    res.json({
      ...quotation,
      items: itemsRes.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotations
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const { customer_id, customer_name, customer_phone, valid_until, items, discount, notes } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const db = await getDb();
    const countRes = await db.query(`SELECT COUNT(*) as count FROM quotations WHERE business_id = $1`, [businessId]);
    const prefix = businessId === 'grow-naturals' ? 'QT-GN-' : 'QT-NN-';
    const quoteNumber = `${prefix}${1001 + Number(countRes.rows[0]?.count || 0)}`;
    const quoteId = `quote-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    let subtotal = 0;
    let taxAmount = 0;
    const isTaxable = businessId === 'grow-naturals';

    const processedItems: any[] = [];
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const lineSubtotal = qty * price;
      const gstRate = isTaxable ? (Number(item.gst_rate) || 0) : 0.00;
      const lineTax = isTaxable ? Number(((lineSubtotal * gstRate) / 100).toFixed(2)) : 0.00;
      const lineTotal = Number((lineSubtotal + lineTax).toFixed(2));

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      processedItems.push({
        id: `qitem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        quotation_id: quoteId,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: qty,
        unit_price: price,
        gst_rate: gstRate,
        total: lineTotal
      });
    }

    const disc = Number(discount) || 0;
    const totalAmount = Math.max(0, Number((subtotal + taxAmount - disc).toFixed(2)));

    await db.query(
      `INSERT INTO quotations (
        id, business_id, quotation_number, customer_id, customer_name, customer_phone,
        valid_until, subtotal, discount, tax_amount, total_amount, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12)`,
      [
        quoteId,
        businessId,
        quoteNumber,
        customer_id || null,
        customer_name,
        customer_phone || '',
        valid_until || null,
        subtotal,
        disc,
        taxAmount,
        totalAmount,
        notes || ''
      ]
    );

    for (const item of processedItems) {
      await db.query(
        `INSERT INTO quotation_items (id, quotation_id, product_id, product_name, quantity, unit_price, gst_rate, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, item.quotation_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.gst_rate, item.total]
      );
    }

    res.status(201).json({ id: quoteId, quotation_number: quoteNumber, total_amount: totalAmount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/quotations/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    // Check if quotation is locked
    const existing = await db.query(`SELECT status FROM quotations WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (existing.rows[0].status === 'converted_to_dc' || existing.rows[0].status === 'converted_to_invoice') {
      return res.status(400).json({ error: 'This quotation has already been converted and is locked from editing.' });
    }

    const { customer_name, customer_phone, valid_until, status, notes } = req.body;
    await db.query(
      `UPDATE quotations SET
        customer_name = COALESCE($1, customer_name),
        customer_phone = COALESCE($2, customer_phone),
        valid_until = COALESCE($3, valid_until),
        status = COALESCE($4, status),
        notes = COALESCE($5, notes)
       WHERE id = $6`,
      [customer_name, customer_phone, valid_until, status, notes, id]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quotations/:id/convert (Convert to Delivery Challan or Invoice)
router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_type } = req.body; // 'invoice' or 'delivery_challan'

    if (target_type !== 'invoice' && target_type !== 'delivery_challan') {
      return res.status(400).json({ error: 'target_type must be either "invoice" or "delivery_challan"' });
    }

    const db = await getDb();
    const qRes = await db.query(`SELECT * FROM quotations WHERE id = $1`, [id]);
    if (qRes.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = qRes.rows[0];
    if (quotation.status === 'converted_to_dc' || quotation.status === 'converted_to_invoice') {
      return res.status(400).json({ error: 'This quotation has already been converted.' });
    }

    const itemsRes = await db.query(`SELECT * FROM quotation_items WHERE quotation_id = $1`, [id]);
    const items = itemsRes.rows;

    let convertedId = '';
    let convertedNumber = '';

    if (target_type === 'invoice') {
      const bizRes = await db.query(`SELECT invoice_prefix FROM businesses WHERE id = $1`, [quotation.business_id]);
      const prefix = bizRes.rows[0]?.invoice_prefix || (quotation.business_id === 'grow-naturals' ? 'GN-' : 'NN-');
      const countRes = await db.query(`SELECT COUNT(*) as count FROM invoices WHERE business_id = $1`, [quotation.business_id]);
      convertedNumber = `${prefix}${1001 + Number(countRes.rows[0]?.count || 0)}`;
      convertedId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      const isTaxable = quotation.business_id === 'grow-naturals';
      const cgst = isTaxable ? Number((quotation.tax_amount / 2).toFixed(2)) : 0;
      const sgst = isTaxable ? Number((quotation.tax_amount / 2).toFixed(2)) : 0;

      await db.query(
        `INSERT INTO invoices (
          id, business_id, invoice_number, customer_id, customer_name, customer_phone,
          subtotal, discount_amount, tax_amount, cgst_amount, sgst_amount, total_amount,
          payment_method, payment_status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'credit', 'pending', $13)`,
        [
          convertedId,
          quotation.business_id,
          convertedNumber,
          quotation.customer_id,
          quotation.customer_name,
          quotation.customer_phone,
          quotation.subtotal,
          quotation.discount,
          quotation.tax_amount,
          cgst,
          sgst,
          quotation.total_amount,
          `Converted from Quotation #${quotation.quotation_number}`
        ]
      );

      for (const item of items) {
        await db.query(
          `INSERT INTO invoice_items (id, invoice_id, product_id, product_name, quantity, unit_price, gst_rate, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            `inv-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            convertedId,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.gst_rate,
            item.total
          ]
        );
      }

      await db.query(
        `UPDATE quotations SET status = 'converted_to_invoice', converted_id = $1 WHERE id = $2`,
        [convertedId, id]
      );
    } else {
      // Delivery Challan
      const countRes = await db.query(`SELECT COUNT(*) as count FROM delivery_challans WHERE business_id = $1`, [quotation.business_id]);
      const prefix = quotation.business_id === 'grow-naturals' ? 'DC-GN-' : 'DC-NN-';
      convertedNumber = `${prefix}${1001 + Number(countRes.rows[0]?.count || 0)}`;
      convertedId = `dc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      await db.query(
        `INSERT INTO delivery_challans (
          id, business_id, challan_number, customer_id, customer_name, quotation_id, dispatch_date, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, 'dispatched', $7)`,
        [
          convertedId,
          quotation.business_id,
          convertedNumber,
          quotation.customer_id,
          quotation.customer_name,
          id,
          `Generated from Quotation #${quotation.quotation_number}`
        ]
      );

      for (const item of items) {
        await db.query(
          `INSERT INTO challan_items (id, challan_id, product_id, product_name, quantity, unit)
           VALUES ($1, $2, $3, $4, $5, 'Nos')`,
          [
            `dc-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            convertedId,
            item.product_id,
            item.product_name,
            item.quantity
          ]
        );
      }

      await db.query(
        `UPDATE quotations SET status = 'converted_to_dc', converted_id = $1 WHERE id = $2`,
        [convertedId, id]
      );
    }

    res.json({
      success: true,
      converted_type: target_type,
      converted_id: convertedId,
      converted_number: convertedNumber
    });
  } catch (error: any) {
    console.error('Convert quotation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
