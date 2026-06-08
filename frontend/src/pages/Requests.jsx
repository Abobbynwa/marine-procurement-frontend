import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const canApprove = ["admin", "approver", "finance"].includes(user?.role);

  async function loadRequests() {
    try {
      const { data } = await api.get("/purchase-requests");
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load requests");
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function decide(requestId, decision) {
    setError("");
    setSuccess("");

    try {
      await api.post(`/purchase-requests/${requestId}/approval`, {
        decision,
        comment: decision === "approved" ? "Approved from portal" : "Rejected from portal"
      });
      setSuccess(`Request ${decision.replaceAll("_", " ")} successfully`);
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update request");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Purchase Requests</h2>
          <p>Requests submitted by staff and tracked through approval.</p>
        </div>
        <Link className="primary-button" to="/requests/new">Create Request</Link>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="panel">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Request No</th>
                <th>Title</th>
                <th>Category</th>
                <th>Vessel/Department</th>
                <th>Priority</th>
                <th>Budget</th>
                <th>Status</th>
                {canApprove && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.request_no}</td>
                  <td>{request.title}</td>
                  <td>{request.category}</td>
                  <td>{request.vessel_or_department || "-"}</td>
                  <td>{request.priority}</td>
                  <td>₦{Number(request.estimated_budget || 0).toLocaleString()}</td>
                  <td><StatusBadge status={request.status} /></td>
                  {canApprove && (
                    <td>
                      {!["approved", "rejected", "po_issued", "closed"].includes(request.status) ? (
                        <div className="action-row">
                          <button className="small-button success" type="button" onClick={() => decide(request.id, "approved")}>Approve</button>
                          <button className="small-button danger" type="button" onClick={() => decide(request.id, "rejected")}>Reject</button>
                        </div>
                      ) : (
                        <span className="muted-text">No action</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={canApprove ? 8 : 7}>No purchase requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
