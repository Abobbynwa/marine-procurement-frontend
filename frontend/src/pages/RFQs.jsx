import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function RFQs() {
  const [rfqs, setRfqs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ requestId: "", title: "", deadline: "", requirements: "", vendorIds: [] });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [rfqRes, requestRes, vendorRes] = await Promise.all([
        api.get("/rfqs"),
        api.get("/purchase-requests"),
        api.get("/vendors")
      ]);
      setRfqs(rfqRes.data.rfqs || []);
      setRequests((requestRes.data.requests || []).filter((item) => item.status === "approved"));
      setVendors((vendorRes.data.vendors || []).filter((item) => item.status === "active"));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load RFQ data");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  function toggleVendor(vendorId) {
    setForm((prev) => ({
      ...prev,
      vendorIds: prev.vendorIds.includes(vendorId)
        ? prev.vendorIds.filter((id) => id !== vendorId)
        : [...prev.vendorIds, vendorId]
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/rfqs", form);
      setSuccess("RFQ created successfully");
      setForm({ requestId: "", title: "", deadline: "", requirements: "", vendorIds: [] });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create RFQ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>RFQs</h2>
          <p>Create request for quotation from approved purchase requests.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Approved Purchase Request</label>
            <select name="requestId" value={form.requestId} onChange={handleChange} required>
              <option value="">Select request</option>
              {requests.map((request) => (
                <option key={request.id} value={request.id}>{request.request_no} - {request.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label>RFQ Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div>
            <label>Deadline</label>
            <input name="deadline" type="date" value={form.deadline} onChange={handleChange} required />
          </div>
          <div>
            <label>Invite Vendors</label>
            <div className="checkbox-list">
              {vendors.map((vendor) => (
                <label key={vendor.id} className="checkbox-line">
                  <input type="checkbox" checked={form.vendorIds.includes(vendor.id)} onChange={() => toggleVendor(vendor.id)} />
                  {vendor.company_name}
                </label>
              ))}
              {vendors.length === 0 && <span className="muted-text">No active vendors yet.</span>}
            </div>
          </div>
        </div>
        <label>Requirements</label>
        <textarea name="requirements" rows="4" value={form.requirements} onChange={handleChange} />
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Creating..." : "Create RFQ"}</button>
      </form>

      <div className="panel space-top">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>RFQ No</th>
                <th>Title</th>
                <th>Request</th>
                <th>Deadline</th>
                <th>Vendors</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((rfq) => (
                <tr key={rfq.id}>
                  <td>{rfq.rfq_no}</td>
                  <td>{rfq.title}</td>
                  <td>{rfq.request_no || "-"}</td>
                  <td>{rfq.deadline}</td>
                  <td>{rfq.invited_vendors}</td>
                  <td><StatusBadge status={rfq.status} /></td>
                </tr>
              ))}
              {rfqs.length === 0 && <tr><td colSpan="6">No RFQs found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
