import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({ invoiceId: "", amount: "", paymentReference: "", paymentStatus: "completed" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [paymentRes, invoiceRes] = await Promise.all([
        api.get("/payments"),
        api.get("/invoices")
      ]);
      setPayments(paymentRes.data.payments || []);
      setInvoices((invoiceRes.data.invoices || []).filter((invoice) => invoice.status !== "paid" && invoice.status !== "rejected"));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load payment data");
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
      await api.post("/payments", {
        invoiceId: form.invoiceId,
        amount: Number(form.amount || 0),
        paymentReference: form.paymentReference,
        paymentStatus: form.paymentStatus
      });
      setSuccess("Payment recorded successfully");
      setForm({ invoiceId: "", amount: "", paymentReference: "", paymentStatus: "completed" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to record payment");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, paymentStatus) {
    setError("");
    setSuccess("");
    try {
      await api.patch(`/payments/${id}/status`, { paymentStatus });
      setSuccess("Payment status updated");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update payment");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payments</h2>
          <p>Record payment references and close completed procurement workflows.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Invoice</label>
            <select name="invoiceId" value={form.invoiceId} onChange={handleChange} required>
              <option value="">Select invoice</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_no} - {invoice.company_name || "Vendor"} - ₦{Number(invoice.amount || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Amount</label>
            <input name="amount" type="number" value={form.amount} onChange={handleChange} required />
          </div>
          <div>
            <label>Payment Reference</label>
            <input name="paymentReference" value={form.paymentReference} onChange={handleChange} placeholder="Bank ref / transaction ID" />
          </div>
          <div>
            <label>Status</label>
            <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Recording..." : "Record Payment"}</button>
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
                <th>Reference</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.invoice_no}</td>
                  <td>{payment.po_no}</td>
                  <td>{payment.company_name || "-"}</td>
                  <td>₦{Number(payment.amount || 0).toLocaleString()}</td>
                  <td>{payment.payment_reference || "-"}</td>
                  <td><StatusBadge status={payment.payment_status} /></td>
                  <td>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "-"}</td>
                  <td>
                    <div className="action-row">
                      <button className="small-button success" type="button" onClick={() => updateStatus(payment.id, "completed")}>Complete</button>
                      <button className="small-button danger" type="button" onClick={() => updateStatus(payment.id, "failed")}>Fail</button>
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan="8">No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
