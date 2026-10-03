import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';

const router = Router();

// POST /api/reports/purge-dump-data
router.post('/purge-dump-data', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.exec(`DELETE FROM invoice_items;`);
    await db.exec(`DELETE FROM invoices;`);
    await db.exec(`DELETE FROM challan_items;`);
    await db.exec(`DELETE FROM delivery_challans;`);
    await db.exec(`DELETE FROM quotation_items;`);
    await db.exec(`DELETE FROM quotations;`);
    await db.exec(`DELETE FROM expenses;`);
    try { await db.exec(`DELETE FROM expense_categories;`); } catch (e) {}
    await db.exec(`DELETE FROM inventory_losses;`);
    await db.exec(`DELETE FROM warehouse_transactions;`);
    await db.exec(`DELETE FROM warehouse_stocks;`);
    await db.exec(`DELETE FROM stock_movements;`);
    try { await db.exec(`DELETE FROM refund_items;`); } catch (e) {}
    try { await db.exec(`DELETE FROM refunds;`); } catch (e) {}
    try { await db.exec(`DELETE FROM purchase_order_items;`); } catch (e) {}
    try { await db.exec(`DELETE FROM purchase_orders;`); } catch (e) {}
    try { await db.exec(`DELETE FROM project_daily_tasks;`); } catch (e) {}
    try { await db.exec(`DELETE FROM supervisor_updates;`); } catch (e) {}
    try { await db.exec(`DELETE FROM projects;`); } catch (e) {}
    await db.exec(`DELETE FROM customers;`);
    await db.exec(`DELETE FROM suppliers;`);
    await db.exec(`DELETE FROM products;`);
    try { await db.exec(`DELETE FROM subcategories;`); } catch (e) {}
    await db.exec(`DELETE FROM categories;`);
    try { await db.exec(`DELETE FROM inventory_modules;`); } catch (e) {}
    res.json({ success: true, message: 'All dump products, categories, subcategories and transaction data purged successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

    const getInvoiceFilter = (prefix: string = '') => {
      const col = prefix ? `${prefix}.created_at` : 'created_at';
      if (start && end) return `DATE(${col}) >= '${start}' AND DATE(${col}) <= '${end}'`;
      if (range === '1D' || range === 'today') return `DATE(${col}) = CURRENT_DATE`;
      if (range === '1W' || range === '7days') return `${col} >= CURRENT_DATE - INTERVAL '7 days'`;
      if (range === '1M' || range === 'month') return `${col} >= CURRENT_DATE - INTERVAL '30 days'`;
      if (range === '3M') return `${col} >= CURRENT_DATE - INTERVAL '90 days'`;
      if (range === '6M') return `${col} >= CURRENT_DATE - INTERVAL '180 days'`;
      if (range === '1Y' || range === 'year') return `${col} >= CURRENT_DATE - INTERVAL '365 days'`;
      if (range === 'ALL' || range === 'all') return `1=1`;
      return `DATE(${col}) = CURRENT_DATE`;
    };

    const getExpenseFilter = (prefix: string = '') => {
      const dCol = prefix ? `${prefix}.date` : 'date';
      const cCol = prefix ? `${prefix}.created_at` : 'created_at';
      if (start && end) return `((${dCol} >= '${start}' AND ${dCol} <= '${end}') OR (${dCol} IS NULL AND DATE(${cCol}) >= '${start}' AND DATE(${cCol}) <= '${end}'))`;
      if (range === '1D' || range === 'today') return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND DATE(${cCol}) = CURRENT_DATE))`;
      if (range === '1W' || range === '7days') return `(${dCol} >= CURRENT_DATE - INTERVAL '7 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '7 days'))`;
      if (range === '1M' || range === 'month') return `(${dCol} >= CURRENT_DATE - INTERVAL '30 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '30 days'))`;
      if (range === '3M') return `(${dCol} >= CURRENT_DATE - INTERVAL '90 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '90 days'))`;
      if (range === '6M') return `(${dCol} >= CURRENT_DATE - INTERVAL '180 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '180 days'))`;
      if (range === '1Y' || range === 'year') return `(${dCol} >= CURRENT_DATE - INTERVAL '365 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '365 days'))`;
      if (range === 'ALL' || range === 'all') return `1=1`;
      return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND DATE(${cCol}) = CURRENT_DATE))`;
    };

    const getLossFilter = (prefix: string = '') => {
      const dCol = prefix ? `${prefix}.damage_date` : 'damage_date';
      const cCol = prefix ? `${prefix}.created_at` : 'created_at';
      if (start && end) return `((${dCol} >= '${start}' AND ${dCol} <= '${end}') OR (${dCol} IS NULL AND DATE(${cCol}) >= '${start}' AND DATE(${cCol}) <= '${end}'))`;
      if (range === '1D' || range === 'today') return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND DATE(${cCol}) = CURRENT_DATE))`;
      if (range === '1W' || range === '7days') return `(${dCol} >= CURRENT_DATE - INTERVAL '7 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '7 days'))`;
      if (range === '1M' || range === 'month') return `(${dCol} >= CURRENT_DATE - INTERVAL '30 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '30 days'))`;
      if (range === '3M') return `(${dCol} >= CURRENT_DATE - INTERVAL '90 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '90 days'))`;
      if (range === '6M') return `(${dCol} >= CURRENT_DATE - INTERVAL '180 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '180 days'))`;
      if (range === '1Y' || range === 'year') return `(${dCol} >= CURRENT_DATE - INTERVAL '365 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '365 days'))`;
      if (range === 'ALL' || range === 'all') return `1=1`;
      return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND DATE(${cCol}) = CURRENT_DATE))`;
    };

    const getWhDamageFilter = (prefix: string = '') => {
      const dCol = prefix ? `${prefix}.transaction_date` : 'transaction_date';
      const cCol = prefix ? `${prefix}.created_at` : 'created_at';
      if (start && end) return `((${dCol} >= '${start}' AND ${dCol} <= '${end}') OR (${dCol} IS NULL AND DATE(${cCol}) >= '${start}' AND DATE(${cCol}) <= '${end}'))`;
      if (range === '1D' || range === 'today') return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND DATE(${cCol}) = CURRENT_DATE))`;
      if (range === '1W' || range === '7days') return `(${dCol} >= CURRENT_DATE - INTERVAL '7 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '7 days'))`;
      if (range === '1M' || range === 'month') return `(${dCol} >= CURRENT_DATE - INTERVAL '30 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '30 days'))`;
      if (range === '3M') return `(${dCol} >= CURRENT_DATE - INTERVAL '90 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '90 days'))`;
      if (range === '6M') return `(${dCol} >= CURRENT_DATE - INTERVAL '180 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '180 days'))`;
      if (range === '1Y' || range === 'year') return `(${dCol} >= CURRENT_DATE - INTERVAL '365 days' OR (${dCol} IS NULL AND ${cCol} >= CURRENT_DATE - INTERVAL '365 days'))`;
      if (range === 'ALL' || range === 'all') return `1=1`;
      return `(${dCol} = CURRENT_DATE OR (${dCol} IS NULL AND DATE(${cCol}) = CURRENT_DATE))`;
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
         ) dmg ON b.id = dmg.business_id
         ORDER BY b.name ASC`
      );

      // 3. Purchase Orders
      const purchaseRes = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0.00) as total_purchase
         FROM purchase_orders`
      );

      // 4. Returns
      const refundRes = await db.query(
        `SELECT COALESCE(SUM(total_refund_amount), 0.00) as total_returns
         FROM refunds`
      );

      // 5. Invoices Due
      const invoiceDueRes = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0.00) as invoice_due
         FROM invoices
         WHERE payment_status IN ('unpaid', 'pending', 'partial')`
      );

      // Low Stock Count
      const lowStockCountRes = await db.query(
        `SELECT COUNT(id) as count
         FROM products
         WHERE stock_quantity <= COALESCE(low_stock_threshold, 5)`
      );

      // Low Stock Items
      const lowStockRes = await db.query(
        `SELECT p.id, p.name, p.sku, p.stock_quantity, p.low_stock_threshold, p.business_id, b.name as business_name
         FROM products p
         LEFT JOIN businesses b ON p.business_id = b.id
         WHERE p.stock_quantity <= COALESCE(p.low_stock_threshold, 5)
         ORDER BY p.stock_quantity ASC
         LIMIT 10`
      );

      // Active Projects
      const projRes = await db.query(
        `SELECT COUNT(id) as active_projects
         FROM projects
         WHERE status = 'active'`
      );

      // Supplier Dues
      const duesRes = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0.00) as supplier_dues
         FROM purchase_orders
         WHERE payment_status IN ('unpaid', 'pending', 'partial')`
      );

      // Total Suppliers & Customers & Orders
      const suppCountRes = await db.query(`SELECT COUNT(id) as count FROM suppliers`);
      const custCountRes = await db.query(`SELECT COUNT(id) as count FROM customers`);
      const totalOrdersRes = await db.query(`SELECT COUNT(id) as count FROM invoices`);

      // 6. Top Selling Products
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
      const periodDamage = Number(damageRes.rows[0]?.total_damage || 0);
      const netProfit = Number((totalSalesVal - totalExpVal - periodDamage).toFixed(2));

      return res.json({
        business_id: 'combined',
        is_combined: true,
        range: range || 'today',
        metrics: {
          today_sales: Number(todayRes.rows[0]?.today_sales || 0),
          today_bills: Number(todayRes.rows[0]?.today_bills || 0),
          period_sales: totalSalesVal,
          period_expenses: totalExpVal,
          period_damage: periodDamage,
          period_net_profit: netProfit,
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
        business_breakdown: bizBreakdownRes.rows,
        top_products: topProductsRes.rows,
        top_expenses: topExpensesRes.rows,
        top_damages: topDamagesRes.rows,
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
       WHERE business_id = $1 AND ${getInvoiceFilter()}`,
      [businessId]
    );

    // Total Expenses in Filtered Range (Single business)
    const expenseRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0.00) as total_expenses,
              COUNT(id) as total_expense_count
       FROM expenses
       WHERE business_id = $1 AND ${getExpenseFilter()}`,
      [businessId]
    );

    // Total Damage / Inventory Losses in Filtered Range (Single business)
    const damageRes = await db.query(
      `SELECT (
         COALESCE((SELECT SUM(loss_amount) FROM inventory_losses WHERE business_id = $1 AND ${getLossFilter()}), 0.00)
         +
         COALESCE((SELECT SUM(total_amount) FROM warehouse_transactions WHERE business_id = $1 AND type = 'damage' AND ${getWhDamageFilter()}), 0.00)
       ) as total_damage`,
      [businessId]
    );

    const purchaseRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as total_purchase
       FROM purchase_orders
       WHERE business_id = $1`,
      [businessId]
    );

    const refundRes = await db.query(
      `SELECT COALESCE(SUM(total_refund_amount), 0.00) as total_returns
       FROM refunds
       WHERE business_id = $1`,
      [businessId]
    );

    const invoiceDueRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as invoice_due
       FROM invoices
       WHERE business_id = $1 AND payment_status IN ('unpaid', 'pending', 'partial')`,
      [businessId]
    );

    const lowStockCountRes = await db.query(
      `SELECT COUNT(id) as count
       FROM products
       WHERE business_id = $1 AND stock_quantity <= COALESCE(low_stock_threshold, 5)`,
      [businessId]
    );

    const lowStockRes = await db.query(
      `SELECT p.id, p.name, p.sku, p.stock_quantity, p.low_stock_threshold, p.business_id, b.name as business_name
       FROM products p
       LEFT JOIN businesses b ON p.business_id = b.id
       WHERE p.business_id = $1 AND p.stock_quantity <= COALESCE(p.low_stock_threshold, 5)
       ORDER BY p.stock_quantity ASC
       LIMIT 8`,
      [businessId]
    );

    const projRes = await db.query(
      `SELECT COUNT(id) as active_projects
       FROM projects
       WHERE business_id = $1 AND status = 'active'`,
      [businessId]
    );

    const duesRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) as supplier_dues
       FROM purchase_orders
       WHERE business_id = $1 AND payment_status IN ('unpaid', 'pending', 'partial')`,
      [businessId]
    );

    const suppCountRes = await db.query(`SELECT COUNT(id) as count FROM suppliers`);
    const custCountRes = await db.query(`SELECT COUNT(id) as count FROM customers`);
    const totalOrdersRes = await db.query(`SELECT COUNT(id) as count FROM invoices WHERE business_id = $1`, [businessId]);

    const topProductsRes = await db.query(
      `SELECT ii.product_name,
              SUM(ii.quantity) as total_qty,
              SUM(ii.total) as total_revenue
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE i.business_id = $1 AND ${getInvoiceFilter('i')}
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
       WHERE business_id = $1 AND ${getInvoiceFilter()}
       GROUP BY payment_method`,
      [businessId]
    );

    // Top Expense Categories
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

    // Top Damage Reasons
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
    const periodDamage = Number(damageRes.rows[0]?.total_damage || 0);
    const netProfit = Number((totalSalesVal - totalExpVal - periodDamage).toFixed(2));

    res.json({
      business_id: businessId,
      is_combined: false,
      range: range || 'today',
      metrics: {
        today_sales: Number(todayRes.rows[0]?.today_sales || 0),
        today_bills: Number(todayRes.rows[0]?.today_bills || 0),
        period_sales: totalSalesVal,
        period_expenses: totalExpVal,
        period_damage: periodDamage,
        period_net_profit: netProfit,
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
      top_expenses: topExpensesRes.rows,
      top_damages: topDamagesRes.rows,
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

// GET /api/reports/sales
router.get('/sales', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const isCombined = businessId === 'combined' || businessId === 'all';

    const query = `
      SELECT 
        p.id,
        p.name as product_name,
        p.sku,
        COALESCE(c.name, 'General') as category,
        p.image_url,
        COALESCE(p.stock_quantity, 0) as instock_qty,
        COALESCE(SUM(ii.quantity), 0) as sold_qty,
        COALESCE(SUM(ii.total), 0) as sold_amount
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN invoice_items ii ON ii.product_id = p.id
      LEFT JOIN invoices inv ON ii.invoice_id = inv.id
      WHERE (${isCombined ? 'TRUE' : 'p.business_id = $1'})
      GROUP BY p.id, p.name, p.sku, c.name, p.image_url, p.stock_quantity
      ORDER BY sold_amount DESC
    `;
    const params = isCombined ? [] : [businessId];
    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/purchases
router.get('/purchases', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const isCombined = businessId === 'combined' || businessId === 'all';

    const query = `
      SELECT 
        poi.product_name,
        p.sku,
        s.name as supplier_name,
        COALESCE(SUM(poi.quantity), 0) as purchased_qty,
        COALESCE(SUM(poi.total), 0) as purchased_amount,
        COALESCE(p.stock_quantity, 0) as instock_qty
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.po_id = po.id
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE (${isCombined ? 'TRUE' : 'po.business_id = $1'})
      GROUP BY poi.product_name, p.sku, s.name, p.stock_quantity
      ORDER BY purchased_amount DESC
    `;
    const params = isCombined ? [] : [businessId];
    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/inventory
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const isCombined = businessId === 'combined' || businessId === 'all';

    const query = `
      SELECT 
        p.id,
        p.name as product_name,
        p.sku,
        COALESCE(c.name, 'General') as category,
        p.cost_price,
        p.sale_price,
        p.stock_quantity as instock_qty,
        p.low_stock_threshold,
        (p.cost_price * p.stock_quantity) as total_cost_value,
        (p.sale_price * p.stock_quantity) as total_sale_value,
        CASE WHEN p.stock_quantity <= p.low_stock_threshold THEN 'Low Stock' ELSE 'In Stock' END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE (${isCombined ? 'TRUE' : 'p.business_id = $1'})
      ORDER BY p.name ASC
    `;
    const params = isCombined ? [] : [businessId];
    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/profit-loss
router.get('/profit-loss', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const isCombined = businessId === 'combined' || businessId === 'all';
    const params = isCombined ? [] : [businessId];

    // Sales Revenue
    const salesRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_sales, COALESCE(SUM(tax_amount), 0) as total_tax FROM invoices WHERE (${isCombined ? 'TRUE' : 'business_id = $1'})`,
      params
    );
    const totalSales = Number(salesRes.rows[0]?.total_sales || 0);

    // COGS: estimated 50% or based on product cost_price
    const cogsRes = await db.query(
      `SELECT COALESCE(SUM(ii.quantity * p.cost_price), 0) as cogs
       FROM invoice_items ii
       JOIN invoices inv ON ii.invoice_id = inv.id
       JOIN products p ON ii.product_id = p.id
       WHERE (${isCombined ? 'TRUE' : 'inv.business_id = $1'})`,
      params
    );
    const cogs = Number(cogsRes.rows[0]?.cogs || 0) || (totalSales * 0.45);
    const grossProfit = totalSales - cogs;

    // Expenses
    const expRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE (${isCombined ? 'TRUE' : 'business_id = $1'})`,
      params
    );
    const totalExpenses = Number(expRes.rows[0]?.total_expenses || 0);

    // Damages
    const dmgRes = await db.query(
      `SELECT COALESCE(SUM(loss_amount), 0) as total_losses FROM inventory_losses WHERE (${isCombined ? 'TRUE' : 'business_id = $1'})`,
      params
    );
    const totalLosses = Number(dmgRes.rows[0]?.total_losses || 0);

    const netProfit = grossProfit - totalExpenses - totalLosses;

    res.json({
      total_sales: totalSales,
      cogs: cogs,
      gross_profit: grossProfit,
      total_expenses: totalExpenses,
      total_losses: totalLosses,
      net_profit: netProfit,
      profit_margin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : '0.00'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/customers
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query(`
      SELECT 
        c.id,
        c.name as customer_name,
        c.phone,
        c.email,
        COUNT(inv.id) as total_orders,
        COALESCE(SUM(inv.total_amount), 0) as total_spent,
        COALESCE(SUM(inv.total_amount - inv.tax_amount), 0) as subtotal_spent
      FROM customers c
      LEFT JOIN invoices inv ON inv.customer_id = c.id
      GROUP BY c.id, c.name, c.phone, c.email
      ORDER BY total_spent DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/tax
router.get('/tax', async (req: Request, res: Response) => {
  try {
    const businessId = getBusinessId(req);
    const db = await getDb();
    const isCombined = businessId === 'combined' || businessId === 'all';
    const params = isCombined ? [] : [businessId];

    const result = await db.query(`
      SELECT 
        inv.id,
        inv.invoice_number,
        inv.created_at,
        inv.customer_name,
        inv.subtotal as taxable_amount,
        inv.cgst_amount,
        inv.sgst_amount,
        inv.tax_amount as total_tax,
        inv.total_amount
      FROM invoices inv
      WHERE (${isCombined ? 'TRUE' : 'inv.business_id = $1'})
      ORDER BY inv.created_at DESC
    `, params);

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
