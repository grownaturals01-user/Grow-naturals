import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET /api/customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const db = await getDb();

    let query = `
      SELECT c.*,
             COUNT(i.id) as invoice_count,
             COALESCE(SUM(i.total_amount), 0.00) as total_spent
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id
    `;
    const params: any[] = [];

    if (search) {
      query += ` WHERE c.name ILIKE $1 OR c.phone ILIKE $1 OR c.email ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY c.id ORDER BY c.name ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const custRes = await db.query(`SELECT * FROM customers WHERE id = $1`, [req.params.id]);

    if (custRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = custRes.rows[0];

    // Invoices for this customer across businesses
    const invoices = await db.query(
      `SELECT i.*, b.name as business_name
       FROM invoices i
       JOIN businesses b ON i.business_id = b.id
       WHERE i.customer_id = $1
       ORDER BY i.created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...customer,
      invoices: invoices.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address, gstin, customer_type } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const db = await getDb();
    const id = `cust-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO customers (id, name, phone, email, address, gstin, customer_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, name, phone || '', email || '', address || '', gstin || '', customer_type || 'customer']
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, gstin, customer_type } = req.body;

    const db = await getDb();
    const result = await db.query(
      `UPDATE customers SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        address = COALESCE($4, address),
        gstin = COALESCE($5, gstin),
        customer_type = COALESCE($6, customer_type)
       WHERE id = $7
       RETURNING *`,
      [name, phone, email, address, gstin, customer_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
