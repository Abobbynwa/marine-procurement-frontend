import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    serviceCategory: "Marine Equipment",
    address: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadVendors() {
    try {
      const { data } = await api.get("/vendors");
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load vendors");
    }
  }

  useEffect(() => {
    loadVendors();
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
      await api.post("/vendors", form);
      setSuccess("Vendor added successfully");
      setForm({ companyName: "", contactPerson: "", email: "", phone: "", serviceCategory: "Marine Equipment", address: "" });
      await loadVendors();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to add vendor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Vendors</h2>
          <p>Register and manage marine suppliers.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <form className="form-panel compact-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Company Name</label>
            <input name="companyName" value={form.companyName} onChange={handleChange} required />
          </div>
          <div>
            <label>Contact Person</label>
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} />
          </div>
          <div>
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div>
            <label>Service Category</label>
            <select name="serviceCategory" value={form.serviceCategory} onChange={handleChange}>
              <option>Marine Equipment</option>
              <option>Maintenance Services</option>
              <option>Logistics</option>
              <option>Safety Equipment</option>
              <option>Fuel / Lubricants</option>
            </select>
          </div>
          <div>
            <label>Address</label>
            <input name="address" value={form.address} onChange={handleChange} />
          </div>
        </div>
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Adding..." : "Add Vendor"}</button>
      </form>

      <div className="panel space-top">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Category</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.company_name}</td>
                  <td>{vendor.contact_person || "-"}</td>
                  <td>{vendor.email}</td>
                  <td>{vendor.service_category || "-"}</td>
                  <td>{vendor.rating || 0}</td>
                  <td><StatusBadge status={vendor.status} /></td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan="6">No vendors found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
