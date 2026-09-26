import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/quotations
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { status, search } = req.query;

    const db = await getDb();
    let query = `
      SELECT q.*, 
        b.name as business_name,
        (SELECT COUNT(*) FROM quotation_items qi WHERE qi.quotation_id = q.id) as item_count,
        (SELECT COUNT(*) FROM quotations q_all 
         WHERE (q_all.customer_phone = q.customer_phone AND q.customer_phone != '') 
            OR (q_all.customer_name = q.customer_name AND q.customer_name != '')) as customer_total_quotes,
        (SELECT COUNT(*) FROM quotations q_conv 
         WHERE ((q_conv.customer_phone = q.customer_phone AND q.customer_phone != '') 
            OR (q_conv.customer_name = q.customer_name AND q.customer_name != ''))
           AND (q_conv.status = 'converted_to_invoice' OR (q_conv.converted_id IS NOT NULL AND q_conv.converted_id != ''))) as customer_converted_quotes
      FROM quotations q
      LEFT JOIN businesses b ON q.business_id = b.id
      WHERE ($1 = 'all' OR $1 = 'combined' OR q.business_id = $1)
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

// GET /api/quotations/customer-history - Customer Quotation Conversion Intelligence
router.get('/customer-history', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const phone = ((req.query.phone as string) || '').trim();
    const name = ((req.query.name as string) || '').trim();
    const gstin = ((req.query.gstin as string) || '').trim().toUpperCase();

    if (!phone && !name && !gstin) {
      return res.json({
        is_repeated: false,
        total_quotations: 0,
        converted_count: 0,
        conversion_rate: 0,
        total_quoted_amount: 0,
        total_converted_amount: 0,
        customer_tier: 'new',
        tier_label: 'New Customer',
        badge_variant: 'neutral',
        advice: 'No client phone or name provided yet.',
        recent_quotations: [],
        total_invoices_count: 0,
        total_invoice_revenue: 0
      });
    }

    const db = await getDb();
    const cleanPhoneDigits = phone.replace(/[^0-9]/g, '').slice(-10);

    // Build matching criteria
    const quoteConditions: string[] = [];
    const quoteParams: any[] = [];
    let pIdx = 1;

    if (cleanPhoneDigits.length >= 7) {
      quoteConditions.push(`q.customer_phone LIKE $${pIdx}`);
      quoteParams.push(`%${cleanPhoneDigits}%`);
      pIdx++;
    }

    if (gstin && gstin.length >= 5) {
      quoteConditions.push(`q.customer_gstin = $${pIdx}`);
      quoteParams.push(gstin);
      pIdx++;
    }

    if (name && name.length >= 3) {
      quoteConditions.push(`q.customer_name ILIKE $${pIdx}`);
      quoteParams.push(`%${name}%`);
      pIdx++;
    }

    if (quoteConditions.length === 0) {
      return res.json({
        is_repeated: false,
        total_quotations: 0,
        converted_count: 0,
        conversion_rate: 0,
        customer_tier: 'new',
        tier_label: 'New Customer',
        badge_variant: 'neutral',
        advice: 'Enter customer name or phone to check quotation conversion history.',
        recent_quotations: []
      });
    }

    // Query quotations
    const quoteQuery = `
      SELECT q.id, q.quotation_number, q.customer_name, q.customer_phone, q.status,
             q.total_amount, q.converted_id, q.created_at, q.business_id
      FROM quotations q
      WHERE (${quoteConditions.join(' OR ')})
      ORDER BY q.created_at DESC
    `;
    const quoteResult = await db.query(quoteQuery, quoteParams);
    const quoteRows = quoteResult.rows;

    // Build invoice lookup
    const invConditions: string[] = [];
    const invParams: any[] = [];
    let ipIdx = 1;

    if (cleanPhoneDigits.length >= 7) {
      invConditions.push(`customer_phone LIKE $${ipIdx}`);
      invParams.push(`%${cleanPhoneDigits}%`);
      ipIdx++;
    }
    if (name && name.length >= 3) {
      invConditions.push(`customer_name ILIKE $${ipIdx}`);
      invParams.push(`%${name}%`);
      ipIdx++;
    }

    let invRows: any[] = [];
    if (invConditions.length > 0) {
      const invQuery = `
        SELECT id, invoice_number, total_amount, payment_status, created_at
        FROM invoices
        WHERE (${invConditions.join(' OR ')})
        ORDER BY created_at DESC
      `;
      const invResult = await db.query(invQuery, invParams);
      invRows = invResult.rows;
    }

    const totalQuotations = quoteRows.length;
    const convertedRows = quoteRows.filter(
      (q) => q.status === 'converted_to_invoice' || (q.converted_id && q.converted_id.trim() !== '')
    );
    const convertedCount = convertedRows.length;
    const pendingCount = quoteRows.filter((q) => q.status === 'draft' || q.status === 'sent').length;
    const conversionRate = totalQuotations > 0 ? Number(((convertedCount / totalQuotations) * 100).toFixed(1)) : 0;

    const totalQuotedAmount = quoteRows.reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0);
    const totalConvertedAmount = convertedRows.reduce((acc, q) => acc + (Number(q.total_amount) || 0), 0);

    const totalInvoicesCount = invRows.length;
    const totalInvoiceRevenue = invRows.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);

    // Business Intelligence Classification
    let customerTier: 'high_value' | 'regular' | 'quote_shopper' | 'prospect' | 'new' = 'new';
    let tierLabel = 'New Customer';
    let badgeVariant = 'neutral';
    let advice = 'No previous quotation history. First-time client.';

    if (totalQuotations === 0 && totalInvoicesCount === 0) {
      customerTier = 'new';
      tierLabel = 'New Client';
      badgeVariant = 'neutral';
      advice = 'No previous quotations or bills found. First proposal for this client.';
    } else if (convertedCount >= 2 || totalInvoiceRevenue >= 25000 || (totalQuotations >= 2 && conversionRate >= 50)) {
      customerTier = 'high_value';
      tierLabel = `⭐ High-Value Buyer (${conversionRate}% Converted)`;
      badgeVariant = 'success';
      advice = `Strong conversion track record! Converted ${convertedCount} of ${totalQuotations} quotations (₹${Math.round(totalConvertedAmount).toLocaleString('en-IN')}) into confirmed invoices. Fast-track proposal.`;
    } else if (convertedCount >= 1 || totalInvoicesCount >= 1) {
      customerTier = 'regular';
      tierLabel = `🤝 Verified Buyer (${conversionRate}% Converted)`;
      badgeVariant = 'primary';
      advice = `Confirmed repeat customer with ${convertedCount} converted quote(s) and ${totalInvoicesCount} invoices on record.`;
    } else if (totalQuotations >= 2 && convertedCount === 0) {
      customerTier = 'quote_shopper';
      tierLabel = `⚠️ Quote Shopper (0 of ${totalQuotations} Converted)`;
      badgeVariant = 'warning';
      advice = `Customer has asked for ${totalQuotations} quotations previously without converting any into an invoice. They may be price-checking or comparison shopping. Follow up on previous objections before deep discounts.`;
    } else if (totalQuotations === 1 && convertedCount === 0) {
      customerTier = 'prospect';
      tierLabel = `📄 Active Prospect (1 Previous Quote)`;
      badgeVariant = 'info';
      advice = `Has 1 previous proposal on file (${quoteRows[0]?.quotation_number} for ₹${Number(quoteRows[0]?.total_amount).toLocaleString('en-IN')}) that is still pending or unconverted.`;
    }

    res.json({
      is_repeated: totalQuotations > 0 || totalInvoicesCount > 0,
      total_quotations: totalQuotations,
      converted_count: convertedCount,
      pending_count: pendingCount,
      conversion_rate: conversionRate,
      total_quoted_amount: totalQuotedAmount,
      total_converted_amount: totalConvertedAmount,
      total_invoices_count: totalInvoicesCount,
      total_invoice_revenue: totalInvoiceRevenue,
      customer_tier: customerTier,
      tier_label: tierLabel,
      badge_variant: badgeVariant,
      advice: advice,
      matched_name: quoteRows[0]?.customer_name || invRows[0]?.customer_name || name,
      matched_phone: quoteRows[0]?.customer_phone || invRows[0]?.customer_phone || phone,
      recent_quotations: quoteRows.slice(0, 5),
      recent_invoices: invRows.slice(0, 3)
    });
  } catch (error: any) {
    console.error('Error calculating quotation customer history:', error);
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
    const { customer_id, customer_name, customer_phone, customer_gstin, customer_address, valid_until, items, discount, notes } = req.body;

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

    // Ensure customer is saved/updated in customers table
    let resolvedCustId = customer_id || null;
    try {
      if (customer_name.trim()) {
        const existingCust = await db.query(
          `SELECT id FROM customers WHERE (gstin != '' AND UPPER(gstin) = UPPER($1)) OR (phone != '' AND phone = $2) LIMIT 1`,
          [customer_gstin || '', customer_phone || '']
        );
        if (existingCust.rows.length > 0) {
          resolvedCustId = existingCust.rows[0].id;
          await db.query(
            `UPDATE customers SET name = $1, phone = COALESCE(NULLIF($2, ''), phone), gstin = COALESCE(NULLIF($3, ''), gstin), address = COALESCE(NULLIF($4, ''), address) WHERE id = $5`,
            [customer_name.trim(), customer_phone || '', customer_gstin || '', customer_address || '', resolvedCustId]
          );
        } else {
          resolvedCustId = `cust-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
          await db.query(
            `INSERT INTO customers (id, name, phone, email, address, gstin)
             VALUES ($1, $2, $3, '', $4, $5)`,
            [resolvedCustId, customer_name.trim(), customer_phone || '', customer_address || '', customer_gstin || '']
          );
        }
      }
    } catch (custErr) {
      console.warn('Customer upsert non-critical warning:', custErr);
    }

    await db.query(
      `INSERT INTO quotations (
        id, business_id, quotation_number, customer_id, customer_name, customer_phone, customer_gstin, customer_address,
        valid_until, subtotal, discount, tax_amount, total_amount, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', $14)`,
      [
        quoteId,
        businessId,
        quoteNumber,
        resolvedCustId,
        customer_name,
        customer_phone || '',
        customer_gstin || '',
        customer_address || '',
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
