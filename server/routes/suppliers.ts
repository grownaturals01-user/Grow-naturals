import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET /api/suppliers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const db = await getDb();

    let query = `
      SELECT s.*,
             COUNT(po.id) as total_po_count,
             COALESCE(SUM(po.total_amount), 0.00) as total_purchased,
             COALESCE(SUM(po.total_amount - po.paid_amount), 0.00) as outstanding_due
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE s.name ILIKE $1 OR s.contact_person ILIKE $1 OR s.phone ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY s.id ORDER BY s.name ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const suppRes = await db.query(`SELECT * FROM suppliers WHERE id = $1`, [req.params.id]);

    if (suppRes.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const supplier = suppRes.rows[0];

    // Orders from this supplier across businesses
    const orders = await db.query(
      `SELECT po.*, b.name as business_name
       FROM purchase_orders po
       LEFT JOIN businesses b ON po.business_id = b.id
       WHERE po.supplier_id = $1
       ORDER BY po.order_date DESC`,
      [req.params.id]
    );

    // Products supplied
    const products = await db.query(
      `SELECT p.id, p.name, p.sku, p.type, p.stock_quantity, p.cost_price, b.name as business_name
       FROM products p
       LEFT JOIN businesses b ON p.business_id = b.id
       WHERE p.supplier_id = $1`,
      [req.params.id]
    );

    res.json({
      ...supplier,
      orders: orders.rows,
      products: products.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/suppliers
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, contact_person, phone, email, address, gstin, payment_terms } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const db = await getDb();
    const id = `supp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO suppliers (id, name, contact_person, phone, email, address, gstin, payment_terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, name, contact_person || '', phone || '', email || '', address || '', gstin || '', payment_terms || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, gstin, payment_terms } = req.body;

    const db = await getDb();
    const result = await db.query(
      `UPDATE suppliers SET
        name = COALESCE($1, name),
        contact_person = COALESCE($2, contact_person),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        address = COALESCE($5, address),
        gstin = COALESCE($6, gstin),
        payment_terms = COALESCE($7, payment_terms)
       WHERE id = $8
       RETURNING *`,
      [name, contact_person, phone, email, address, gstin, payment_terms, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
