import { useEffect, useState } from "react";
import api from "../services/api.js";

export default function Documents() {
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({ entityType: "general", entityId: "" });
  const [document, setDocument] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadFiles() {
    try {
      const { data } = await api.get("/uploads");
      setFiles(data.files || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load documents");
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!document) {
      setError("Please select a document to upload");
      return;
    }

    const payload = new FormData();
    payload.append("document", document);
    payload.append("entityType", form.entityType);
    if (form.entityId) payload.append("entityId", form.entityId);

    setLoading(true);
    try {
      await api.post("/uploads", payload, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess("Document uploaded successfully");
      setDocument(null);
      setForm({ entityType: "general", entityId: "" });
      await loadFiles();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to upload document");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Documents</h2>
          <p>Upload quotations, invoices, delivery notes and supporting files.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Document Type</label>
            <select name="entityType" value={form.entityType} onChange={handleChange}>
              <option value="general">General</option>
              <option value="purchase_request">Purchase Request</option>
              <option value="rfq">RFQ</option>
              <option value="quotation">Quotation</option>
              <option value="purchase_order">Purchase Order</option>
              <option value="delivery">Delivery</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div>
            <label>Related Record ID</label>
            <input name="entityId" value={form.entityId} onChange={handleChange} placeholder="Optional UUID" />
          </div>
          <div>
            <label>Choose File</label>
            <input type="file" onChange={(event) => setDocument(event.target.files?.[0] || null)} />
          </div>
        </div>
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Uploading..." : "Upload Document"}</button>
      </form>

      <div className="panel space-top">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Uploaded By</th>
                <th>Size</th>
                <th>Date</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>{file.original_name}</td>
                  <td>{file.entity_type || "general"}</td>
                  <td>{file.uploaded_by_name || "-"}</td>
                  <td>{Math.round((file.size_bytes || 0) / 1024)} KB</td>
                  <td>{new Date(file.created_at).toLocaleDateString()}</td>
                  <td><a className="small-button" href={file.file_url} target="_blank" rel="noreferrer">Open</a></td>
                </tr>
              ))}
              {files.length === 0 && <tr><td colSpan="6">No documents uploaded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
