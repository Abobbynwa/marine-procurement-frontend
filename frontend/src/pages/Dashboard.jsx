import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [requestRes, vendorRes] = await Promise.all([
          api.get("/purchase-requests"),
          api.get("/vendors").catch(() => ({ data: { vendors: [] } }))
        ]);

        setRequests(requestRes.data.requests || []);
        setVendors(vendorRes.data.vendors || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard data");
      }
    }

    loadDashboard();
  }, []);

  const pending = requests.filter((item) => ["submitted", "pending_approval"].includes(item.status)).length;
  const approved = requests.filter((item) => item.status === "approved").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Live overview from the backend API.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card"><span>Total Requests</span><strong>{requests.length}</strong></div>
        <div className="stat-card"><span>Pending Approval</span><strong>{pending}</strong></div>
        <div className="stat-card"><span>Approved Requests</span><strong>{approved}</strong></div>
        <div className="stat-card"><span>Vendors</span><strong>{vendors.length}</strong></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Recent Purchase Requests</h3>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Request No</th>
                <th>Title</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 8).map((request) => (
                <tr key={request.id}>
                  <td>{request.request_no}</td>
                  <td>{request.title}</td>
                  <td>{request.requester_name || "-"}</td>
                  <td>{request.priority}</td>
                  <td>₦{Number(request.estimated_budget || 0).toLocaleString()}</td>
                  <td><StatusBadge status={request.status} /></td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan="6">No purchase requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
