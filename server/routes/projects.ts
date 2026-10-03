import { Router, Request, Response } from 'express';
import { getDb, resolveBusinessId } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'all';
}

// GET /api/projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { status, supervisor_id, search } = req.query;

    const db = await getDb();
    let query = `
      SELECT p.*,
             b.name as business_name,
             u.name as supervisor_name,
             u.phone as supervisor_phone,
             COALESCE((SELECT SUM(i.total_amount) FROM invoices i WHERE i.project_id = p.id), 0.00) as collection_value,
             COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.project_id = p.id), 0.00) as total_expenses
      FROM projects p
      LEFT JOIN businesses b ON p.business_id = b.id
      LEFT JOIN users u ON p.supervisor_id = u.id
      WHERE ($1 = 'all' OR $1 = 'combined' OR p.business_id = $1)
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

// GET /api/projects/work-types
router.get('/work-types', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const result = await db.query(
      `SELECT * FROM project_work_types
       WHERE ($1 = 'all' OR $1 = 'combined' OR business_id = $1)
       ORDER BY sort_order ASC, name ASC`,
      [businessId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/work-types
router.post('/work-types', async (req: Request, res: Response) => {
  try {
    const { name, description, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Work type name is required' });
    }

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));
    const id = `pwt-${businessId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO project_work_types (id, business_id, name, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, businessId, name.trim(), description ? description.trim() : '', Number(sort_order) || 0]
    );

    res.status(201).json(result.rows[0]);
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

    // Quotations linked to this project
    const quotations = await db.query(
      `SELECT q.*,
              (SELECT COUNT(*) FROM quotation_items qi WHERE qi.quotation_id = q.id) as item_count
       FROM quotations q WHERE q.project_id = $1 ORDER BY q.created_at DESC`,
      [req.params.id]
    );

    // Daily tasks & progress milestones
    const dailyTasks = await db.query(
      `SELECT * FROM project_daily_tasks WHERE project_id = $1 ORDER BY task_date DESC, created_at DESC`,
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
      quotations: quotations.rows,
      expenses: expenseList.rows,
      daily_tasks: dailyTasks.rows,
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
    const {
      name,
      client_name,
      client_id,
      company,
      address,
      phone,
      gst_number,
      location,
      referred_by,
      category_id,
      category_name,
      work_type,
      work_nature,
      rework_source,
      site_visit_amount,
      allowance_amount,
      allowance_notes,
      appointment_date,
      supervisor_id,
      start_date,
      end_date,
      expected_completion_date,
      budget,
      advance_amount,
      assigned_work,
      assigned_labour,
      labour_count,
      description,
      status
    } = req.body;

    if (!client_name || !client_name.trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const finalName = (name && name.trim())
      ? name.trim()
      : [client_name.trim(), work_type?.trim(), location?.trim()].filter(Boolean).join(' - ') || 'New Project';

    const db = await getDb();
    const businessId = await resolveBusinessId(db, req.body.business_id || getBusinessId(req));
    const id = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO projects (
        id, business_id, name, client_name, client_id, company, address, phone, gst_number,
        location, referred_by, category_id, category_name, work_type, work_nature, rework_source,
        site_visit_amount, allowance_amount, allowance_notes, appointment_date, supervisor_id,
        start_date, end_date, expected_completion_date, status, budget, advance_amount,
        assigned_work, assigned_labour, labour_count, description
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31
      )
      RETURNING *`,
      [
        id,
        businessId,
        finalName,
        client_name.trim(),
        client_id || null,
        company ? company.trim() : '',
        address ? address.trim() : '',
        phone ? phone.trim() : '',
        gst_number ? gst_number.trim() : '',
        location ? location.trim() : '',
        referred_by ? referred_by.trim() : '',
        category_id || '',
        category_name || '',
        work_type || '',
        work_nature || 'new',
        rework_source || '',
        Number(site_visit_amount) || 0.00,
        Number(allowance_amount) || 0.00,
        allowance_notes ? allowance_notes.trim() : '',
        appointment_date || null,
        supervisor_id || null,
        start_date || null,
        end_date || null,
        expected_completion_date || null,
        status || 'planning',
        Number(budget) || 0.00,
        Number(advance_amount) || 0.00,
        assigned_work ? assigned_work.trim() : '',
        assigned_labour ? assigned_labour.trim() : '',
        Number(labour_count) || 0,
        description ? description.trim() : ''
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
    const {
      name,
      client_name,
      client_id,
      company,
      address,
      phone,
      gst_number,
      location,
      referred_by,
      category_id,
      category_name,
      work_type,
      work_nature,
      rework_source,
      site_visit_amount,
      allowance_amount,
      allowance_notes,
      appointment_date,
      supervisor_id,
      start_date,
      end_date,
      expected_completion_date,
      status,
      budget,
      advance_amount,
      assigned_work,
      assigned_labour,
      labour_count,
      description
    } = req.body;

    const db = await getDb();
    const result = await db.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        client_name = COALESCE($2, client_name),
        client_id = COALESCE($3, client_id),
        company = COALESCE($4, company),
        address = COALESCE($5, address),
        phone = COALESCE($6, phone),
        gst_number = COALESCE($7, gst_number),
        location = COALESCE($8, location),
        referred_by = COALESCE($9, referred_by),
        category_id = COALESCE($10, category_id),
        category_name = COALESCE($11, category_name),
        work_type = COALESCE($12, work_type),
        work_nature = COALESCE($13, work_nature),
        rework_source = COALESCE($14, rework_source),
        site_visit_amount = COALESCE($15, site_visit_amount),
        allowance_amount = COALESCE($16, allowance_amount),
        allowance_notes = COALESCE($17, allowance_notes),
        appointment_date = COALESCE($18, appointment_date),
        supervisor_id = $19,
        start_date = $20,
        end_date = $21,
        expected_completion_date = $22,
        status = COALESCE($23, status),
        budget = COALESCE($24, budget),
        advance_amount = COALESCE($25, advance_amount),
        assigned_work = COALESCE($26, assigned_work),
        assigned_labour = COALESCE($27, assigned_labour),
        labour_count = COALESCE($28, labour_count),
        description = COALESCE($29, description)
       WHERE id = $30
       RETURNING *`,
      [
        name,
        client_name,
        client_id,
        company,
        address,
        phone,
        gst_number,
        location,
        referred_by,
        category_id,
        category_name,
        work_type,
        work_nature,
        rework_source,
        site_visit_amount !== undefined ? Number(site_visit_amount) : undefined,
        allowance_amount !== undefined ? Number(allowance_amount) : undefined,
        allowance_notes,
        appointment_date,
        supervisor_id !== undefined ? supervisor_id : null,
        start_date !== undefined ? start_date : null,
        end_date !== undefined ? end_date : null,
        expected_completion_date !== undefined ? expected_completion_date : null,
        status,
        budget !== undefined ? Number(budget) : undefined,
        advance_amount !== undefined ? Number(advance_amount) : undefined,
        assigned_work,
        assigned_labour,
        labour_count !== undefined ? Number(labour_count) : undefined,
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

// POST /api/projects/:id/daily-tasks (Record daily work/task completion)
router.post('/:id/daily-tasks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { task_date, task_title, description, images, created_by, created_by_name } = req.body;

    if (!task_title || !task_title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const db = await getDb();
    const taskId = `pdt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);

    const result = await db.query(
      `INSERT INTO project_daily_tasks (
        id, project_id, task_date, task_title, description, images, created_by, created_by_name
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
      RETURNING *`,
      [
        taskId,
        id,
        task_date || new Date().toISOString().split('T')[0],
        task_title.trim(),
        description ? description.trim() : '',
        imagesJson,
        created_by || '',
        created_by_name || 'Team Member'
      ]
    );

    // If project is in 'planning', auto-update status to 'in_progress'
    await db.query(
      `UPDATE projects SET status = 'in_progress' WHERE id = $1 AND status = 'planning'`,
      [id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/projects/:id/daily-tasks/:taskId/remarks (Add / update manager remarks on daily task)
router.put('/:id/daily-tasks/:taskId/remarks', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { remarks, remarks_by, remarks_by_name } = req.body;

    if (remarks === undefined) {
      return res.status(400).json({ error: 'Remarks content is required' });
    }

    const db = await getDb();
    const result = await db.query(
      `UPDATE project_daily_tasks SET
        remarks = $1,
        remarks_by = $2,
        remarks_by_name = $3,
        remarks_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [remarks.trim(), remarks_by || '', remarks_by_name || 'Admin / Project Manager', taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Daily task not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/expenses (Add project-specific expense)
router.post('/:id/expenses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, category_id, category_name, amount, recipient, notes, payment_method, image_url } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid expense amount is required' });
    }

    const db = await getDb();
    const projCheck = await db.query(`SELECT business_id FROM projects WHERE id = $1`, [id]);
    if (projCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const businessId = projCheck.rows[0].business_id;
    const expenseId = `exp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const result = await db.query(
      `INSERT INTO expenses (
        id, business_id, project_id, category_id, amount, date, recipient, notes, payment_method, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        expenseId,
        businessId,
        id,
        category_id || null,
        Number(amount),
        date || new Date().toISOString().split('T')[0],
        recipient ? recipient.trim() : '',
        notes ? notes.trim() : (category_name ? `Project expense: ${category_name}` : 'Project expense'),
        payment_method || 'cash',
        image_url || ''
      ]
    );

    res.status(201).json(result.rows[0]);
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

// GET /api/projects/:id/available-links (Fetch invoices & quotations available to map)
router.get('/:id/available-links', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const projRes = await db.query(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const invoices = await db.query(
      `SELECT id, invoice_number, customer_name, total_amount, payment_status, created_at, project_id
       FROM invoices
       WHERE (project_id IS NULL OR project_id = '' OR project_id != $1)
       ORDER BY created_at DESC LIMIT 50`,
      [id]
    );

    const quotations = await db.query(
      `SELECT id, quotation_number, customer_name, total_amount, status, created_at, project_id
       FROM quotations
       WHERE (project_id IS NULL OR project_id = '' OR project_id != $1)
       ORDER BY created_at DESC LIMIT 50`,
      [id]
    );

    res.json({
      invoices: invoices.rows,
      quotations: quotations.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/link-invoice
router.post('/:id/link-invoice', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { invoice_id } = req.body;
    if (!invoice_id) return res.status(400).json({ error: 'invoice_id is required' });

    const db = await getDb();
    await db.query(`UPDATE invoices SET project_id = $1 WHERE id = $2`, [id, invoice_id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/unlink-invoice
router.post('/:id/unlink-invoice', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { invoice_id } = req.body;
    if (!invoice_id) return res.status(400).json({ error: 'invoice_id is required' });

    const db = await getDb();
    await db.query(`UPDATE invoices SET project_id = NULL WHERE id = $1 AND project_id = $2`, [invoice_id, id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/link-quotation
router.post('/:id/link-quotation', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quotation_id } = req.body;
    if (!quotation_id) return res.status(400).json({ error: 'quotation_id is required' });

    const db = await getDb();
    await db.query(`UPDATE quotations SET project_id = $1 WHERE id = $2`, [id, quotation_id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/unlink-quotation
router.post('/:id/unlink-quotation', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quotation_id } = req.body;
    if (!quotation_id) return res.status(400).json({ error: 'quotation_id is required' });

    const db = await getDb();
    await db.query(`UPDATE quotations SET project_id = NULL WHERE id = $1 AND project_id = $2`, [quotation_id, id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
