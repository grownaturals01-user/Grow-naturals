import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

// GET /api/warehouses
router.get('/', async (req: Request, res: Response) => {
  try {
    const rawBizId = (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
    const search = req.query.search as string;
    const db = await getDb();

    let query = `
      SELECT 
        w.*,
        b.name AS business_name,
        COALESCE(st.total_products, 0) AS total_products,
        COALESCE(st.total_stock, 0) AS total_stock
      FROM warehouses w
      LEFT JOIN businesses b ON w.business_id = b.id
      LEFT JOIN (
        SELECT business_id,
               COUNT(DISTINCT product_id) as total_products,
               SUM(stock_quantity) as total_stock
        FROM warehouse_stocks
        GROUP BY business_id
      ) st ON w.business_id = st.business_id
    `;
    const params: any[] = [];

    if (rawBizId && rawBizId !== 'all' && rawBizId !== 'combined') {
      const resolvedBiz = await resolveBusinessId(db, rawBizId);
      params.push(resolvedBiz);
      query += ` WHERE w.business_id = $${params.length}`;
    }

    if (search && search.trim()) {
      const sParam = `%${search.trim().toLowerCase()}%`;
      params.push(sParam);
      query += params.length === 1 ? ' WHERE ' : ' AND ';
      query += `(LOWER(w.name) LIKE $${params.length} OR LOWER(w.contact_person) LIKE $${params.length} OR LOWER(w.phone) LIKE $${params.length} OR LOWER(w.city) LIKE $${params.length})`;
    }

    query += ` ORDER BY w.created_at ASC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/warehouses/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(
      `SELECT w.*, b.name AS business_name FROM warehouses w LEFT JOIN businesses b ON w.business_id = b.id WHERE w.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/warehouses
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, contact_person, phone, email, address, city, state, country, postal_code, status } = req.body;
    const businessId = (req.body.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';

    if (!name) {
      return res.status(400).json({ error: 'Warehouse name is required' });
    }

    const db = await getDb();
    const resolvedBiz = await resolveBusinessId(db, businessId);
    const id = `wh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO warehouses (id, business_id, name, contact_person, phone, email, address, city, state, country, postal_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        resolvedBiz,
        name,
        contact_person || '',
        phone || '',
        email || '',
        address || '',
        city || '',
        state || '',
        country || 'India',
        postal_code || '',
        status || 'Active'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/warehouses/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, city, state, country, postal_code, status } = req.body;

    const db = await getDb();
    const result = await db.query(
      `UPDATE warehouses SET
        name = COALESCE($1, name),
        contact_person = COALESCE($2, contact_person),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        address = COALESCE($5, address),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        country = COALESCE($8, country),
        postal_code = COALESCE($9, postal_code),
        status = COALESCE($10, status)
       WHERE id = $11
       RETURNING *`,
      [name, contact_person, phone, email, address, city, state, country, postal_code, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/warehouses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const result = await db.query(`DELETE FROM warehouses WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ message: 'Warehouse deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
