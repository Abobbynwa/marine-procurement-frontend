import { query } from "../config/db.js";

export async function getDashboardReport(req, res, next) {
  try {
    const [
      requests,
      vendors,
      rfqs,
      quotations,
      purchaseOrders,
      deliveries,
      invoices,
      payments,
      requestStatuses,
      monthlySpend
    ] = await Promise.all([
      query("SELECT COUNT(*)::int AS total FROM purchase_requests"),
      query("SELECT COUNT(*)::int AS total FROM vendors"),
      query("SELECT COUNT(*)::int AS total FROM rfqs"),
      query("SELECT COUNT(*)::int AS total FROM quotations"),
      query("SELECT COUNT(*)::int AS total, COALESCE(SUM(total_amount),0)::numeric AS value FROM purchase_orders"),
      query("SELECT COUNT(*)::int AS total FROM deliveries"),
      query("SELECT COUNT(*)::int AS total, COALESCE(SUM(amount),0)::numeric AS value FROM invoices"),
      query("SELECT COUNT(*)::int AS total, COALESCE(SUM(amount),0)::numeric AS value FROM payments WHERE payment_status = 'completed'"),
      query("SELECT status, COUNT(*)::int AS total FROM purchase_requests GROUP BY status ORDER BY total DESC"),
      query(
        `SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COALESCE(SUM(total_amount),0)::numeric AS total
         FROM purchase_orders
         GROUP BY TO_CHAR(created_at, 'YYYY-MM')
         ORDER BY month DESC
         LIMIT 6`
      )
    ]);

    res.json({
      totals: {
        requests: requests.rows[0].total,
        vendors: vendors.rows[0].total,
        rfqs: rfqs.rows[0].total,
        quotations: quotations.rows[0].total,
        purchaseOrders: purchaseOrders.rows[0].total,
        purchaseOrderValue: purchaseOrders.rows[0].value,
        deliveries: deliveries.rows[0].total,
        invoices: invoices.rows[0].total,
        invoiceValue: invoices.rows[0].value,
        payments: payments.rows[0].total,
        paymentValue: payments.rows[0].value
      },
      requestStatuses: requestStatuses.rows,
      monthlySpend: monthlySpend.rows
    });
  } catch (error) {
    next(error);
  }
}
