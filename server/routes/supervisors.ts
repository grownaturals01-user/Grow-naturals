import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// GET /api/supervisors - List site supervisors with assigned projects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const sups = await db.query(
      `SELECT u.id, u.name, u.username, u.email, u.phone, u.status, u.created_at
       FROM users u
       WHERE u.role = 'supervisor' OR (u.permissions->>'projects')::boolean = true
       ORDER BY u.name ASC`
    );

    const supervisorList: any[] = [];
    for (const sup of sups.rows) {
      const projRes = await db.query(
        `SELECT id, name, client_name, status, start_date, end_date, business_id
         FROM projects WHERE supervisor_id = $1 ORDER BY created_at DESC`,
        [sup.id]
      );
      supervisorList.push({
        ...sup,
        projects: projRes.rows,
        active_project_count: projRes.rows.filter(p => p.status === 'active').length
      });
    }

    res.json(supervisorList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/supervisors/portal/:supervisor_id - Mobile portal data for field supervisors
router.get('/portal/:supervisor_id', async (req: Request, res: Response) => {
  try {
    const { supervisor_id } = req.params;
    const db = await getDb();

    const userRes = await db.query(
      `SELECT id, name, username, email, phone, role FROM users WHERE id = $1`,
      [supervisor_id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Supervisor account not found' });
    }

    // Projects assigned to this supervisor
    const projectsRes = await db.query(
      `SELECT p.*, b.name as business_name,
              COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.project_id = p.id), 0.00) as logged_expenses
       FROM projects p
       LEFT JOIN businesses b ON p.business_id = b.id
       WHERE p.supervisor_id = $1
       ORDER BY CASE WHEN p.status = 'active' THEN 0 ELSE 1 END, p.created_at DESC`,
      [supervisor_id]
    );

    // Recent updates logged by this supervisor
    const recentUpdates = await db.query(
      `SELECT su.*, p.name as project_name
       FROM supervisor_updates su
       JOIN projects p ON su.project_id = p.id
       WHERE su.supervisor_id = $1
       ORDER BY su.created_at DESC
       LIMIT 10`,
      [supervisor_id]
    );

    res.json({
      supervisor: userRes.rows[0],
      projects: projectsRes.rows,
      recent_updates: recentUpdates.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
