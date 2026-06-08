import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [form, setForm] = useState({ quotationId: "", deliveryAddress: "", deliveryDeadline: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [poRes, quoteRes] = await Promise.all([
        api.get("/purchase-orders"),
        api.get("/quotations")
      ]);
      setPurchaseOrders(poRes.data.purchaseOrders || []);
      setQuotations((quoteRes.data.quotations || []).filter((item) => ["recommended", "submitted", "under_review"].includes(item.status)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load purchase order data");
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
      await api.post("/purchase-orders", {
        quotationId: form.quotationId,
        deliveryAddress: form.deliveryAddress,
        deliveryDeadline: form.deliveryDeadline || null
      });
      setSuccess("Purchase order generated successfully");
      setForm({ quotationId: "", deliveryAddress: "", deliveryDeadline: "" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create purchase order");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setError("");
    setSuccess("");
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status });
      setSuccess("Purchase order status updated");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update purchase order");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Purchase Orders</h2>
          <p>Generate purchase orders from selected vendor quotations.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Quotation</label>
            <select name="quotationId" value={form.quotationId} onChange={handleChange} required>
              <option value="">Select quotation</option>
              {quotations.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.quotation_no} - {quote.company_name} - ₦{Number(quote.total_amount || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Delivery Deadline</label>
            <input name="deliveryDeadline" type="date" value={form.deliveryDeadline} onChange={handleChange} />
          </div>
        </div>
        <label>Delivery Address</label>
        <textarea name="deliveryAddress" rows="4" value={form.deliveryAddress} onChange={handleChange} />
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Generating..." : "Generate Purchase Order"}</button>
      </form>

      <div className="panel space-top">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>PO No</th>
                <th>Request</th>
                <th>Quotation</th>
                <th>Vendor</th>
                <th>Total</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td>{po.po_no}</td>
                  <td>{po.request_no || "-"}</td>
                  <td>{po.quotation_no || "-"}</td>
                  <td>{po.company_name || "-"}</td>
                  <td>₦{Number(po.total_amount || 0).toLocaleString()}</td>
                  <td>{po.delivery_deadline || "-"}</td>
                  <td><StatusBadge status={po.status} /></td>
                  <td>
                    <div className="action-row">
                      <button className="small-button" type="button" onClick={() => updateStatus(po.id, "pending_delivery")}>Pending Delivery</button>
                      <button className="small-button success" type="button" onClick={() => updateStatus(po.id, "delivered")}>Delivered</button>
                    </div>
                  </td>
                </tr>
              ))}
              {purchaseOrders.length === 0 && <tr><td colSpan="8">No purchase orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
