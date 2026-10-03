import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/purchase-returns
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();

    let query = `
      SELECT pr.*,
             bus.name as business_name,
             s.contact_person as supplier_contact,
             s.phone as supplier_phone,
             (SELECT json_agg(json_build_object(
                'id', pri.id,
                'product_id', pri.product_id,
                'product_name', pri.product_name,
                'quantity', pri.quantity,
                'unit_price', pri.unit_price,
                'total', pri.total,
                'image_url', COALESCE(p.image_url, '')
              )) FROM purchase_return_items pri
              LEFT JOIN products p ON pri.product_id = p.id
              WHERE pri.return_id = pr.id
             ) as items
      FROM purchase_returns pr
      LEFT JOIN businesses bus ON pr.business_id = bus.id
      LEFT JOIN suppliers s ON pr.supplier_id = s.id
      WHERE ($1 = 'all' OR $1 = 'combined' OR pr.business_id = $1)
      ORDER BY pr.return_date DESC, pr.created_at DESC
    `;

    const result = await db.query(query, [businessId]);
    res.json(result.rows || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/purchase-returns/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const result = await db.query(
      `SELECT pr.*, bus.name as business_name, s.name as supplier_name, s.phone as supplier_phone
       FROM purchase_returns pr
       LEFT JOIN businesses bus ON pr.business_id = bus.id
       LEFT JOIN suppliers s ON pr.supplier_id = s.id
       WHERE pr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase return not found' });
    }

    const ret = result.rows[0];
    const itemsRes = await db.query(
      `SELECT pri.*, COALESCE(p.image_url, '') as image_url, COALESCE(p.sku, '') as sku
       FROM purchase_return_items pri
       LEFT JOIN products p ON pri.product_id = p.id
       WHERE pri.return_id = $1`,
      [id]
    );

    res.json({
      ...ret,
      items: itemsRes.rows || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/purchase-returns
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      purchase_id,
      supplier_id,
      supplier_name,
      reference_no,
      return_date,
      status,
      notes,
      items
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required for purchase return' });
    }

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));

    // Resolve supplier name if ID provided
    let finalSupplierName = supplier_name || 'Vendor';
    if (supplier_id) {
      const supCheck = await db.query(`SELECT name FROM suppliers WHERE id = $1`, [supplier_id]);
      if (supCheck.rows.length > 0) {
        finalSupplierName = supCheck.rows[0].name;
      }
    }

    const refNo = reference_no || `PRET-${Date.now().toString().slice(-6)}`;
    const returnId = `pret-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    let calculatedTotal = 0;
    for (const it of items) {
      const qty = Math.max(1, parseInt(it.quantity) || 1);
      const price = parseFloat(it.unit_price) || 0;
      calculatedTotal += qty * price;
    }

    // Insert purchase_returns
    await db.query(
      `INSERT INTO purchase_returns (
        id, business_id, purchase_id, supplier_id, supplier_name,
        reference_no, return_date, status, total_amount, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        returnId,
        businessId,
        purchase_id || null,
        supplier_id || null,
        finalSupplierName,
        refNo,
        return_date || new Date().toISOString().split('T')[0],
        status || 'Received',
        calculatedTotal,
        notes || ''
      ]
    );

    // Insert items and adjust stock
    for (const it of items) {
      const itemId = `preti-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const qty = Math.max(1, parseInt(it.quantity) || 1);
      const price = parseFloat(it.unit_price) || 0;
      const total = qty * price;

      await db.query(
        `INSERT INTO purchase_return_items (
          id, return_id, product_id, product_name, quantity, unit_price, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          itemId,
          returnId,
          it.product_id || null,
          it.product_name || 'Item',
          qty,
          price,
          total
        ]
      );

      // Decrement product stock if product_id exists
      if (it.product_id) {
        const prodRes = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [it.product_id]);
        if (prodRes.rows.length > 0) {
          const prevQty = prodRes.rows[0].stock_quantity;
          const newQty = Math.max(0, prevQty - qty);

          await db.query(`UPDATE products SET stock_quantity = $1 WHERE id = $2`, [newQty, it.product_id]);

          // Log movement
          const movId = `sm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
          await db.query(
            `INSERT INTO stock_movements (
              id, business_id, product_id, type, quantity_change,
              previous_quantity, new_quantity, reference_type, reference_id, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              movId,
              businessId,
              it.product_id,
              'adjustment',
              -qty,
              prevQty,
              newQty,
              'purchase_return',
              returnId,
              `Returned to supplier ${finalSupplierName} (Ref: ${refNo})`
            ]
          );
        }
      }
    }

    const createdRes = await db.query(`SELECT * FROM purchase_returns WHERE id = $1`, [returnId]);
    res.status(201).json(createdRes.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/purchase-returns/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const db = await getDb();

    const result = await db.query(
      `UPDATE purchase_returns SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING *`,
      [status !== undefined ? status : undefined, notes !== undefined ? notes : undefined, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase return not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/purchase-returns/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    // Check existence
    const check = await db.query(`SELECT * FROM purchase_returns WHERE id = $1`, [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase return not found' });
    }

    // Get items to restore stock
    const items = await db.query(`SELECT * FROM purchase_return_items WHERE return_id = $1`, [id]);
    for (const it of items.rows) {
      if (it.product_id) {
        const prod = await db.query(`SELECT stock_quantity FROM products WHERE id = $1`, [it.product_id]);
        if (prod.rows.length > 0) {
          const prev = prod.rows[0].stock_quantity;
          const restored = prev + it.quantity;
          await db.query(`UPDATE products SET stock_quantity = $1 WHERE id = $2`, [restored, it.product_id]);
        }
      }
    }

    await db.query(`DELETE FROM purchase_returns WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Purchase return deleted and inventory restored' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
