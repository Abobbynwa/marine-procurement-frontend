import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

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
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan="7">No purchase requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
