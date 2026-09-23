import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// Helper to get active business id
function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/products
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { type, category_id, search, low_stock, barcode, sku } = req.query;

    const db = await getDb();
    let query = `
      SELECT 
        p.*, 
        c.name as category_name, 
        s.name as supplier_name,
        p.stock_quantity as shop_stock,
        COALESCE(ws.stock_quantity, 0) as warehouse_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN warehouse_stocks ws ON p.id = ws.product_id AND p.business_id = ws.business_id
      WHERE p.business_id = $1
    `;
    const params: any[] = [businessId];
    let paramIndex = 2;

    if (type) {
      query += ` AND p.type = $${paramIndex++}`;
      params.push(type);
    }

    if (category_id) {
      query += ` AND p.category_id = $${paramIndex++}`;
      params.push(category_id);
    }

    if (barcode) {
      query += ` AND p.barcode = $${paramIndex++}`;
      params.push(barcode);
    }

    if (sku) {
      query += ` AND p.sku = $${paramIndex++}`;
      params.push(sku);
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (low_stock === 'true' || low_stock === '1') {
      query += ` AND p.stock_quantity <= p.low_stock_threshold`;
    }

    query += ` ORDER BY p.name ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      `SELECT 
         p.*, 
         c.name as category_name, 
         s.name as supplier_name,
         p.stock_quantity as shop_stock,
         COALESCE(ws.stock_quantity, 0) as warehouse_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN warehouse_stocks ws ON p.id = ws.product_id AND p.business_id = ws.business_id
        WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Also get stock movements for this product
    const movements = await db.query(
      `SELECT sm.*, u.name as user_name
       FROM stock_movements sm
       LEFT JOIN users u ON sm.user_id = u.id
       WHERE sm.product_id = $1
       ORDER BY sm.created_at DESC
       LIMIT 30`,
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      movements: movements.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const {
      name, sku, barcode, category_id, type, cost_price, sale_price,
      gst_rate, hsn_code, stock_quantity, low_stock_threshold,
      supplier_id, image_url, attributes, discount_pieces, discount_percent
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ error: 'Product name and SKU are required' });
    }

    const db = await getDb();
    const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Tax rate for Nikhlesh Nursery is always 0
    const finalGstRate = businessId === 'nikhlesh-nursery' ? 0.00 : (Number(gst_rate) || 0.00);

    const result = await db.query(
      `INSERT INTO products (
        id, business_id, category_id, type, name, sku, barcode, cost_price,
        sale_price, gst_rate, hsn_code, stock_quantity, low_stock_threshold,
        supplier_id, image_url, attributes, discount_pieces, discount_percent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        id,
        businessId,
        category_id || null,
        type || 'general',
        name,
        sku,
        barcode || sku,
        Number(cost_price) || 0.00,
        Number(sale_price) || 0.00,
        finalGstRate,
        hsn_code || '',
        Number(stock_quantity) || 0,
        Number(low_stock_threshold) || 5,
        supplier_id || null,
        image_url || '',
        typeof attributes === 'object' ? JSON.stringify(attributes) : (attributes || '{}'),
        Number(discount_pieces) || 0,
        Number(discount_percent) || 0.00
      ]
    );

    // Initial stock movement if quantity > 0
    const initialQty = Number(stock_quantity) || 0;
    if (initialQty > 0) {
      await db.query(
        `INSERT INTO stock_movements (
          id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity, reference_type, notes
        ) VALUES ($1, $2, $3, 'adjustment', $4, 0, $4, 'manual', 'Initial stock on product creation')`,
        [`sm-${Date.now()}`, businessId, id, initialQty]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, sku, barcode, category_id, type, cost_price, sale_price,
      gst_rate, hsn_code, stock_quantity, low_stock_threshold,
      supplier_id, image_url, attributes, user_id,
      discount_pieces, discount_percent
    } = req.body;

    const db = await getDb();

    // Check existing
    const existing = await db.query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const oldProduct = existing.rows[0];

    const finalGstRate = oldProduct.business_id === 'nikhlesh-nursery' ? 0.00 : (gst_rate !== undefined ? Number(gst_rate) : oldProduct.gst_rate);

    const result = await db.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        sku = COALESCE($2, sku),
        barcode = COALESCE($3, barcode),
        category_id = $4,
        type = COALESCE($5, type),
        cost_price = COALESCE($6, cost_price),
        sale_price = COALESCE($7, sale_price),
        gst_rate = COALESCE($8, gst_rate),
        hsn_code = COALESCE($9, hsn_code),
        stock_quantity = COALESCE($10, stock_quantity),
        low_stock_threshold = COALESCE($11, low_stock_threshold),
        supplier_id = $12,
        image_url = COALESCE($13, image_url),
        attributes = COALESCE($14, attributes),
        discount_pieces = COALESCE($15, discount_pieces),
        discount_percent = COALESCE($16, discount_percent),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $17
       RETURNING *`,
      [
        name,
        sku,
        barcode,
        category_id !== undefined ? category_id : oldProduct.category_id,
        type,
        cost_price !== undefined ? Number(cost_price) : undefined,
        sale_price !== undefined ? Number(sale_price) : undefined,
        finalGstRate,
        hsn_code,
        stock_quantity !== undefined ? Number(stock_quantity) : undefined,
        low_stock_threshold !== undefined ? Number(low_stock_threshold) : undefined,
        supplier_id !== undefined ? supplier_id : oldProduct.supplier_id,
        image_url !== undefined ? image_url : undefined,
        attributes !== undefined ? (typeof attributes === 'object' ? JSON.stringify(attributes) : attributes) : undefined,
        discount_pieces !== undefined ? Number(discount_pieces) : undefined,
        discount_percent !== undefined ? Number(discount_percent) : undefined,
        id
      ]
    );

    // If stock quantity changed, log stock movement
    if (stock_quantity !== undefined && Number(stock_quantity) !== oldProduct.stock_quantity) {
      const diff = Number(stock_quantity) - oldProduct.stock_quantity;
      await db.query(
        `INSERT INTO stock_movements (
          id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity, reference_type, notes, user_id
        ) VALUES ($1, $2, $3, 'adjustment', $4, $5, $6, 'manual', 'Manual stock edit', $7)`,
        [
          `sm-${Date.now()}`,
          oldProduct.business_id,
          id,
          diff,
          oldProduct.stock_quantity,
          Number(stock_quantity),
          user_id || null
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products/:id/adjust-stock
router.post('/:id/adjust-stock', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity_change, reason, user_id } = req.body;

    if (quantity_change === undefined || isNaN(Number(quantity_change))) {
      return res.status(400).json({ error: 'Valid quantity_change is required' });
    }

    const change = Number(quantity_change);
    const db = await getDb();

    const existing = await db.query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const prod = existing.rows[0];
    const newQty = prod.stock_quantity + change;

    await db.query(
      `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newQty, id]
    );

    await db.query(
      `INSERT INTO stock_movements (
        id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity, reference_type, notes, user_id
      ) VALUES ($1, $2, $3, 'adjustment', $4, $5, $6, 'manual', $7, $8)`,
      [
        `sm-${Date.now()}`,
        prod.business_id,
        id,
        change,
        prod.stock_quantity,
        newQty,
        reason || 'Manual inventory adjustment',
        user_id || null
      ]
    );

    res.json({ success: true, previous_quantity: prod.stock_quantity, new_quantity: newQty });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.query(`DELETE FROM products WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
