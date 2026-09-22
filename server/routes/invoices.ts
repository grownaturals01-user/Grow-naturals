import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/invoices
router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { search, customer_id, start_date, end_date, limit } = req.query;

    const db = await getDb();
    let query = `
      SELECT i.*, 
             u.name as cashier_name,
             p.name as project_name,
             (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as item_count
      FROM invoices i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.business_id = $1
    `;
    const params: any[] = [businessId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (i.invoice_number ILIKE $${paramIndex} OR i.customer_name ILIKE $${paramIndex} OR i.customer_phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (customer_id) {
      query += ` AND i.customer_id = $${paramIndex++}`;
      params.push(customer_id);
    }

    if (start_date) {
      query += ` AND DATE(i.created_at) >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND DATE(i.created_at) <= $${paramIndex++}`;
      params.push(end_date);
    }

    query += ` ORDER BY i.created_at DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(Number(limit));
    } else {
      query += ` LIMIT 100`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const invRes = await db.query(
      `SELECT i.*, 
              u.name as cashier_name,
              p.name as project_name,
              b.name as business_name,
              b.legal_name as business_legal_name,
              b.gstin as business_gstin,
              b.address as business_address,
              b.phone as business_phone,
              b.email as business_email,
              b.invoice_footer as business_footer
       FROM invoices i
       LEFT JOIN users u ON i.created_by = u.id
       LEFT JOIN projects p ON i.project_id = p.id
       LEFT JOIN businesses b ON i.business_id = b.id
       WHERE i.id = $1 OR i.invoice_number = $1`,
      [req.params.id]
    );

    if (invRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invRes.rows[0];

    const itemsRes = await db.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC`,
      [invoice.id]
    );

    res.json({
      ...invoice,
      items: itemsRes.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
