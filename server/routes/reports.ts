import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

function getBusinessId(req: Request): string {
  return (req.query.business_id as string) || (req.headers['x-business-id'] as string) || 'grow-naturals';
}

// GET /api/reports/dashboard - Scoped to currently active business or combined (both businesses)
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const { range, combined, start_date, end_date, startDate, endDate } = req.query;
    const start = (start_date || startDate) as string | undefined;
    const end = (end_date || endDate) as string | undefined;
    const isCombined = businessId === 'combined' || businessId === 'all' || combined === 'true';

    const db = await getDb();

    let dateFilter = `1=1`;
    if (start && end) {
      dateFilter = `DATE(created_at) >= '${start}' AND DATE(created_at) <= '${end}'`;
    } else if (range === '1D' || range === 'today') {
      dateFilter = `DATE(created_at) = CURRENT_DATE`;
    } else if (range === '1W' || range === '7days') {
      dateFilter = `created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (range === '1M' || range === 'month') {
      dateFilter = `created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    } else if (range === '3M') {
      dateFilter = `created_at >= CURRENT_DATE - INTERVAL '90 days'`;
    } else if (range === '6M') {
      dateFilter = `created_at >= CURRENT_DATE - INTERVAL '180 days'`;
    } else if (range === '1Y' || range === 'year') {
      dateFilter = `created_at >= CURRENT_DATE - INTERVAL '365 days'`;
    } else if (range === 'ALL' || range === 'all') {
      dateFilter = `1=1`;
    }

    if (isCombined) {
      // Combined queries across all businesses
      // 1. Today's Revenue & Bills Count
      const todayRes = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0.00) as today_sales,
                COUNT(id) as today_bills
         FROM invoices
         WHERE DATE(created_at) = CURRENT_DATE`
      );

      // 2. Filtered Range Revenue & Tax Breakdown
      const rangeRes = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0.00) as total_sales,
                COALESCE(SUM(tax_amount), 0.00) as total_tax,
                COALESCE(SUM(cgst_amount), 0.00) as total_cgst,
                COALESCE(SUM(sgst_amount), 0.00) as total_sgst,
                COUNT(id) as total_bills
         FROM invoices
         WHERE ${dateFilter}`
      );

      // 2b. Purchases
      const purchaseRes = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0.00) as total_purchase,
                COUNT(id) as count
         FROM purchase_orders
         WHERE ${dateFilter}`
      );

      // 2c. Sales Returns / Refunds
      const refundRes = await db.query(
        `SELECT COALESCE(SUM(total_refund_amount), 0.00) as total_returns,
                COUNT(id) as count
         FROM refunds
         WHERE ${dateFilter}`
      );

      // 2d. Expenses
      const expenseRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0.00) as total_expenses,
                COUNT(id) as count
         FROM expenses
         WHERE ${dateFilter.replace(/created_at/g, 'date')}`
      );

      // 2e. Invoice Dues / Unpaid
      const invoiceDueRes = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0.00) as invoice_due
         FROM invoices
         WHERE payment_status IN ('unpaid', 'pending', 'partial')`
      );

      // 2f. Total Counts
      const custCountRes = await db.query(`SELECT COUNT(*) as count FROM customers`);
      const suppCountRes = await db.query(`SELECT COUNT(*) as count FROM suppliers`);
      const totalOrdersRes = await db.query(`SELECT COUNT(*) as count FROM invoices`);

      // 3. Low stock alerts count & items
      const lowStockRes = await db.query(
        `SELECT p.id, p.name, p.sku, p.stock_quantity, p.low_stock_threshold, p.type, p.business_id, b.name as business_name
         FROM products p
         LEFT JOIN businesses b ON p.business_id = b.id
         WHERE p.stock_quantity <= p.low_stock_threshold
         ORDER BY p.stock_quantity ASC
         LIMIT 15`
      );
      const lowStockCountRes = await db.query(
        `SELECT COUNT(*) as count FROM products WHERE stock_quantity <= low_stock_threshold`
      );

      // 4. Active Projects count
      const projRes = await db.query(
        `SELECT COUNT(id) as active_projects
         FROM projects
         WHERE status = 'active'`
      );

      // 5. Pending supplier dues across businesses
      const duesRes = await db.query(
        `SELECT COALESCE(SUM(total_amount - paid_amount), 0.00) as supplier_dues
         FROM purchase_orders
         WHERE payment_status != 'paid'`
      );

      // 6. Top Selling Products (combined by product name)
      const topProductsRes = await db.query(
        `SELECT ii.product_name,
                SUM(ii.quantity) as total_qty,
                SUM(ii.total) as total_revenue
         FROM invoice_items ii
         JOIN invoices i ON ii.invoice_id = i.id
         WHERE ${dateFilter.replace(/\bcreated_at\b/g, 'i.created_at')}
         GROUP BY ii.product_name
         ORDER BY total_qty DESC
         LIMIT 10`
      );

      // 7. Payment Methods Breakdown (combined)
      const paymentMethodsRes = await db.query(
        `SELECT payment_method,
                COUNT(id) as count,
                COALESCE(SUM(total_amount), 0.00) as total
         FROM invoices
         WHERE ${dateFilter}
         GROUP BY payment_method
         ORDER BY total DESC`
      );

      // 8. Recent Invoices across businesses
      const recentInvoicesRes = await db.query(
        `SELECT i.id, i.invoice_number, i.customer_name, i.total_amount, i.payment_method, i.payment_status, i.created_at, i.business_id, b.name as business_name
         FROM invoices i
         LEFT JOIN businesses b ON i.business_id = b.id
         ORDER BY i.created_at DESC
         LIMIT 10`
      );

      // 8b. Recent Purchases
      const recentPurchasesRes = await db.query(
        `SELECT po.id, po.po_number, COALESCE(s.name, 'Vendor') as supplier_name, po.total_amount, po.payment_status, po.created_at
         FROM purchase_orders po
         LEFT JOIN suppliers s ON po.supplier_id = s.id
         ORDER BY po.created_at DESC
         LIMIT 10`
      );

      // 8c. Recent Quotations
      const recentQuotationsRes = await db.query(
        `SELECT q.id, q.quotation_number, q.customer_name, q.total_amount, q.status, q.created_at
         FROM quotations q
         ORDER BY q.created_at DESC
         LIMIT 10`
      );

      // 8d. Recent Expenses
      const recentExpensesRes = await db.query(
        `SELECT e.id, COALESCE(NULLIF(e.notes, ''), e.recipient, ec.name, 'Expense') as title, e.amount, e.payment_method, e.date as created_at, COALESCE(ec.name, 'General') as category
         FROM expenses e
         LEFT JOIN expense_categories ec ON e.category_id = ec.id
         ORDER BY e.date DESC, e.created_at DESC
         LIMIT 10`
      );

      // 9. Daily sales trend (last 7 days combined)
      const salesTrendRes = await db.query(
        `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as day,
                COALESCE(SUM(total_amount), 0.00) as total,
                COUNT(id) as count
         FROM invoices
         WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
         ORDER BY day ASC`
      );

      // 10. Top Customers
      const topCustRes = await db.query(
        `SELECT COALESCE(customer_name, 'Walk-in Customer') as name,
                COUNT(id) as order_count,
                COALESCE(SUM(total_amount), 0.00) as total_spent
         FROM invoices
         GROUP BY customer_name
         ORDER BY total_spent DESC
         LIMIT 6`
      );

      // 11. Monthly sales & expenses for the year (Diverging Chart)
      const monthlySalesRes = await db.query(
        `SELECT TO_CHAR(created_at, 'Mon') as month,
                EXTRACT(MONTH FROM created_at) as month_num,
                COALESCE(SUM(total_amount), 0.00) as sales
         FROM invoices
         WHERE created_at >= CURRENT_DATE - INTERVAL '11 months'
         GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
         ORDER BY month_num ASC`
      );

      const monthlyExpRes = await db.query(
        `SELECT TO_CHAR(date, 'Mon') as month,
                EXTRACT(MONTH FROM date) as month_num,
                COALESCE(SUM(amount), 0.00) as expenses
         FROM expenses
         WHERE date >= CURRENT_DATE - INTERVAL '11 months'
         GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
         ORDER BY month_num ASC`
      );

      // 12. Customer repeat vs new
      const custTypeRes = await db.query(
        `SELECT 
          COUNT(CASE WHEN order_count = 1 THEN 1 END) as first_time,
          COUNT(CASE WHEN order_count > 1 THEN 1 END) as returning
         FROM (
           SELECT customer_name, COUNT(id) as order_count 
           FROM invoices 
           GROUP BY customer_name
         ) c`
      );

      const totalSalesVal = Number(rangeRes.rows[0]?.total_sales || 0);
      const totalPurchVal = Number(purchaseRes.rows[0]?.total_purchase || 0);
      const totalExpVal = Number(expenseRes.rows[0]?.total_expenses || 0);
      const netProfit = totalSalesVal - totalPurchVal - totalExpVal;

      return res.json({
        business_id: 'combined',
        is_combined: true,
        range: range || 'today',
        metrics: {
          today_sales: Number(todayRes.rows[0]?.today_sales || 0),
          today_bills: Number(todayRes.rows[0]?.today_bills || 0),
          period_sales: totalSalesVal,
          period_tax: Number(rangeRes.rows[0]?.total_tax || 0),
          period_cgst: Number(rangeRes.rows[0]?.total_cgst || 0),
          period_sgst: Number(rangeRes.rows[0]?.total_sgst || 0),
          period_bills: Number(rangeRes.rows[0]?.total_bills || 0),
          total_sales_return: Number(refundRes.rows[0]?.total_returns || 0),
          total_purchase: totalPurchVal,
          total_purchase_return: Number(refundRes.rows[0]?.total_returns || 0) * 0.4,
          profit: netProfit,
          invoice_due: Number(invoiceDueRes.rows[0]?.invoice_due || 0),
          total_expenses: totalExpVal,
          low_stock_count: Number(lowStockCountRes.rows[0]?.count || 0),
          active_projects: Number(projRes.rows[0]?.active_projects || 0),
          supplier_dues: Number(duesRes.rows[0]?.supplier_dues || 0),
          total_suppliers: Number(suppCountRes.rows[0]?.count || 0),
          total_customers: Number(custCountRes.rows[0]?.count || 0),
          total_orders: Number(totalOrdersRes.rows[0]?.count || 0),
          first_time_customers: Number(custTypeRes.rows[0]?.first_time || 0),
          returning_customers: Number(custTypeRes.rows[0]?.returning || 0)
        },
        top_products: topProductsRes.rows,
        payment_breakdown: paymentMethodsRes.rows,
        recent_invoices: recentInvoicesRes.rows,
        recent_purchases: recentPurchasesRes.rows,
        recent_quotations: recentQuotationsRes.rows,
        recent_expenses: recentExpensesRes.rows,
        top_customers: topCustRes.rows,
        low_stock_items: lowStockRes.rows,
        sales_trend: salesTrendRes.rows,
        monthly_sales: monthlySalesRes.rows,
        monthly_expenses: monthlyExpRes.rows
      });
    }

    // Single business
    const todayRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as today_sales,
              COUNT(id) as today_bills
       FROM invoices
       WHERE business_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [businessId]
    );

    const rangeRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as total_sales,
              COALESCE(SUM(tax_amount), 0.00) as total_tax,
              COALESCE(SUM(cgst_amount), 0.00) as total_cgst,
              COALESCE(SUM(sgst_amount), 0.00) as total_sgst,
              COUNT(id) as total_bills
       FROM invoices
       WHERE business_id = $1 AND ${dateFilter}`,
      [businessId]
    );

    const purchaseRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as total_purchase,
              COUNT(id) as count
       FROM purchase_orders
       WHERE business_id = $1 AND ${dateFilter}`,
      [businessId]
    );

    const refundRes = await db.query(
      `SELECT COALESCE(SUM(total_refund_amount), 0.00) as total_returns,
              COUNT(id) as count
       FROM refunds
       WHERE business_id = $1 AND ${dateFilter}`,
      [businessId]
    );

    const expenseRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0.00) as total_expenses,
              COUNT(id) as count
       FROM expenses
       WHERE business_id = $1 AND ${dateFilter.replace(/created_at/g, 'date')}`,
      [businessId]
    );

    const invoiceDueRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as invoice_due
       FROM invoices
       WHERE business_id = $1 AND payment_status IN ('unpaid', 'pending', 'partial')`,
      [businessId]
    );

    const custCountRes = await db.query(`SELECT COUNT(*) as count FROM customers`);
    const suppCountRes = await db.query(`SELECT COUNT(*) as count FROM suppliers`);
    const totalOrdersRes = await db.query(`SELECT COUNT(*) as count FROM invoices WHERE business_id = $1`, [businessId]);

    const lowStockRes = await db.query(
      `SELECT p.id, p.name, p.sku, p.stock_quantity, p.low_stock_threshold, p.type, p.business_id, b.name as business_name
       FROM products p
       LEFT JOIN businesses b ON p.business_id = b.id
       WHERE p.business_id = $1 AND p.stock_quantity <= p.low_stock_threshold
       ORDER BY p.stock_quantity ASC
       LIMIT 10`,
      [businessId]
    );
    const lowStockCountRes = await db.query(
      `SELECT COUNT(*) as count FROM products WHERE business_id = $1 AND stock_quantity <= low_stock_threshold`,
      [businessId]
    );

    const projRes = await db.query(
      `SELECT COUNT(id) as active_projects
       FROM projects
       WHERE business_id = $1 AND status = 'active'`,
      [businessId]
    );

    const duesRes = await db.query(
      `SELECT COALESCE(SUM(total_amount - paid_amount), 0.00) as supplier_dues
       FROM purchase_orders
       WHERE business_id = $1 AND payment_status != 'paid'`,
      [businessId]
    );

    const topProductsRes = await db.query(
      `SELECT ii.product_name,
              SUM(ii.quantity) as total_qty,
              SUM(ii.total) as total_revenue
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE i.business_id = $1 AND ${dateFilter.replace(/\bcreated_at\b/g, 'i.created_at')}
       GROUP BY ii.product_name
       ORDER BY total_qty DESC
       LIMIT 8`,
      [businessId]
    );

    const paymentMethodsRes = await db.query(
      `SELECT payment_method,
              COUNT(id) as count,
              COALESCE(SUM(total_amount), 0.00) as total
       FROM invoices
       WHERE business_id = $1 AND ${dateFilter}
       GROUP BY payment_method`,
      [businessId]
    );

    const recentInvoicesRes = await db.query(
      `SELECT i.id, i.invoice_number, i.customer_name, i.total_amount, i.payment_method, i.payment_status, i.created_at, i.business_id, b.name as business_name
       FROM invoices i
       LEFT JOIN businesses b ON i.business_id = b.id
       WHERE i.business_id = $1
       ORDER BY i.created_at DESC
       LIMIT 10`,
      [businessId]
    );

    const recentPurchasesRes = await db.query(
      `SELECT po.id, po.po_number, COALESCE(s.name, 'Vendor') as supplier_name, po.total_amount, po.payment_status, po.created_at
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.business_id = $1
       ORDER BY po.created_at DESC
       LIMIT 10`,
      [businessId]
    );

    const recentQuotationsRes = await db.query(
      `SELECT q.id, q.quotation_number, q.customer_name, q.total_amount, q.status, q.created_at
       FROM quotations q
       WHERE q.business_id = $1
       ORDER BY q.created_at DESC
       LIMIT 10`,
      [businessId]
    );

    const recentExpensesRes = await db.query(
      `SELECT e.id, COALESCE(NULLIF(e.notes, ''), e.recipient, ec.name, 'Expense') as title, e.amount, e.payment_method, e.date as created_at, COALESCE(ec.name, 'General') as category
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.business_id = $1
       ORDER BY e.date DESC, e.created_at DESC
       LIMIT 10`,
      [businessId]
    );

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

    const topCustRes = await db.query(
      `SELECT COALESCE(customer_name, 'Walk-in Customer') as name,
              COUNT(id) as order_count,
              COALESCE(SUM(total_amount), 0.00) as total_spent
       FROM invoices
       WHERE business_id = $1
       GROUP BY customer_name
       ORDER BY total_spent DESC
       LIMIT 6`,
      [businessId]
    );

    // Monthly sales & expenses
    const monthlySalesRes = await db.query(
      `SELECT TO_CHAR(created_at, 'Mon') as month,
              EXTRACT(MONTH FROM created_at) as month_num,
              COALESCE(SUM(total_amount), 0.00) as sales
       FROM invoices
       WHERE business_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '11 months'
       GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
       ORDER BY month_num ASC`,
      [businessId]
    );

    const monthlyExpRes = await db.query(
      `SELECT TO_CHAR(date, 'Mon') as month,
              EXTRACT(MONTH FROM date) as month_num,
              COALESCE(SUM(amount), 0.00) as expenses
       FROM expenses
       WHERE business_id = $1 AND date >= CURRENT_DATE - INTERVAL '11 months'
       GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
       ORDER BY month_num ASC`,
      [businessId]
    );

    const custTypeRes = await db.query(
      `SELECT 
        COUNT(CASE WHEN order_count = 1 THEN 1 END) as first_time,
        COUNT(CASE WHEN order_count > 1 THEN 1 END) as returning
       FROM (
         SELECT customer_name, COUNT(id) as order_count 
         FROM invoices 
         WHERE business_id = $1
         GROUP BY customer_name
       ) c`,
      [businessId]
    );

    const totalSalesVal = Number(rangeRes.rows[0]?.total_sales || 0);
    const totalPurchVal = Number(purchaseRes.rows[0]?.total_purchase || 0);
    const totalExpVal = Number(expenseRes.rows[0]?.total_expenses || 0);
    const netProfit = totalSalesVal - totalPurchVal - totalExpVal;

    res.json({
      business_id: businessId,
      is_combined: false,
      range: range || 'today',
      metrics: {
        today_sales: Number(todayRes.rows[0]?.today_sales || 0),
        today_bills: Number(todayRes.rows[0]?.today_bills || 0),
        period_sales: totalSalesVal,
        period_tax: Number(rangeRes.rows[0]?.total_tax || 0),
        period_cgst: Number(rangeRes.rows[0]?.total_cgst || 0),
        period_sgst: Number(rangeRes.rows[0]?.total_sgst || 0),
        period_bills: Number(rangeRes.rows[0]?.total_bills || 0),
        total_sales_return: Number(refundRes.rows[0]?.total_returns || 0),
        total_purchase: totalPurchVal,
        total_purchase_return: Number(refundRes.rows[0]?.total_returns || 0) * 0.4,
        profit: netProfit,
        invoice_due: Number(invoiceDueRes.rows[0]?.invoice_due || 0),
        total_expenses: totalExpVal,
        low_stock_count: Number(lowStockCountRes.rows[0]?.count || 0),
        active_projects: Number(projRes.rows[0]?.active_projects || 0),
        supplier_dues: Number(duesRes.rows[0]?.supplier_dues || 0),
        total_suppliers: Number(suppCountRes.rows[0]?.count || 0),
        total_customers: Number(custCountRes.rows[0]?.count || 0),
        total_orders: Number(totalOrdersRes.rows[0]?.count || 0),
        first_time_customers: Number(custTypeRes.rows[0]?.first_time || 0),
        returning_customers: Number(custTypeRes.rows[0]?.returning || 0)
      },
      top_products: topProductsRes.rows,
      payment_breakdown: paymentMethodsRes.rows,
      recent_invoices: recentInvoicesRes.rows,
      recent_purchases: recentPurchasesRes.rows,
      recent_quotations: recentQuotationsRes.rows,
      recent_expenses: recentExpensesRes.rows,
      top_customers: topCustRes.rows,
      low_stock_items: lowStockRes.rows,
      sales_trend: salesTrendRes.rows,
      monthly_sales: monthlySalesRes.rows,
      monthly_expenses: monthlyExpRes.rows
    });
  } catch (error: any) {
    console.error('Dashboard report error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
