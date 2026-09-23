import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// Helper to ensure a product has a warehouse_stocks row
async function getOrCreateWarehouseStock(db: any, businessId: string, productId: string) {
  const existing = await db.query(
    `SELECT * FROM warehouse_stocks WHERE business_id = $1 AND product_id = $2`,
    [businessId, productId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const id = `wh-stock-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  await db.query(
    `INSERT INTO warehouse_stocks (id, business_id, product_id, stock_quantity, location_bin)
     VALUES ($1, $2, $3, 0, '')
     ON CONFLICT (business_id, product_id) DO NOTHING`,
    [id, businessId, productId]
  );

  const res = await db.query(
    `SELECT * FROM warehouse_stocks WHERE business_id = $1 AND product_id = $2`,
    [businessId, productId]
  );
  return res.rows[0] || { stock_quantity: 0, location_bin: '' };
}

// GET /api/warehouse/inventory - List products with warehouse stock balances
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
    const search = req.query.search as string;
    const type = req.query.type as string;

    const db = await getDb();

    let query = `
      SELECT 
        p.id,
        p.business_id,
        p.name,
        p.sku,
        p.barcode,
        p.type,
        p.cost_price,
        p.sale_price,
        p.stock_quantity AS shop_stock,
        p.low_stock_threshold,
        p.image_url,
        c.name AS category_name,
        COALESCE(ws.stock_quantity, 0) AS warehouse_stock,
        COALESCE(ws.location_bin, '') AS location_bin,
        (COALESCE(ws.stock_quantity, 0) * COALESCE(p.cost_price, 0)) AS warehouse_valuation,
        COALESCE(sales.sold_units, 0) AS total_sold_units,
        COALESCE(sales.sold_amount, 0) AS total_sold_amount,
        COALESCE(damages.damaged_units, 0) AS total_damaged_units,
        COALESCE(damages.damaged_amount, 0) AS total_damaged_amount,
        COALESCE(transfers.transferred_units, 0) AS total_transferred_to_shop
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN warehouse_stocks ws ON p.id = ws.product_id AND p.business_id = ws.business_id
      LEFT JOIN (
        SELECT product_id, SUM(quantity) AS sold_units, SUM(total_amount) AS sold_amount
        FROM warehouse_transactions
        WHERE business_id = $1 AND type = 'sale'
        GROUP BY product_id
      ) sales ON p.id = sales.product_id
      LEFT JOIN (
        SELECT product_id, SUM(quantity) AS damaged_units, SUM(total_amount) AS damaged_amount
        FROM warehouse_transactions
        WHERE business_id = $1 AND type = 'damage'
        GROUP BY product_id
      ) damages ON p.id = damages.product_id
      LEFT JOIN (
        SELECT product_id, SUM(quantity) AS transferred_units
        FROM warehouse_transactions
        WHERE business_id = $1 AND type = 'transfer_to_shop'
        GROUP BY product_id
      ) transfers ON p.id = transfers.product_id
      WHERE p.business_id = $1
    `;

    const params: any[] = [businessId];

    if (type && type !== 'all') {
      params.push(type);
      query += ` AND p.type = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.sku) LIKE $${params.length})`;
    }

    query += ` ORDER BY p.name ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching warehouse inventory:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch warehouse inventory' });
  }
});

// GET /api/warehouse/metrics - Key KPIs for warehouse
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
    const db = await getDb();

    // 1. Stock overview
    const stockRes = await db.query(
      `SELECT 
         COALESCE(SUM(ws.stock_quantity), 0) AS total_warehouse_units,
         COALESCE(SUM(ws.stock_quantity * p.cost_price), 0) AS total_warehouse_valuation,
         COUNT(DISTINCT ws.product_id) AS total_products_tracked
       FROM warehouse_stocks ws
       JOIN products p ON ws.product_id = p.id
       WHERE ws.business_id = $1`,
      [businessId]
    );

    // 2. Sales metrics
    const salesRes = await db.query(
      `SELECT 
         COALESCE(SUM(quantity), 0) AS total_sales_units,
         COALESCE(SUM(total_amount), 0) AS total_sales_amount,
         COUNT(*) AS sales_transactions_count
       FROM warehouse_transactions
       WHERE business_id = $1 AND type = 'sale'`,
      [businessId]
    );

    // 3. Damage metrics
    const damageRes = await db.query(
      `SELECT 
         COALESCE(SUM(quantity), 0) AS total_damage_units,
         COALESCE(SUM(total_amount), 0) AS total_damage_amount,
         COUNT(*) AS damage_records_count
       FROM warehouse_transactions
       WHERE business_id = $1 AND type = 'damage'`,
      [businessId]
    );

    // 4. Shop transfer metrics
    const transferRes = await db.query(
      `SELECT 
         COALESCE(SUM(quantity), 0) AS total_transfers_units,
         COUNT(*) AS transfer_records_count
       FROM warehouse_transactions
       WHERE business_id = $1 AND type = 'transfer_to_shop'`,
      [businessId]
    );

    res.json({
      total_warehouse_units: Number(stockRes.rows[0]?.total_warehouse_units || 0),
      total_warehouse_valuation: Number(stockRes.rows[0]?.total_warehouse_valuation || 0),
      total_products_tracked: Number(stockRes.rows[0]?.total_products_tracked || 0),
      total_sales_units: Number(salesRes.rows[0]?.total_sales_units || 0),
      total_sales_amount: Number(salesRes.rows[0]?.total_sales_amount || 0),
      sales_transactions_count: Number(salesRes.rows[0]?.sales_transactions_count || 0),
      total_damage_units: Number(damageRes.rows[0]?.total_damage_units || 0),
      total_damage_amount: Number(damageRes.rows[0]?.total_damage_amount || 0),
      damage_records_count: Number(damageRes.rows[0]?.damage_records_count || 0),
      total_transfers_units: Number(transferRes.rows[0]?.total_transfers_units || 0),
      transfer_records_count: Number(transferRes.rows[0]?.transfer_records_count || 0)
    });
  } catch (error: any) {
    console.error('Error fetching warehouse metrics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch warehouse metrics' });
  }
});

// GET /api/warehouse/transactions - Audit history of all movements
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const businessId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string, 10) || 100;

    const db = await getDb();
    let query = `
      SELECT 
        wt.*,
        p.name AS product_name,
        p.sku AS product_sku,
        p.type AS product_type,
        p.image_url AS product_image_url,
        COALESCE(c.name, 'General') AS category_name
      FROM warehouse_transactions wt
      JOIN products p ON wt.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE wt.business_id = $1
    `;

    const params: any[] = [businessId];

    if (type && type !== 'all') {
      params.push(type);
      query += ` AND wt.type = $${params.length}`;
    }

    query += ` ORDER BY wt.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching warehouse transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch warehouse transactions' });
  }
});

// POST /api/warehouse/transactions - Execute a movement (sale, damage, inward, transfer_to_shop)
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const {
      business_id,
      product_id,
      type, // 'sale', 'damage', 'inward', 'transfer_to_shop', 'transfer_from_shop'
      quantity,
      unit_price,
      buyer_name,
      damage_reason,
      reference_no,
      notes,
      performed_by,
      transaction_date,
      location_bin
    } = req.body;

    const bizId = business_id || (req.headers['x-business-id'] as string) || 'grow-naturals';

    if (!product_id) {
      return res.status(400).json({ error: 'Product is required' });
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    if (!['sale', 'damage', 'inward', 'transfer_to_shop', 'transfer_from_shop'].includes(type)) {
      return res.status(400).json({ error: `Invalid transaction type: ${type}` });
    }

    const db = await getDb();

    // Verify product exists
    const prodRes = await db.query(`SELECT * FROM products WHERE id = $1 AND business_id = $2`, [product_id, bizId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found in this business catalog' });
    }
    const product = prodRes.rows[0];

    // Ensure warehouse stock record exists
    const whStockRow = await getOrCreateWarehouseStock(db, bizId, product_id);
    const prevWhStock = Number(whStockRow.stock_quantity || 0);
    const prevShopStock = Number(product.stock_quantity || 0);

    let newWhStock = prevWhStock;
    let newShopStock = prevShopStock;

    // Price calculation
    let calculatedUnit = Number(unit_price) || 0;
    if (calculatedUnit <= 0) {
      if (type === 'sale') {
        calculatedUnit = Number(product.sale_price) || 0;
      } else {
        calculatedUnit = Number(product.cost_price) > 0 ? Number(product.cost_price) : Number(product.sale_price) || 0;
      }
    }
    const totalAmount = Number((qty * calculatedUnit).toFixed(2));

    // Stock boundary checks
    if (type === 'sale' || type === 'damage' || type === 'transfer_to_shop') {
      if (prevWhStock < qty) {
        return res.status(400).json({
          error: `Insufficient warehouse stock. Current warehouse stock is ${prevWhStock} units, but ${qty} units requested.`
        });
      }
      newWhStock = prevWhStock - qty;

      if (type === 'transfer_to_shop') {
        newShopStock = prevShopStock + qty;
      }
    } else if (type === 'inward') {
      newWhStock = prevWhStock + qty;
    } else if (type === 'transfer_from_shop') {
      if (prevShopStock < qty) {
        return res.status(400).json({
          error: `Insufficient retail shop stock to return to warehouse. Shop stock is ${prevShopStock} units.`
        });
      }
      newShopStock = prevShopStock - qty;
      newWhStock = prevWhStock + qty;
    }

    // Update warehouse stock
    const binToSave = location_bin !== undefined ? location_bin : whStockRow.location_bin;
    await db.query(
      `UPDATE warehouse_stocks 
       SET stock_quantity = $1, location_bin = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE business_id = $3 AND product_id = $4`,
      [newWhStock, binToSave, bizId, product_id]
    );

    // If shop stock changed (transfer), update products table & stock_movements
    if (type === 'transfer_to_shop' || type === 'transfer_from_shop') {
      await db.query(
        `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newShopStock, product_id]
      );

      const smId = `sm-wh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const movementNotes =
        type === 'transfer_to_shop'
          ? `Dispatched from Warehouse to Shop Counter (${qty} units)`
          : `Returned from Shop Counter to Warehouse (${qty} units)`;

      await db.query(
        `INSERT INTO stock_movements (
          id, business_id, product_id, type, quantity_change, previous_quantity, new_quantity,
          reference_type, reference_id, notes
        ) VALUES ($1, $2, $3, 'adjustment', $4, $5, $6, 'warehouse_transfer', $7, $8)`,
        [
          smId,
          bizId,
          product_id,
          type === 'transfer_to_shop' ? qty : -qty,
          prevShopStock,
          newShopStock,
          reference_no || 'WH-TRANSFER',
          movementNotes
        ]
      );
    }

    // Insert warehouse transaction ledger record
    const txId = `wh-tx-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    await db.query(
      `INSERT INTO warehouse_transactions (
        id, business_id, product_id, type, quantity, previous_stock, new_stock,
        unit_price, total_amount, buyer_name, damage_reason, reference_no,
        notes, performed_by, transaction_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)`,
      [
        txId,
        bizId,
        product_id,
        type,
        qty,
        prevWhStock,
        newWhStock,
        calculatedUnit,
        totalAmount,
        buyer_name || '',
        damage_reason || '',
        reference_no || '',
        notes || '',
        performed_by || '',
        transaction_date || new Date().toISOString().split('T')[0]
      ]
    );

    res.status(201).json({
      id: txId,
      business_id: bizId,
      product_id,
      type,
      quantity: qty,
      previous_stock: prevWhStock,
      new_stock: newWhStock,
      new_shop_stock: newShopStock,
      total_amount: totalAmount,
      product_name: product.name,
      message: `Warehouse ${type} recorded successfully`
    });
  } catch (error: any) {
    console.error('Error recording warehouse transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to record warehouse transaction' });
  }
});

// DELETE /api/warehouse/transactions/:id - Rollback a transaction
router.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const txRes = await db.query(`SELECT * FROM warehouse_transactions WHERE id = $1`, [id]);
    if (txRes.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse transaction not found' });
    }
    const tx = txRes.rows[0];

    const whStockRow = await getOrCreateWarehouseStock(db, tx.business_id, tx.product_id);
    const currentWh = Number(whStockRow.stock_quantity || 0);

    const prodRes = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [tx.product_id]);
    const currentShop = prodRes.rows.length > 0 ? Number(prodRes.rows[0].stock_quantity || 0) : 0;

    let restoredWh = currentWh;
    let restoredShop = currentShop;

    // Reverse action
    if (tx.type === 'sale' || tx.type === 'damage') {
      // Stock was subtracted, so restore it back
      restoredWh = currentWh + tx.quantity;
    } else if (tx.type === 'inward') {
      // Stock was added, so subtract it
      restoredWh = Math.max(0, currentWh - tx.quantity);
    } else if (tx.type === 'transfer_to_shop') {
      // Stock was deducted from WH and added to shop
      restoredWh = currentWh + tx.quantity;
      restoredShop = Math.max(0, currentShop - tx.quantity);
      await db.query(`UPDATE products SET stock_quantity = $1 WHERE id = $2`, [restoredShop, tx.product_id]);
    } else if (tx.type === 'transfer_from_shop') {
      restoredWh = Math.max(0, currentWh - tx.quantity);
      restoredShop = currentShop + tx.quantity;
      await db.query(`UPDATE products SET stock_quantity = $1 WHERE id = $2`, [restoredShop, tx.product_id]);
    }

    await db.query(
      `UPDATE warehouse_stocks SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE business_id = $2 AND product_id = $3`,
      [restoredWh, tx.business_id, tx.product_id]
    );

    await db.query(`DELETE FROM warehouse_transactions WHERE id = $1`, [id]);

    res.json({
      success: true,
      message: 'Warehouse transaction reversed successfully and stock restored',
      restored_warehouse_stock: restoredWh
    });
  } catch (error: any) {
    console.error('Error deleting warehouse transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to rollback warehouse transaction' });
  }
});

// PUT /api/warehouse/stocks/:product_id/bin - Update location bin
router.put('/stocks/:product_id/bin', async (req: Request, res: Response) => {
  try {
    const { product_id } = req.params;
    const { business_id, location_bin } = req.body;
    const bizId = business_id || (req.headers['x-business-id'] as string) || 'grow-naturals';

    const db = await getDb();
    await getOrCreateWarehouseStock(db, bizId, product_id);

    await db.query(
      `UPDATE warehouse_stocks SET location_bin = $1, updated_at = CURRENT_TIMESTAMP WHERE business_id = $2 AND product_id = $3`,
      [location_bin || '', bizId, product_id]
    );

    res.json({ success: true, location_bin });
  } catch (error: any) {
    console.error('Error updating warehouse bin:', error);
    res.status(500).json({ error: error.message || 'Failed to update location bin' });
  }
});

export default router;
