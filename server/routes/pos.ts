import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// Helper to generate next sequential invoice number per business
async function getNextInvoiceNumber(db: any, businessId: string): Promise<string> {
  const bizRes = await db.query(`SELECT invoice_prefix FROM businesses WHERE id = $1`, [businessId]);
  const prefix = bizRes.rows[0]?.invoice_prefix || (businessId === 'grow-naturals' ? 'GN-' : 'NN-');

  const countRes = await db.query(
    `SELECT COUNT(*) as count FROM invoices WHERE business_id = $1`,
    [businessId]
  );
  const nextNum = 1001 + Number(countRes.rows[0]?.count || 0);
  return `${prefix}${nextNum}`;
}

// POST /api/pos/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const {
      business_id,
      customer_id,
      customer_name,
      customer_phone,
      project_id,
      items, // array of { product_id, product_name, sku, hsn_code, quantity, unit_price, discount, gst_rate }
      discount_amount,
      payment_method,
      notes,
      created_by
    } = req.body;

    const rawBiz = business_id || (req.headers['x-business-id'] as string) || 'grow-naturals';
    const bizId = (rawBiz && rawBiz !== 'all' && rawBiz !== 'combined') ? rawBiz : 'grow-naturals';
    const isTaxable = bizId === 'grow-naturals';

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required for checkout' });
    }

    const db = await getDb();
    const invoiceNumber = await getNextInvoiceNumber(db, bizId);
    const invoiceId = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Compute totals
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    const processedItems: any[] = [];

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const disc = Number(item.discount) || 0;
      const lineSubtotal = Math.max(0, (qty * price) - disc);

      const gstRate = isTaxable ? (Number(item.gst_rate) || 0) : 0.00;
      const lineTax = isTaxable ? Number(((lineSubtotal * gstRate) / 100).toFixed(2)) : 0.00;
      const lineTotal = Number((lineSubtotal + lineTax).toFixed(2));

      calculatedSubtotal += lineSubtotal;
      calculatedTax += lineTax;

      processedItems.push({
        id: `inv-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        invoice_id: invoiceId,
        product_id: item.product_id || null,
        product_name: item.product_name || 'Botanical Item',
        sku: item.sku || '',
        hsn_code: item.hsn_code || (isTaxable ? '0602' : ''),
        quantity: qty,
        unit_price: price,
        discount: disc,
        gst_rate: gstRate,
        tax_amount: lineTax,
        total: lineTotal,
        stock_source: item.stock_source || 'shop'
      });
    }

    const totalDiscount = Number(discount_amount) || 0;
    const cgst = isTaxable ? Number((calculatedTax / 2).toFixed(2)) : 0.00;
    const sgst = isTaxable ? Number((calculatedTax / 2).toFixed(2)) : 0.00;
    const finalTotal = Math.max(0, Number((calculatedSubtotal + calculatedTax - totalDiscount).toFixed(2)));

    // Insert Invoice
    await db.query(
      `INSERT INTO invoices (
        id, business_id, invoice_number, customer_id, customer_name, customer_phone,
        project_id, subtotal, discount_amount, tax_amount, cgst_amount, sgst_amount,
        total_amount, payment_method, payment_status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        invoiceId,
        bizId,
        invoiceNumber,
        customer_id || null,
        customer_name || 'Walk-in Customer',
        customer_phone || '',
        project_id || null,
        calculatedSubtotal,
        totalDiscount,
        calculatedTax,
        cgst,
        sgst,
        finalTotal,
        payment_method || 'cash',
        'paid',
        notes || '',
        created_by || null
      ]
    );

    // Insert Items & Update Stock
    for (const item of processedItems) {
      await db.query(
        `INSERT INTO invoice_items (
          id, invoice_id, product_id, product_name, sku, hsn_code,
          quantity, unit_price, discount, gst_rate, tax_amount, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          item.id,
          item.invoice_id,
          item.product_id,
          item.product_name,
          item.sku,
          item.hsn_code,
          item.quantity,
          item.unit_price,
          item.discount,
          item.gst_rate,
          item.tax_amount,
          item.total
        ]
      );

      // Decrement inventory/warehouse stock or shop stock based on item.stock_source
      if (item.product_id) {
        if (item.stock_source === 'inventory') {
          // Deduct from Main Warehouse / Inventory stock
          const wsRes = await db.query(
            `SELECT stock_quantity FROM warehouse_stocks WHERE business_id = $1 AND product_id = $2`,
            [bizId, item.product_id]
          );
          const currentStock = wsRes.rows.length > 0 ? Number(wsRes.rows[0].stock_quantity) : 0;
          const newStock = Math.max(0, currentStock - item.quantity);

          if (wsRes.rows.length > 0) {
            await db.query(
              `UPDATE warehouse_stocks SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE business_id = $2 AND product_id = $3`,
              [newStock, bizId, item.product_id]
            );
          } else {
            await db.query(
              `INSERT INTO warehouse_stocks (id, business_id, product_id, stock_quantity) VALUES ($1, $2, $3, $4)`,
              [`ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`, bizId, item.product_id, newStock]
            );
          }

          // Record in warehouse_transactions
          await db.query(
            `INSERT INTO warehouse_transactions (
              id, business_id, product_id, type, quantity, previous_stock, new_stock,
              unit_price, total_amount, buyer_name, reference_no, notes, transaction_date
            ) VALUES ($1, $2, $3, 'sale', $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE)`,
            [
              `wt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
              bizId,
              item.product_id,
              item.quantity,
              currentStock,
              newStock,
              item.unit_price,
              item.total,
              customer_name || 'Walk-in Customer',
              invoiceNumber,
              `POS Sale from Main Inventory #${invoiceNumber}`
            ]
          );
        } else {
          // Default: Deduct from Shop Counter stock (products table)
          const prodRes = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [item.product_id]);
          if (prodRes.rows.length > 0) {
            const currentStock = prodRes.rows[0].stock_quantity;
            const newStock = Math.max(0, currentStock - item.quantity);

            await db.query(
              `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
              [newStock, item.product_id]
            );

            await db.query(
              `INSERT INTO stock_movements (
                id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity,
                reference_type, reference_id, notes, user_id
              ) VALUES ($1, $2, $3, 'sale', $4, $5, $6, 'invoice', $7, $8, $9)`,
              [
                `sm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
                bizId,
                item.product_id,
                -item.quantity,
                currentStock,
                newStock,
                invoiceNumber,
                `POS Sale #${invoiceNumber}`,
                created_by || null
              ]
            );
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      invoice: {
        id: invoiceId,
        business_id: bizId,
        invoice_number: invoiceNumber,
        customer_name: customer_name || 'Walk-in Customer',
        customer_phone: customer_phone || '',
        subtotal: calculatedSubtotal,
        discount_amount: totalDiscount,
        tax_amount: calculatedTax,
        cgst_amount: cgst,
        sgst_amount: sgst,
        total_amount: finalTotal,
        payment_method: payment_method || 'cash',
        created_at: new Date().toISOString(),
        items: processedItems
      }
    });
  } catch (error: any) {
    console.error('POS Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/pos/sync - Sync queued sales from IndexedDB
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { sales } = req.body;
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      return res.status(400).json({ error: 'No sales provided for sync' });
    }

    const db = await getDb();
    const syncedInvoices: string[] = [];

    for (const sale of sales) {
      // Check if invoice already exists
      const existing = await db.query(
        `SELECT id FROM invoices WHERE invoice_number = $1`,
        [sale.invoice_number]
      );

      if (existing.rows.length > 0) {
        syncedInvoices.push(sale.invoice_number);
        continue; // Already processed
      }

      const bizId = sale.business_id || 'grow-naturals';
      const isTaxable = bizId === 'grow-naturals';
      const invoiceId = sale.id || `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const invoiceNumber = sale.invoice_number || (await getNextInvoiceNumber(db, bizId));

      await db.query(
        `INSERT INTO invoices (
          id, business_id, invoice_number, customer_id, customer_name, customer_phone,
          subtotal, discount_amount, tax_amount, cgst_amount, sgst_amount,
          total_amount, payment_method, payment_status, notes, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          invoiceId,
          bizId,
          invoiceNumber,
          sale.customer_id || null,
          sale.customer_name || 'Walk-in Customer',
          sale.customer_phone || '',
          sale.subtotal || 0,
          sale.discount_amount || 0,
          sale.tax_amount || 0,
          isTaxable ? (sale.cgst_amount || Number((sale.tax_amount / 2).toFixed(2)) || 0) : 0,
          isTaxable ? (sale.sgst_amount || Number((sale.tax_amount / 2).toFixed(2)) || 0) : 0,
          sale.total_amount || 0,
          sale.payment_method || 'cash',
          'paid',
          'Offline Queued POS Sale Synced',
          sale.created_by || null,
          sale.created_at || new Date().toISOString()
        ]
      );

      // Insert items and adjust stock
      for (const item of (sale.items || [])) {
        const itemId = `inv-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        await db.query(
          `INSERT INTO invoice_items (
            id, invoice_id, product_id, product_name, sku, hsn_code,
            quantity, unit_price, discount, gst_rate, tax_amount, total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            itemId,
            invoiceId,
            item.product_id || null,
            item.product_name,
            item.sku || '',
            item.hsn_code || '',
            item.quantity,
            item.unit_price,
            item.discount || 0,
            isTaxable ? (item.gst_rate || 0) : 0,
            isTaxable ? (item.tax_amount || 0) : 0,
            item.total
          ]
        );

        if (item.product_id) {
          if (item.stock_source === 'inventory') {
            const wsRes = await db.query(
              `SELECT stock_quantity FROM warehouse_stocks WHERE business_id = $1 AND product_id = $2`,
              [bizId, item.product_id]
            );
            const currentStock = wsRes.rows.length > 0 ? Number(wsRes.rows[0].stock_quantity) : 0;
            const newStock = Math.max(0, currentStock - item.quantity);

            if (wsRes.rows.length > 0) {
              await db.query(
                `UPDATE warehouse_stocks SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE business_id = $2 AND product_id = $3`,
                [newStock, bizId, item.product_id]
              );
            } else {
              await db.query(
                `INSERT INTO warehouse_stocks (id, business_id, product_id, stock_quantity) VALUES ($1, $2, $3, $4)`,
                [`ws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`, bizId, item.product_id, newStock]
              );
            }

            await db.query(
              `INSERT INTO warehouse_transactions (
                id, business_id, product_id, type, quantity, previous_stock, new_stock,
                unit_price, total_amount, reference_no, notes, transaction_date
              ) VALUES ($1, $2, $3, 'sale', $4, $5, $6, $7, $8, $9, 'Offline Synced POS Sale from Main Inventory', CURRENT_DATE)`,
              [
                `wt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
                bizId,
                item.product_id,
                item.quantity,
                currentStock,
                newStock,
                item.unit_price,
                item.total,
                invoiceNumber
              ]
            );
          } else {
            const prodRes = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [item.product_id]);
            if (prodRes.rows.length > 0) {
              const currentStock = prodRes.rows[0].stock_quantity;
              const newStock = Math.max(0, currentStock - item.quantity);
              await db.query(
                `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [newStock, item.product_id]
              );
              await db.query(
                `INSERT INTO stock_movements (
                  id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity,
                  reference_type, reference_id, notes
                ) VALUES ($1, $2, $3, 'sale', $4, $5, $6, 'invoice', $7, 'Offline Synced POS Sale')`,
                [
                  `sm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
                  bizId,
                  item.product_id,
                  -item.quantity,
                  currentStock,
                  newStock,
                  invoiceNumber
                ]
              );
            }
          }
        }
      }

      syncedInvoices.push(invoiceNumber);
    }

    res.json({
      success: true,
      synced_count: syncedInvoices.length,
      synced_invoices: syncedInvoices
    });
  } catch (error: any) {
    console.error('POS Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
