import { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

const userRoles = ["admin", "requester", "approver", "procurement", "vendor", "finance"];
const userStatuses = ["active", "inactive", "suspended"];

const statusOptions = {
  vendors: ["pending", "active", "inactive", "blacklisted"],
  requests: ["draft", "submitted", "pending_approval", "approved", "rejected", "correction_requested", "rfq_created", "vendor_selected", "po_issued", "delivered", "invoiced", "closed"],
  rfqs: ["draft", "open", "closed", "awarded", "cancelled"],
  quotations: ["submitted", "under_review", "recommended", "accepted", "rejected"],
  purchaseOrders: ["draft", "issued", "pending_delivery", "partially_delivered", "delivered", "closed", "cancelled"],
  deliveries: ["pending", "in_transit", "partially_delivered", "delivered", "verified"],
  invoices: ["received", "verified", "payment_pending", "paid", "rejected"],
  payments: ["pending", "completed", "failed"]
};

function formatCurrency(value) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default function AdminConsole() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadConsole() {
    setError("");
    try {
      const { data } = await api.get("/admin/console");
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load admin console");
    }
  }

  useEffect(() => {
    loadConsole();
  }, []);

  const totals = useMemo(() => data?.totals || {}, [data]);

  async function updateUser(id, changes) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/admin/users/${id}`, changes);
      setSuccess("User updated successfully");
      await loadConsole();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update user");
    } finally {
      setLoading(false);
    }
  }

  async function updateRecordStatus(module, id, status) {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/admin/${module}/${id}/status`, { status });
      setSuccess("Record status updated successfully");
      await loadConsole();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update record");
    } finally {
      setLoading(false);
    }
  }

  function renderUsers() {
    return (
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Department</th><th>Created</th></tr></thead>
          <tbody>
            {(data?.users || []).map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>
                  <select value={user.role} disabled={loading} onChange={(event) => updateUser(user.id, { role: event.target.value })}>
                    {userRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </td>
                <td>
                  <select value={user.status} disabled={loading} onChange={(event) => updateUser(user.id, { status: event.target.value })}>
                    {userStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td>{user.department || "-"}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderStatusTable(module, rows, columns) {
    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}<th>Status</th><th>Modify</th></tr>
          </thead>
          <tbody>
            {(rows || []).map((row) => {
              const currentStatus = row.status || row.delivery_status || row.payment_status || "unknown";
              return (
                <tr key={row.id}>
                  {columns.map((col) => <td key={col.key}>{col.format ? col.format(row[col.key], row) : row[col.key] || "-"}</td>)}
                  <td><StatusBadge status={currentStatus} /></td>
                  <td>
                    <select value={currentStatus} disabled={loading} onChange={(event) => updateRecordStatus(module, row.id, event.target.value)}>
                      {(statusOptions[module] || []).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
            {(!rows || rows.length === 0) && <tr><td colSpan={columns.length + 2}>No records found.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  function renderFiles() {
    return (
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Record</th><th>Size</th><th>Date</th><th>Open</th></tr></thead>
          <tbody>
            {(data?.files || []).map((file) => (
              <tr key={file.id}>
                <td>{file.original_name}</td>
                <td>{file.entity_type || "general"}</td>
                <td>{file.entity_id || "-"}</td>
                <td>{Math.round((file.size_bytes || 0) / 1024)} KB</td>
                <td>{new Date(file.created_at).toLocaleDateString()}</td>
                <td><a className="small-button" href={file.file_url} target="_blank" rel="noreferrer">Open</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderAudit() {
    return (
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Date</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
          <tbody>
            {(data?.auditLogs || []).map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.full_name || log.email || "System"}</td>
                <td>{log.action}</td>
                <td>{log.entity_type || "-"}</td>
                <td><code className="audit-json">{JSON.stringify(log.metadata || {})}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const tabs = [
    ["users", "Users"],
    ["vendors", "Vendors"],
    ["requests", "Requests"],
    ["rfqs", "RFQs"],
    ["quotations", "Quotations"],
    ["purchaseOrders", "Purchase Orders"],
    ["deliveries", "Deliveries"],
    ["invoices", "Invoices"],
    ["payments", "Payments"],
    ["files", "Files"],
    ["audit", "Audit"]
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Admin Console</h2>
          <p>Central control panel for users, records, documents, statuses and system activity.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadConsole}>Refresh</button>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="stats-grid">
        <div className="stat-card"><span>Users</span><strong>{totals.users || 0}</strong></div>
        <div className="stat-card"><span>Vendors</span><strong>{totals.vendors || 0}</strong></div>
        <div className="stat-card"><span>Requests</span><strong>{totals.requests || 0}</strong></div>
        <div className="stat-card"><span>POs</span><strong>{totals.purchaseOrders || 0}</strong></div>
        <div className="stat-card"><span>Invoices</span><strong>{totals.invoices || 0}</strong></div>
        <div className="stat-card"><span>Payments</span><strong>{totals.payments || 0}</strong></div>
        <div className="stat-card"><span>Files</span><strong>{totals.files || 0}</strong></div>
        <div className="stat-card"><span>Audit Logs</span><strong>{totals.auditLogs || 0}</strong></div>
      </div>

      <div className="panel">
        <div className="tab-row">
          {tabs.map(([key, label]) => (
            <button key={key} className={`tab-button ${activeTab === key ? "active" : ""}`} type="button" onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </div>

        {activeTab === "users" && renderUsers()}
        {activeTab === "vendors" && renderStatusTable("vendors", data?.vendors, [{ key: "company_name", label: "Company" }, { key: "email", label: "Email" }, { key: "service_category", label: "Category" }])}
        {activeTab === "requests" && renderStatusTable("requests", data?.requests, [{ key: "request_no", label: "Request No" }, { key: "title", label: "Title" }, { key: "estimated_budget", label: "Budget", format: formatCurrency }])}
        {activeTab === "rfqs" && renderStatusTable("rfqs", data?.rfqs, [{ key: "rfq_no", label: "RFQ No" }, { key: "title", label: "Title" }, { key: "deadline", label: "Deadline" }])}
        {activeTab === "quotations" && renderStatusTable("quotations", data?.quotations, [{ key: "quotation_no", label: "Quotation No" }, { key: "total_amount", label: "Amount", format: formatCurrency }, { key: "delivery_time", label: "Delivery" }])}
        {activeTab === "purchaseOrders" && renderStatusTable("purchaseOrders", data?.purchaseOrders, [{ key: "po_no", label: "PO No" }, { key: "total_amount", label: "Amount", format: formatCurrency }, { key: "delivery_deadline", label: "Deadline" }])}
        {activeTab === "deliveries" && renderStatusTable("deliveries", data?.deliveries, [{ key: "po_id", label: "PO ID" }, { key: "comment", label: "Comment" }, { key: "created_at", label: "Created", format: (value) => new Date(value).toLocaleDateString() }])}
        {activeTab === "invoices" && renderStatusTable("invoices", data?.invoices, [{ key: "invoice_no", label: "Invoice No" }, { key: "amount", label: "Amount", format: formatCurrency }, { key: "created_at", label: "Created", format: (value) => new Date(value).toLocaleDateString() }])}
        {activeTab === "payments" && renderStatusTable("payments", data?.payments, [{ key: "payment_reference", label: "Reference" }, { key: "amount", label: "Amount", format: formatCurrency }, { key: "paid_at", label: "Paid At", format: (value) => value ? new Date(value).toLocaleDateString() : "-" }])}
        {activeTab === "files" && renderFiles()}
        {activeTab === "audit" && renderAudit()}
      </div>
    </div>
  );
}
