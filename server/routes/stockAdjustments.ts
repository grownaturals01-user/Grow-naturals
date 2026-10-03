import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/stock-adjustments
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();

    const result = await db.query(
      `SELECT sm.id,
              sm.business_id,
              sm.product_id,
              sm.type,
              sm.quantity_change,
              sm.previous_quantity,
              sm.new_quantity,
              sm.reference_type,
              sm.reference_id,
              sm.notes,
              sm.created_at,
              p.name as product_name,
              p.sku as product_sku,
              p.image_url as product_image,
              b.name as business_name,
              u.name as user_name
       FROM stock_movements sm
       LEFT JOIN products p ON sm.product_id = p.id
       LEFT JOIN businesses b ON sm.business_id = b.id
       LEFT JOIN users u ON sm.user_id = u.id
       WHERE sm.type = 'adjustment'
         AND ($1 = 'all' OR $1 = 'combined' OR sm.business_id = $1)
       ORDER BY sm.created_at DESC`,
      [businessId]
    );

    res.json(result.rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stock-adjustments
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      product_id,
      quantity,
      adjustment_type, // 'addition' | 'subtraction'
      quantity_change, // direct number (+5 or -5)
      notes,
      user_id
    } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    let delta = 0;
    if (quantity_change !== undefined) {
      delta = parseInt(quantity_change) || 0;
    } else if (quantity !== undefined) {
      const q = Math.abs(parseInt(quantity) || 0);
      delta = (adjustment_type === 'subtraction' || adjustment_type === 'Subtract') ? -q : q;
    }

    if (delta === 0) {
      return res.status(400).json({ error: 'Adjustment quantity cannot be 0' });
    }

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));

    const prodRes = await db.query(`SELECT * FROM products WHERE id = $1`, [product_id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = prodRes.rows[0];
    const prevStock = product.stock_quantity;
    const newStock = Math.max(0, prevStock + delta);

    // Update product stock
    await db.query(
      `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newStock, product_id]
    );

    // Insert stock_movement
    const movementId = `adj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const result = await db.query(
      `INSERT INTO stock_movements (
        id, business_id, product_id, type, quantity_change,
        previous_quantity, new_quantity, reference_type, reference_id, notes, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        movementId,
        businessId,
        product_id,
        'adjustment',
        delta,
        prevStock,
        newStock,
        'manual_adjustment',
        movementId,
        notes || (delta > 0 ? `Stock addition (+${delta})` : `Stock reduction (${delta})`),
        user_id || null
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      product_name: product.name,
      product_sku: product.sku,
      product_image: product.image_url
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/stock-adjustments/:id (Revert adjustment)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const check = await db.query(`SELECT * FROM stock_movements WHERE id = $1 AND type = 'adjustment'`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Stock adjustment record not found' });
    }

    const movement = check.rows[0];
    // Revert the quantity change
    const prodRes = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [movement.product_id]);
    if (prodRes.rows.length > 0) {
      const currentStock = prodRes.rows[0].stock_quantity;
      const revertedStock = Math.max(0, currentStock - movement.quantity_change);
      await db.query(`UPDATE products SET stock_quantity = $1 WHERE id = $2`, [revertedStock, movement.product_id]);
    }

    await db.query(`DELETE FROM stock_movements WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Stock adjustment deleted and reverted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
