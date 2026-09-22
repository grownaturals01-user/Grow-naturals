import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { status, supervisor_id, search } = req.query;

    const db = await getDb();
    let query = `
      SELECT p.*,
      
             u.name as supervisor_name,
             u.phone as supervisor_phone,
             COALESCE((SELECT SUM(i.total_amount) FROM invoices i WHERE i.project_id = p.id), 0.00) as collection_value,
             COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.project_id = p.id), 0.00) as total_expenses
      FROM projects p
      LEFT JOIN users u ON p.supervisor_id = u.id
      WHERE p.business_id = $1
    `;
    const params: any[] = [businessId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    if (supervisor_id) {
      query += ` AND p.supervisor_id = $${paramIndex++}`;
      params.push(supervisor_id);
    }

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.client_name ILIKE $${paramIndex} OR p.company ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.query(query, params);

    // Calculate profit for each project: collection_value - total_expenses
    const projectsWithProfit = result.rows.map((p) => {
      const collection = Number(p.collection_value) || 0;
      const expenses = Number(p.total_expenses) || 0;
      const profit = Number((collection - expenses).toFixed(2));
      const margin = collection > 0 ? Number(((profit / collection) * 100).toFixed(1)) : 0;
      return {
        ...p,
        collection_value: collection,
        total_expenses: expenses,
        profit,
        margin_percent: margin
      };
    });

    res.json(projectsWithProfit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const projRes = await db.query(
      `SELECT p.*,
              u.name as supervisor_name,
              u.phone as supervisor_phone,
              u.email as supervisor_email,
              COALESCE((SELECT SUM(i.total_amount) FROM invoices i WHERE i.project_id = p.id), 0.00) as collection_value,
              COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.project_id = p.id), 0.00) as total_expenses
       FROM projects p
       LEFT JOIN users u ON p.supervisor_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projRes.rows[0];
    const collection = Number(project.collection_value) || 0;
    const expenses = Number(project.total_expenses) || 0;
    const profit = Number((collection - expenses).toFixed(2));
    const margin = collection > 0 ? Number(((profit / collection) * 100).toFixed(1)) : 0;

    // Invoices billed for this project
    const invoices = await db.query(
      `SELECT id, invoice_number, total_amount, payment_status, created_at
       FROM invoices WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    // Expenses tagged to this project
    const expenseList = await db.query(
      `SELECT e.*, ec.name as category_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.project_id = $1 ORDER BY e.date DESC`,
      [req.params.id]
    );

    // Supervisor updates
    const updates = await db.query(
      `SELECT su.*, u.name as supervisor_name
       FROM supervisor_updates su
       LEFT JOIN users u ON su.supervisor_id = u.id
       WHERE su.project_id = $1 ORDER BY su.created_at DESC`,
      [req.params.id]
    );

    // Delivery Challans for this project
    const challans = await db.query(
      `SELECT id, challan_number, dispatch_date, status
       FROM delivery_challans WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({
      ...project,
      collection_value: collection,
      total_expenses: expenses,
      profit,
      margin_percent: margin,
      invoices: invoices.rows,
      expenses: expenseList.rows,
      updates: updates.rows,
      challans: challans.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects
router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.body.business_id || getBusinessId(req);
    const { name, client_name, company, supervisor_id, start_date, end_date, budget, description, status } = req.body;

    if (!name || !client_name) {
      return res.status(400).json({ error: 'Project name and client name are required' });
    }

    const db = await getDb();
    const id = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO projects (
        id, business_id, name, client_name, company, supervisor_id,
        start_date, end_date, status, budget, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id,
        businessId,
        name,
        client_name,
        company || '',
        supervisor_id || null,
        start_date || null,
        end_date || null,
        status || 'active',
        Number(budget) || 0.00,
        description || ''
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, client_name, company, supervisor_id, start_date, end_date, status, budget, description } = req.body;

    const db = await getDb();
    const result = await db.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        client_name = COALESCE($2, client_name),
        company = COALESCE($3, company),
        supervisor_id = $4,
        start_date = $5,
        end_date = $6,
        status = COALESCE($7, status),
        budget = COALESCE($8, budget),
        description = COALESCE($9, description)
       WHERE id = $10
       RETURNING *`,
      [
        name,
        client_name,
        company,
        supervisor_id !== undefined ? supervisor_id : null,
        start_date !== undefined ? start_date : null,
        end_date !== undefined ? end_date : null,
        status,
        budget !== undefined ? Number(budget) : undefined,
        description,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/updates (Supervisor progress update)
router.post('/:id/updates', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { supervisor_id, notes, status_change } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'Progress notes are required' });
    }

    const db = await getDb();
    const updateId = `sup-up-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    await db.query(
      `INSERT INTO supervisor_updates (id, project_id, supervisor_id, notes, status_change)
       VALUES ($1, $2, $3, $4, $5)`,
      [updateId, id, supervisor_id || null, notes, status_change || '']
    );

    if (status_change) {
      await db.query(`UPDATE projects SET status = $1 WHERE id = $2`, [status_change, id]);
    }

    res.status(201).json({ success: true, id: updateId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
