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
    const { range, combined } = req.query; // 'today', '7days', 'month', 'year'
    const isCombined = businessId === 'combined' || businessId === 'all' || combined === 'true';

    const db = await getDb();

    const getInvoiceFilter = (prefix: string = '') => {
      const col = prefix ? `${prefix}.created_at` : 'created_at';
      if (range === '7days') return `${col} >= CURRENT_DATE - INTERVAL '7 days'`;
      if (range === 'month') return `${col} >= CURRENT_DATE - INTERVAL '30 days'`;
      if (range === 'year') return `${col} >= CURRENT_DATE - INTERVAL '365 days'`;
      return `${col} >= CURRENT_DATE`;
    };

    const getExpenseFilter = (prefix: string = '') => {
      const dCol = prefix ? `${prefix}.date` : 'date';
      const cCol = prefix ? `${prefix}.created_at` : 'created_at';
      if (range === '7days') return `(${dCol} >= CURRENT_DATE - INTERVAL '7 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '7 days'))`;
      if (range === 'month') return `(${dCol} >= CURRENT_DATE - INTERVAL '30 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '30 days'))`;
      if (range === 'year') return `(${dCol} >= CURRENT_DATE - INTERVAL '365 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '365 days'))`;
      return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE))`;
    };

    const getLossFilter = (prefix: string = '') => {
      const dCol = prefix ? `${prefix}.damage_date` : 'damage_date';
      const cCol = prefix ? `${prefix}.created_at` : 'created_at';
      if (range === '7days') return `(${dCol} >= CURRENT_DATE - INTERVAL '7 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '7 days'))`;
      if (range === 'month') return `(${dCol} >= CURRENT_DATE - INTERVAL '30 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '30 days'))`;
      if (range === 'year') return `(${dCol} >= CURRENT_DATE - INTERVAL '365 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '365 days'))`;
      return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE))`;
    };

    const getWhDamageFilter = (prefix: string = '') => {
      const dCol = prefix ? `${prefix}.transaction_date` : 'transaction_date';
      const cCol = prefix ? `${prefix}.created_at` : 'created_at';
      if (range === '7days') return `(${dCol} >= CURRENT_DATE - INTERVAL '7 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '7 days'))`;
      if (range === 'month') return `(${dCol} >= CURRENT_DATE - INTERVAL '30 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '30 days'))`;
      if (range === 'year') return `(${dCol} >= CURRENT_DATE - INTERVAL '365 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '365 days'))`;
      return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE))`;
    };

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
         WHERE ${getInvoiceFilter()}`
      );

      // 2b. Total Expenses in Filtered Range
      const expenseRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0.00) as total_expenses,
                COUNT(id) as total_expense_count
         FROM expenses
         WHERE ${getExpenseFilter()}`
      );

      // 2c. Total Damage / Inventory Losses in Filtered Range (Shop Losses + Warehouse Damages)
      const damageRes = await db.query(
        `SELECT (
           COALESCE((SELECT SUM(loss_amount) FROM inventory_losses WHERE ${getLossFilter()}), 0.00)
           +
           COALESCE((SELECT SUM(total_amount) FROM warehouse_transactions WHERE type = 'damage' AND ${getWhDamageFilter()}), 0.00)
         ) as total_damage`
      );

      // 2d. Business-specific breakdown for the range
      const bizBreakdownRes = await db.query(
        `SELECT b.id as business_id,
                b.name as business_name,
                COALESCE(inv.total_sales, 0.00) as total_sales,
                COALESCE(inv.total_tax, 0.00) as total_tax,
                COALESCE(inv.total_bills, 0) as total_bills,
                COALESCE(exp.total_expenses, 0.00) as total_expenses,
                COALESCE(dmg.total_damage, 0.00) as total_damage,
                (COALESCE(inv.total_sales, 0.00) - COALESCE(exp.total_expenses, 0.00) - COALESCE(dmg.total_damage, 0.00)) as net_profit
         FROM businesses b
         LEFT JOIN (
           SELECT business_id,
                  SUM(total_amount) as total_sales,
                  SUM(tax_amount) as total_tax,
                  COUNT(id) as total_bills
           FROM invoices
           WHERE ${getInvoiceFilter()}
           GROUP BY business_id
         ) inv ON b.id = inv.business_id
         LEFT JOIN (
           SELECT business_id,
                  SUM(amount) as total_expenses
           FROM expenses
           WHERE ${getExpenseFilter()}
           GROUP BY business_id
         ) exp ON b.id = exp.business_id
         LEFT JOIN (
           SELECT business_id,
                  SUM(loss_amount) as total_damage
           FROM inventory_losses
           WHERE ${getLossFilter()}
           GROUP BY business_id
         ) dmg ON b.id = dmg.business_id`
      );

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
         WHERE ${getInvoiceFilter('i')}
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
         WHERE ${getInvoiceFilter()}
         GROUP BY payment_method
         ORDER BY total DESC`
      );

      // 7b. Top Expense Categories
      const topExpensesRes = await db.query(
        `SELECT COALESCE(ec.name, 'General Expenses') as category_name,
                COUNT(e.id) as count,
                COALESCE(SUM(e.amount), 0.00) as total_amount
         FROM expenses e
         LEFT JOIN expense_categories ec ON e.category_id = ec.id
         WHERE ${getExpenseFilter('e')}
         GROUP BY COALESCE(ec.name, 'General Expenses')
         ORDER BY total_amount DESC
         LIMIT 6`
      );

      // 7c. Top Damage Reasons
      const topDamagesRes = await db.query(
        `SELECT reason,
                COUNT(id) as occurrences,
                COALESCE(SUM(quantity), 0) as units_lost,
                COALESCE(SUM(loss_amount), 0.00) as total_amount
         FROM inventory_losses
         WHERE ${getLossFilter()}
         GROUP BY reason
         ORDER BY total_amount DESC
         LIMIT 6`
      );

      // 8. Recent Invoices across businesses
      const recentInvoicesRes = await db.query(
        `SELECT i.id, i.invoice_number, i.customer_name, i.total_amount, i.payment_method, i.payment_status, i.created_at, i.business_id, b.name as business_name
         FROM invoices i
         LEFT JOIN businesses b ON i.business_id = b.id
         ORDER BY i.created_at DESC
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

      const periodSales = Number(rangeRes.rows[0]?.total_sales || 0);
      const periodExpenses = Number(expenseRes.rows[0]?.total_expenses || 0);
      const periodDamage = Number(damageRes.rows[0]?.total_damage || 0);
      const periodNetProfit = Number((periodSales - periodExpenses - periodDamage).toFixed(2));

      return res.json({
        business_id: 'combined',
        is_combined: true,
        range: range || 'today',
        metrics: {
          today_sales: Number(todayRes.rows[0]?.today_sales || 0),
          today_bills: Number(todayRes.rows[0]?.today_bills || 0),
          period_sales: periodSales,
          period_expenses: periodExpenses,
          period_damage: periodDamage,
          period_net_profit: periodNetProfit,
          period_tax: Number(rangeRes.rows[0]?.total_tax || 0),
          period_cgst: Number(rangeRes.rows[0]?.total_cgst || 0),
          period_sgst: Number(rangeRes.rows[0]?.total_sgst || 0),
          period_bills: Number(rangeRes.rows[0]?.total_bills || 0),
          low_stock_count: Number(lowStockCountRes.rows[0]?.count || 0),
          active_projects: Number(projRes.rows[0]?.active_projects || 0),
          supplier_dues: Number(duesRes.rows[0]?.supplier_dues || 0)
        },
        business_breakdown: bizBreakdownRes.rows,
        top_products: topProductsRes.rows,
        top_expenses: topExpensesRes.rows,
        top_damages: topDamagesRes.rows,
        payment_breakdown: paymentMethodsRes.rows,
        recent_invoices: recentInvoicesRes.rows,
        low_stock_items: lowStockRes.rows,
        sales_trend: salesTrendRes.rows
      });
    }

    // 1. Today's Revenue & Bills Count (Single business)
    const todayRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as today_sales,
              COUNT(id) as today_bills
       FROM invoices
       WHERE business_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [businessId]
    );

    // 2. Filtered Range Revenue (Single business)
    const rangeRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as total_sales,
              COALESCE(SUM(tax_amount), 0.00) as total_tax,
              COALESCE(SUM(cgst_amount), 0.00) as total_cgst,
              COALESCE(SUM(sgst_amount), 0.00) as total_sgst,
              COUNT(id) as total_bills
       FROM invoices
       WHERE business_id = $1 AND ${getInvoiceFilter()}`,
      [businessId]
    );

    // 2b. Total Expenses in Filtered Range (Single business)
    const expenseRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0.00) as total_expenses,
              COUNT(id) as total_expense_count
       FROM expenses
       WHERE business_id = $1 AND ${getExpenseFilter()}`,
      [businessId]
    );

    // 2c. Total Damage / Inventory Losses in Filtered Range (Single business)
    const damageRes = await db.query(
      `SELECT (
         COALESCE((SELECT SUM(loss_amount) FROM inventory_losses WHERE business_id = $1 AND ${getLossFilter()}), 0.00)
         +
         COALESCE((SELECT SUM(total_amount) FROM warehouse_transactions WHERE business_id = $1 AND type = 'damage' AND ${getWhDamageFilter()}), 0.00)
       ) as total_damage`,
      [businessId]
    );

    // 3. Low stock alerts count & items
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
       WHERE i.business_id = $1 AND ${getInvoiceFilter('i')}
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
       WHERE business_id = $1 AND ${getInvoiceFilter()}
       GROUP BY payment_method`,
      [businessId]
    );

    // 7b. Top Expense Categories
    const topExpensesRes = await db.query(
      `SELECT COALESCE(ec.name, 'General Expenses') as category_name,
              COUNT(e.id) as count,
              COALESCE(SUM(e.amount), 0.00) as total_amount
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.id
       WHERE e.business_id = $1 AND ${getExpenseFilter('e')}
       GROUP BY COALESCE(ec.name, 'General Expenses')
       ORDER BY total_amount DESC
       LIMIT 6`,
      [businessId]
    );

    // 7c. Top Damage Reasons
    const topDamagesRes = await db.query(
      `SELECT reason,
              COUNT(id) as occurrences,
              COALESCE(SUM(quantity), 0) as units_lost,
              COALESCE(SUM(loss_amount), 0.00) as total_amount
       FROM inventory_losses
       WHERE business_id = $1 AND ${getLossFilter()}
       GROUP BY reason
       ORDER BY total_amount DESC
       LIMIT 6`,
      [businessId]
    );

    // 8. Recent Invoices
    const recentInvoicesRes = await db.query(
      `SELECT i.id, i.invoice_number, i.customer_name, i.total_amount, i.payment_method, i.payment_status, i.created_at, i.business_id, b.name as business_name
       FROM invoices i
       LEFT JOIN businesses b ON i.business_id = b.id
       WHERE i.business_id = $1
       ORDER BY i.created_at DESC
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

    const periodSales = Number(rangeRes.rows[0]?.total_sales || 0);
    const periodExpenses = Number(expenseRes.rows[0]?.total_expenses || 0);
    const periodDamage = Number(damageRes.rows[0]?.total_damage || 0);
    const periodNetProfit = Number((periodSales - periodExpenses - periodDamage).toFixed(2));

    res.json({
      business_id: businessId,
      is_combined: false,
      range: range || 'today',
      metrics: {
        today_sales: Number(todayRes.rows[0]?.today_sales || 0),
        today_bills: Number(todayRes.rows[0]?.today_bills || 0),
        period_sales: periodSales,
        period_expenses: periodExpenses,
        period_damage: periodDamage,
        period_net_profit: periodNetProfit,
        period_tax: Number(rangeRes.rows[0]?.total_tax || 0),
        period_cgst: Number(rangeRes.rows[0]?.total_cgst || 0),
        period_sgst: Number(rangeRes.rows[0]?.total_sgst || 0),
        period_bills: Number(rangeRes.rows[0]?.total_bills || 0),
        low_stock_count: Number(lowStockCountRes.rows[0]?.count || 0),
        active_projects: Number(projRes.rows[0]?.active_projects || 0),
        supplier_dues: Number(duesRes.rows[0]?.supplier_dues || 0)
      },
      top_products: topProductsRes.rows,
      top_expenses: topExpensesRes.rows,
      top_damages: topDamagesRes.rows,
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
