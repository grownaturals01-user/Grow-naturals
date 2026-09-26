import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/inventory-losses - List all damage and loss logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { reason, productId, startDate, endDate } = req.query;

    const db = await getDb();
    let query = `
      SELECT 
        l.*,
        b.name as business_name,
        p.name as product_name,
        p.sku as product_sku,
        p.type as product_type,
        p.image_url as product_image_url,
        p.stock_quantity as current_stock
      FROM inventory_losses l
      LEFT JOIN businesses b ON l.business_id = b.id
      JOIN products p ON l.product_id = p.id
      WHERE ($1 = 'all' OR $1 = 'combined' OR l.business_id = $1)
    `;
    const params: any[] = [businessId];

    if (reason && reason !== 'all') {
      params.push(reason);
      query += ` AND l.reason = $${params.length}`;
    }

    if (productId && productId !== 'all') {
      params.push(productId);
      query += ` AND l.product_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND l.damage_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND l.damage_date <= $${params.length}`;
    }

    query += ` ORDER BY l.damage_date DESC, l.created_at DESC LIMIT 200`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory-losses/metrics - Summary statistics & KPIs
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();

    // Overall and today's loss metrics
    const metricsRes = await db.query(
      `SELECT 
        COALESCE(SUM(loss_amount), 0.00) as total_loss_amount,
        COALESCE(SUM(quantity), 0) as total_items_lost,
        COUNT(id) as total_records,
        COALESCE(SUM(CASE WHEN damage_date = CURRENT_DATE THEN loss_amount ELSE 0 END), 0.00) as today_loss_amount,
        COALESCE(SUM(CASE WHEN damage_date = CURRENT_DATE THEN quantity ELSE 0 END), 0) as today_items_lost
       FROM inventory_losses
       WHERE ($1 = 'all' OR $1 = 'combined' OR business_id = $1)`,
      [businessId]
    );

    // Top causes of loss
    const reasonsRes = await db.query(
      `SELECT reason, COUNT(id) as occurrences, SUM(quantity) as units_lost, SUM(loss_amount) as total_amount
       FROM inventory_losses
       WHERE ($1 = 'all' OR $1 = 'combined' OR business_id = $1)
       GROUP BY reason
       ORDER BY total_amount DESC
       LIMIT 5`,
      [businessId]
    );

    // Top lost products
    const topProductsRes = await db.query(
      `SELECT p.name, p.sku, p.type, SUM(l.quantity) as units_lost, SUM(l.loss_amount) as total_amount
       FROM inventory_losses l
       JOIN products p ON l.product_id = p.id
       WHERE ($1 = 'all' OR $1 = 'combined' OR l.business_id = $1)
       GROUP BY p.id, p.name, p.sku, p.type
       ORDER BY total_amount DESC
       LIMIT 5`,
      [businessId]
    );

    const m = metricsRes.rows[0] || {};
    res.json({
      total_loss_amount: Number(m.total_loss_amount || 0),
      total_items_lost: Number(m.total_items_lost || 0),
      total_records: Number(m.total_records || 0),
      today_loss_amount: Number(m.today_loss_amount || 0),
      today_items_lost: Number(m.today_items_lost || 0),
      top_reasons: reasonsRes.rows,
      top_products: topProductsRes.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory-losses - Record plant damage and reduce stock
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const {
      product_id,
      quantity,
      reason,
      damage_date,
      notes,
      reported_by,
      valuation_basis // 'cost' | 'sale'
    } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product is required' });
    }

    const lossQty = parseInt(String(quantity), 10);
    if (isNaN(lossQty) || lossQty <= 0) {
      return res.status(400).json({ error: 'Quantity damaged must be greater than 0' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason for damage/loss is required' });
    }

    const db = await getDb();

    // 1. Fetch product to verify stock and price
    const prodRes = await db.query(
      `SELECT id, name, sku, type, cost_price, sale_price, stock_quantity, business_id
       FROM products
       WHERE id = $1 AND business_id = $2`,
      [product_id, businessId]
    );

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found for active business' });
    }

    const product = prodRes.rows[0];
    const prevStock = Number(product.stock_quantity || 0);
    const newStock = Math.max(0, prevStock - lossQty);

    const unitCost = Number(product.cost_price || 0);
    const unitPrice = Number(product.sale_price || 0);

    // Compute loss amount: cost price by default; fallback to sale_price if cost is 0
    let unitVal = unitCost > 0 ? unitCost : unitPrice;
    if (valuation_basis === 'sale') {
      unitVal = unitPrice;
    }
    const lossAmount = Number((lossQty * unitVal).toFixed(2));

    const lossId = `loss-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const effectiveDate = damage_date || new Date().toISOString().split('T')[0];

    // 2. Reduce product stock
    await db.query(
      `UPDATE products
       SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newStock, product_id]
    );

    // 3. Record audit trail in stock_movements
    const movementId = `mov-loss-${Date.now()}`;
    await db.query(
      `INSERT INTO stock_movements (
        id, business_id, product_id, type, quantity_change,
        previous_quantity, new_quantity, reference_type, reference_id, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
      [
        movementId,
        businessId,
        product_id,
        'adjustment',
        -lossQty,
        prevStock,
        newStock,
        'damage_loss',
        lossId,
        `Loss logged: ${reason}. ${notes || ''}`.trim()
      ]
    );

    // 4. Insert into inventory_losses
    const insertRes = await db.query(
      `INSERT INTO inventory_losses (
        id, business_id, product_id, quantity, unit_cost, unit_price,
        loss_amount, reason, notes, reported_by, damage_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        lossId,
        businessId,
        product_id,
        lossQty,
        unitCost,
        unitPrice,
        lossAmount,
        reason,
        notes || '',
        reported_by || 'Staff Member',
        effectiveDate
      ]
    );

    res.status(201).json({
      ...insertRes.rows[0],
      product_name: product.name,
      product_sku: product.sku,
      product_type: product.type,
      current_stock: newStock
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inventory-losses/:id - Rollback accidental damage entry and restore stock
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    // Find loss record
    const lossRes = await db.query(
      `SELECT * FROM inventory_losses WHERE id = $1`,
      [id]
    );

    if (lossRes.rows.length === 0) {
      return res.status(404).json({ error: 'Loss record not found' });
    }

    const loss = lossRes.rows[0];
    const restoreQty = Number(loss.quantity || 0);

    // Fetch current product stock
    const prodRes = await db.query(
      `SELECT stock_quantity FROM products WHERE id = $1`,
      [loss.product_id]
    );

    if (prodRes.rows.length > 0) {
      const prevStock = Number(prodRes.rows[0].stock_quantity || 0);
      const restoredStock = prevStock + restoreQty;

      // Restore stock
      await db.query(
        `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [restoredStock, loss.product_id]
      );

      // Audit movement log
      const movId = `mov-restore-${Date.now()}`;
      await db.query(
        `INSERT INTO stock_movements (
          id, business_id, product_id, type, quantity_change,
          previous_quantity, new_quantity, reference_type, reference_id, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
        [
          movId,
          loss.business_id,
          loss.product_id,
          'adjustment',
          restoreQty,
          prevStock,
          restoredStock,
          'damage_rollback',
          id,
          `Rollback of loss entry #${id}`
        ]
      );
    }

    // Delete loss record
    await db.query(`DELETE FROM inventory_losses WHERE id = $1`, [id]);

    res.json({
      message: 'Damage record rolled back and stock successfully restored to inventory',
      restored_quantity: restoreQty
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
