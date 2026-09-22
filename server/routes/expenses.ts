import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/expenses/categories - User-definable expense categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const result = await db.query(
      `SELECT ec.*, 
              COUNT(e.id) as expense_count,
              COALESCE(SUM(e.amount), 0.00) as total_spent
       FROM expense_categories ec
       LEFT JOIN expenses e ON ec.id = e.category_id
       WHERE ec.business_id = $1
       GROUP BY ec.id
       ORDER BY ec.name ASC`,
      [businessId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/expenses/categories
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const db = await getDb();
    const id = `expcat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO expense_categories (id, business_id, name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, businessId, name, description || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/expenses/categories/:id
router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const db = await getDb();
    const result = await db.query(
      `UPDATE expense_categories SET
        name = COALESCE($1, name),
        description = COALESCE($2, description)
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense category not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/expenses/categories/:id
router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.query(`DELETE FROM expense_categories WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/expenses
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { category_id, project_id, search, start_date, end_date } = req.query;

    const db = await getDb();
    let query = `
      SELECT e.*,
             ec.name as category_name,
             p.name as project_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE e.business_id = $1
    `;
    const params: any[] = [businessId];
    let paramIndex = 2;

    if (category_id) {
      query += ` AND e.category_id = $${paramIndex++}`;
      params.push(category_id);
    }

    if (project_id) {
      query += ` AND e.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    if (start_date) {
      query += ` AND e.date >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND e.date <= $${paramIndex++}`;
      params.push(end_date);
    }

    if (search) {
      query += ` AND (e.recipient ILIKE $${paramIndex} OR e.reference_no ILIKE $${paramIndex} OR e.notes ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY e.date DESC, e.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/expenses
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const { category_id, project_id, amount, payment_method, date, recipient, reference_no, notes } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid expense amount is required' });
    }

    const db = await getDb();
    const id = `exp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO expenses (
        id, business_id, category_id, project_id, amount, payment_method, date, recipient, reference_no, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        id,
        businessId,
        category_id || null,
        project_id || null,
        Number(amount),
        payment_method || 'cash',
        date || new Date().toISOString().split('T')[0],
        recipient || '',
        reference_no || '',
        notes || ''
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.query(`DELETE FROM expenses WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
