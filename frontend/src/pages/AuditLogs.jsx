import { useEffect, useState } from "react";
import api from "../services/api.js";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        const { data } = await api.get("/audit-logs");
        setLogs(data.auditLogs || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load audit logs");
      }
    }

    loadLogs();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Audit Logs</h2>
          <p>Track important actions performed across the procurement portal.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.full_name || log.email || "System"}</td>
                  <td>{log.role || "-"}</td>
                  <td>{log.action}</td>
                  <td>{log.entity_type || "-"}</td>
                  <td><code className="audit-json">{JSON.stringify(log.metadata || {})}</code></td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan="6">No audit logs found yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
