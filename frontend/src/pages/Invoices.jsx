import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [form, setForm] = useState({ invoiceNo: "", poId: "", amount: "", invoiceUrl: "", status: "received" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [invoiceRes, poRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/purchase-orders")
      ]);
      setInvoices(invoiceRes.data.invoices || []);
      setPurchaseOrders((poRes.data.purchaseOrders || []).filter((po) => ["delivered", "partially_delivered", "issued", "pending_delivery"].includes(po.status)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load invoice data");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/invoices", {
        invoiceNo: form.invoiceNo,
        poId: form.poId,
        amount: Number(form.amount || 0),
        invoiceUrl: form.invoiceUrl,
        status: form.status
      });
      setSuccess("Invoice created successfully");
      setForm({ invoiceNo: "", poId: "", amount: "", invoiceUrl: "", status: "received" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create invoice");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setError("");
    setSuccess("");
    try {
      await api.patch(`/invoices/${id}/status`, { status });
      setSuccess("Invoice status updated");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update invoice");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Invoices</h2>
          <p>Record vendor invoices and verify payment readiness.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Invoice Number</label>
            <input name="invoiceNo" value={form.invoiceNo} onChange={handleChange} required />
          </div>
          <div>
            <label>Purchase Order</label>
            <select name="poId" value={form.poId} onChange={handleChange} required>
              <option value="">Select PO</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>{po.po_no} - {po.company_name || "Vendor"}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Amount</label>
            <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
          </div>
          <div>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="received">Received</option>
              <option value="verified">Verified</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label>Invoice URL</label>
            <input name="invoiceUrl" value={form.invoiceUrl} onChange={handleChange} placeholder="Optional document link" />
          </div>
        </div>
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Saving..." : "Create Invoice"}</button>
      </form>

      <div className="panel space-top">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>PO No</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoice_no}</td>
                  <td>{invoice.po_no}</td>
                  <td>{invoice.company_name || "-"}</td>
                  <td>₦{Number(invoice.amount || 0).toLocaleString()}</td>
                  <td><StatusBadge status={invoice.status} /></td>
                  <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-row">
                      <button className="small-button" type="button" onClick={() => updateStatus(invoice.id, "verified")}>Verify</button>
                      <button className="small-button success" type="button" onClick={() => updateStatus(invoice.id, "payment_pending")}>Payment Pending</button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan="7">No invoices found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
