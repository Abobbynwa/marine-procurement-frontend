import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [form, setForm] = useState({ poId: "", deliveryStatus: "in_transit", deliveryNoteUrl: "", comment: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [deliveryRes, poRes] = await Promise.all([
        api.get("/deliveries"),
        api.get("/purchase-orders")
      ]);
      setDeliveries(deliveryRes.data.deliveries || []);
      setPurchaseOrders((poRes.data.purchaseOrders || []).filter((po) => !["closed", "cancelled"].includes(po.status)));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load delivery data");
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
      await api.post("/deliveries", form);
      setSuccess("Delivery record created successfully");
      setForm({ poId: "", deliveryStatus: "in_transit", deliveryNoteUrl: "", comment: "" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create delivery record");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, deliveryStatus) {
    setError("");
    setSuccess("");
    try {
      await api.patch(`/deliveries/${id}/status`, { deliveryStatus });
      setSuccess("Delivery status updated");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update delivery status");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Deliveries</h2>
          <p>Track delivery progress after purchase orders are issued.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
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
            <label>Delivery Status</label>
            <select name="deliveryStatus" value={form.deliveryStatus} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="partially_delivered">Partially Delivered</option>
              <option value="delivered">Delivered</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div>
            <label>Delivery Note URL</label>
            <input name="deliveryNoteUrl" value={form.deliveryNoteUrl} onChange={handleChange} placeholder="Optional document link" />
          </div>
        </div>
        <label>Comment</label>
        <textarea name="comment" rows="4" value={form.comment} onChange={handleChange} />
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Saving..." : "Create Delivery Record"}</button>
      </form>

      <div className="panel space-top">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>PO No</th>
                <th>Vendor</th>
                <th>Received By</th>
                <th>Status</th>
                <th>Comment</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{delivery.po_no}</td>
                  <td>{delivery.company_name || "-"}</td>
                  <td>{delivery.received_by_name || "-"}</td>
                  <td><StatusBadge status={delivery.delivery_status} /></td>
                  <td>{delivery.comment || "-"}</td>
                  <td>{new Date(delivery.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-row">
                      <button className="small-button" type="button" onClick={() => updateStatus(delivery.id, "partially_delivered")}>Partial</button>
                      <button className="small-button success" type="button" onClick={() => updateStatus(delivery.id, "verified")}>Verify</button>
                    </div>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && <tr><td colSpan="7">No delivery records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
