import { useEffect, useState } from "react";
import api from "../services/api.js";

function formatCurrency(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function Reports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        const { data } = await api.get("/reports/dashboard");
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load reports");
      }
    }

    loadReport();
  }, []);

  const totals = report?.totals || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p>Management summary of procurement activity, spending, invoices, and payments.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card"><span>Requests</span><strong>{totals.requests || 0}</strong></div>
        <div className="stat-card"><span>Vendors</span><strong>{totals.vendors || 0}</strong></div>
        <div className="stat-card"><span>RFQs</span><strong>{totals.rfqs || 0}</strong></div>
        <div className="stat-card"><span>Quotations</span><strong>{totals.quotations || 0}</strong></div>
        <div className="stat-card"><span>Purchase Orders</span><strong>{totals.purchaseOrders || 0}</strong></div>
        <div className="stat-card"><span>PO Value</span><strong>{formatCurrency(totals.purchaseOrderValue)}</strong></div>
        <div className="stat-card"><span>Invoice Value</span><strong>{formatCurrency(totals.invoiceValue)}</strong></div>
        <div className="stat-card"><span>Paid Value</span><strong>{formatCurrency(totals.paymentValue)}</strong></div>
      </div>

      <div className="report-grid">
        <div className="panel">
          <div className="panel-header"><h3>Request Status Breakdown</h3></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {(report?.requestStatuses || []).map((item) => (
                  <tr key={item.status}><td>{item.status.replaceAll("_", " ")}</td><td>{item.total}</td></tr>
                ))}
                {!report?.requestStatuses?.length && <tr><td colSpan="2">No request status data yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h3>Monthly PO Spend</h3></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Month</th><th>Total Spend</th></tr></thead>
              <tbody>
                {(report?.monthlySpend || []).map((item) => (
                  <tr key={item.month}><td>{item.month}</td><td>{formatCurrency(item.total)}</td></tr>
                ))}
                {!report?.monthlySpend?.length && <tr><td colSpan="2">No monthly spend data yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
