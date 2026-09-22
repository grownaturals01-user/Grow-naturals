import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/reports/dashboard - Scoped strictly to currently active business
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { range } = req.query; // 'today', '7days', 'month', 'year'

    const db = await getDb();

    let dateFilter = `created_at >= CURRENT_DATE`;
    if (range === '7days') {
      dateFilter = `created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (range === 'month') {
      dateFilter = `created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (range === 'year') {
      dateFilter = `created_at >= CURRENT_DATE - INTERVAL '365 days'`;
    }

    // 1. Today's Revenue & Bills Count
    const todayRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as today_sales,
              COUNT(id) as today_bills
       FROM invoices
       WHERE business_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [businessId]
    );

    // 2. Filtered Range Revenue
    const rangeRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as total_sales,
              COALESCE(SUM(tax_amount), 0.00) as total_tax,
              COUNT(id) as total_bills
       FROM invoices
       WHERE business_id = $1 AND ${dateFilter}`,
      [businessId]
    );

    // 3. Low stock alerts count & items
    const lowStockRes = await db.query(
      `SELECT id, name, sku, stock_quantity, low_stock_threshold, type
       FROM products
       WHERE business_id = $1 AND stock_quantity <= low_stock_threshold
       ORDER BY stock_quantity ASC
       LIMIT 10`,
      [businessId]
    );
    const lowStockCountRes = await db.query(
      `SELECT COUNT(*) as count FROM products WHERE business_id = $1 AND stock_quantity <= low_stock_threshold`,
      [businessId]
    );

    // 4. Active Projects count & pending collection
    const projRes = await db.query(
      `SELECT COUNT(id) as active_projects
       FROM projects
       WHERE business_id = $1 AND status = 'active'`,
      [businessId]
    );

    // 5. Pending supplier dues for this business
    const duesRes = await db.query(
      `SELECT COALESCE(SUM(total_amount - paid_amount), 0.00) as supplier_dues
       FROM purchase_orders
       WHERE business_id = $1 AND payment_status != 'paid'`,
      [businessId]
    );

    // 6. Top Selling Products
    const topProductsRes = await db.query(
      `SELECT ii.product_name,
              SUM(ii.quantity) as total_qty,
              SUM(ii.total) as total_revenue
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE i.business_id = $1 AND i.${dateFilter}
       GROUP BY ii.product_name
       ORDER BY total_qty DESC
       LIMIT 5`,
      [businessId]
    );

    // 7. Payment Methods Breakdown
    const paymentMethodsRes = await db.query(
      `SELECT payment_method,
              COUNT(id) as count,
              COALESCE(SUM(total_amount), 0.00) as total
       FROM invoices
       WHERE business_id = $1 AND ${dateFilter}
       GROUP BY payment_method`,
      [businessId]
    );

    // 8. Recent Invoices
    const recentInvoicesRes = await db.query(
      `SELECT id, invoice_number, customer_name, total_amount, payment_method, payment_status, created_at
       FROM invoices
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT 8`,
      [businessId]
    );

    // 9. Daily sales trend (last 7 days)
    const salesTrendRes = await db.query(
      `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as day,
              COALESCE(SUM(total_amount), 0.00) as total,
              COUNT(id) as count
       FROM invoices
       WHERE business_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
       ORDER BY day ASC`,
      [businessId]
    );

    res.json({
      business_id: businessId,
      range: range || 'today',
      metrics: {
        today_sales: Number(todayRes.rows[0]?.today_sales || 0),
        today_bills: Number(todayRes.rows[0]?.today_bills || 0),
        period_sales: Number(rangeRes.rows[0]?.total_sales || 0),
        period_tax: Number(rangeRes.rows[0]?.total_tax || 0),
        period_bills: Number(rangeRes.rows[0]?.total_bills || 0),
        low_stock_count: Number(lowStockCountRes.rows[0]?.count || 0),
        active_projects: Number(projRes.rows[0]?.active_projects || 0),
        supplier_dues: Number(duesRes.rows[0]?.supplier_dues || 0)
      },
      top_products: topProductsRes.rows,
      payment_breakdown: paymentMethodsRes.rows,
      recent_invoices: recentInvoicesRes.rows,
      low_stock_items: lowStockRes.rows,
      sales_trend: salesTrendRes.rows
    });
  } catch (error: any) {
    console.error('Dashboard report error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
