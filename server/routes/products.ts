import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

// Helper to get active business id
function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// Helper to normalize product row for frontend consumption
function mapProductRow(row: any) {
  const salePrice = Number(row.sale_price) || 0;
  const costPrice = Number(row.cost_price) || 0;
  const stockQty = Number(row.stock_quantity) || 0;
  const lowStock = Number(row.low_stock_threshold) || 5;
  const gstRate = Number(row.gst_rate) || 0;

  return {
    ...row,
    sale_price: salePrice,
    selling_price: salePrice,
    price: salePrice,
    amount: salePrice,
    cost_price: costPrice,
    purchase_price: costPrice,
    stock_quantity: stockQty,
    stock: stockQty,
    quantity: stockQty,
    low_stock_threshold: lowStock,
    gst_rate: gstRate,
    tax_rate: gstRate,
  };
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
        b.name as business_name,
        p.stock_quantity as shop_stock,
        COALESCE(ws.stock_quantity, 0) as warehouse_stock
      FROM products p
      LEFT JOIN businesses b ON p.business_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN warehouse_stocks ws ON p.id = ws.product_id AND p.business_id = ws.business_id
      WHERE ($1 = 'all' OR $1 = 'combined' OR p.business_id = $1)
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
    res.json(result.rows.map(mapProductRow));
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
       LIMIT 50`,
      [req.params.id]
    );

    res.json({
      ...mapProductRow(result.rows[0]),
      movements: movements.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name, sku, barcode, category_id, type,
      hsn_code, supplier_id, image_url, attributes, discount_pieces, discount_percent
    } = req.body;

    // Resolve Sale Price / Selling Price / Price / Amount robustly
    const rawSalePrice =
      req.body.sale_price !== undefined
        ? req.body.sale_price
        : req.body.selling_price !== undefined
        ? req.body.selling_price
        : req.body.price !== undefined
        ? req.body.price
        : req.body.amount !== undefined
        ? req.body.amount
        : 0.00;

    // Resolve Cost Price / Purchase Price
    const rawCostPrice =
      req.body.cost_price !== undefined
        ? req.body.cost_price
        : req.body.purchase_price !== undefined
        ? req.body.purchase_price
        : Number(rawSalePrice)
        ? Number(rawSalePrice) * 0.7
        : 0.00;

    // Resolve Stock Quantity / Quantity / Stock
    const rawStockQuantity =
      req.body.stock_quantity !== undefined
        ? req.body.stock_quantity
        : req.body.quantity !== undefined
        ? req.body.quantity
        : req.body.stock !== undefined
        ? req.body.stock
        : 0;

    // Resolve Low Stock Alert Threshold
    const rawLowStock =
      req.body.low_stock_threshold !== undefined
        ? req.body.low_stock_threshold
        : req.body.qtyAlert !== undefined
        ? req.body.qtyAlert
        : req.body.alert_quantity !== undefined
        ? req.body.alert_quantity
        : 5;

    // Resolve GST Rate / Tax Rate
    const rawGstRate =
      req.body.gst_rate !== undefined
        ? req.body.gst_rate
        : req.body.tax_rate !== undefined
        ? req.body.tax_rate
        : req.body.tax !== undefined
        ? req.body.tax
        : 0.00;

    if (!name || !sku) {
      return res.status(400).json({ error: 'Product name and SKU are required' });
    }

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));
    const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Resolve category_id if only category_name was passed
    let finalCategoryId = category_id || null;
    if (!finalCategoryId && req.body.category_name) {
      const catFind = await db.query(
        `SELECT id FROM categories WHERE (business_id = $1 OR business_id = 'all') AND (LOWER(name) = LOWER($2) OR id = $2) LIMIT 1`,
        [businessId, req.body.category_name.trim()]
      );
      if (catFind.rows.length > 0) {
        finalCategoryId = catFind.rows[0].id;
      }
    }

    // Tax rate for Nikhlesh Nursery is always 0
    const finalGstRate = businessId === 'nikhlesh-nursery' ? 0.00 : (Number(rawGstRate) || 0.00);

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
        finalCategoryId,
        type || 'general',
        name,
        sku,
        barcode || sku,
        Number(rawCostPrice) || 0.00,
        Number(rawSalePrice) || 0.00,
        finalGstRate,
        hsn_code || '',
        Number(rawStockQuantity) || 0,
        Number(rawLowStock) || 5,
        supplier_id || null,
        image_url || '',
        typeof attributes === 'object' ? JSON.stringify(attributes) : (attributes || '{}'),
        Number(discount_pieces) || 0,
        Number(discount_percent) || 0.00
      ]
    );

    // Initial stock movement if quantity > 0
    const initialQty = Number(rawStockQuantity) || 0;
    if (initialQty > 0) {
      await db.query(
        `INSERT INTO stock_movements (
          id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity, reference_type, notes
        ) VALUES ($1, $2, $3, 'adjustment', $4, 0, $4, 'manual', 'Initial stock on product creation')`,
        [`sm-${Date.now()}`, businessId, id, initialQty]
      );
    }

    res.status(201).json(mapProductRow(result.rows[0]));
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
      name, sku, barcode, category_id, type,
      hsn_code, supplier_id, image_url, attributes, user_id,
      discount_pieces, discount_percent
    } = req.body;

    const hasSalePrice =
      req.body.sale_price !== undefined ||
      req.body.selling_price !== undefined ||
      req.body.price !== undefined ||
      req.body.amount !== undefined;

    const rawSalePrice = hasSalePrice
      ? Number(
          req.body.sale_price ??
          req.body.selling_price ??
          req.body.price ??
          req.body.amount
        )
      : undefined;

    const hasCostPrice =
      req.body.cost_price !== undefined ||
      req.body.purchase_price !== undefined;

    const rawCostPrice = hasCostPrice
      ? Number(req.body.cost_price ?? req.body.purchase_price)
      : undefined;

    const hasStockQuantity =
      req.body.stock_quantity !== undefined ||
      req.body.quantity !== undefined ||
      req.body.stock !== undefined;

    const rawStockQuantity = hasStockQuantity
      ? Number(
          req.body.stock_quantity ??
          req.body.quantity ??
          req.body.stock
        )
      : undefined;

    const hasLowStock =
      req.body.low_stock_threshold !== undefined ||
      req.body.qtyAlert !== undefined ||
      req.body.alert_quantity !== undefined;

    const rawLowStock = hasLowStock
      ? Number(
          req.body.low_stock_threshold ??
          req.body.qtyAlert ??
          req.body.alert_quantity
        )
      : undefined;

    const hasGstRate =
      req.body.gst_rate !== undefined ||
      req.body.tax_rate !== undefined ||
      req.body.tax !== undefined;

    const rawGstRate = hasGstRate
      ? Number(req.body.gst_rate ?? req.body.tax_rate ?? req.body.tax)
      : undefined;

    const db = await getDb();

    // Check existing
    const existing = await db.query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const oldProduct = existing.rows[0];

    const finalGstRate =
      oldProduct.business_id === 'nikhlesh-nursery'
        ? 0.00
        : rawGstRate !== undefined
        ? Number(rawGstRate)
        : oldProduct.gst_rate;

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
        rawCostPrice !== undefined ? Number(rawCostPrice) : undefined,
        rawSalePrice !== undefined ? Number(rawSalePrice) : undefined,
        finalGstRate,
        hsn_code,
        rawStockQuantity !== undefined ? Number(rawStockQuantity) : undefined,
        rawLowStock !== undefined ? Number(rawLowStock) : undefined,
        supplier_id !== undefined ? supplier_id : oldProduct.supplier_id,
        image_url !== undefined ? image_url : undefined,
        attributes !== undefined ? (typeof attributes === 'object' ? JSON.stringify(attributes) : attributes) : undefined,
        discount_pieces !== undefined ? Number(discount_pieces) : undefined,
        discount_percent !== undefined ? Number(discount_percent) : undefined,
        id
      ]
    );

    // If stock quantity changed, log stock movement
    if (rawStockQuantity !== undefined && Number(rawStockQuantity) !== oldProduct.stock_quantity) {
      const diff = Number(rawStockQuantity) - oldProduct.stock_quantity;
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
          Number(rawStockQuantity),
          user_id || null
        ]
      );
    }

    res.json(mapProductRow(result.rows[0]));
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
