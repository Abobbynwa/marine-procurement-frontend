import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function CreateRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    category: "Vessel Maintenance",
    vesselOrDepartment: "",
    priority: "medium",
    requiredDate: "",
    estimatedBudget: "",
    description: "",
    itemName: "",
    quantity: 1,
    unit: "pcs",
    estimatedUnitPrice: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/purchase-requests", {
        title: form.title,
        category: form.category,
        vesselOrDepartment: form.vesselOrDepartment,
        priority: form.priority,
        requiredDate: form.requiredDate || null,
        estimatedBudget: Number(form.estimatedBudget || 0),
        description: form.description,
        items: [
          {
            itemName: form.itemName || form.title,
            quantity: Number(form.quantity || 1),
            unit: form.unit,
            estimatedUnitPrice: Number(form.estimatedUnitPrice || 0),
            description: form.description
          }
        ]
      });

      navigate("/requests");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Create Purchase Request</h2>
          <p>Submit a real request to the backend database.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Request Title</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div>
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option>Vessel Maintenance</option>
              <option>Safety Equipment</option>
              <option>Fuel / Lubricants</option>
              <option>Office Supplies</option>
              <option>Logistics</option>
              <option>Repair Service</option>
            </select>
          </div>
          <div>
            <label>Vessel / Department</label>
            <input name="vesselOrDepartment" value={form.vesselOrDepartment} onChange={handleChange} />
          </div>
          <div>
            <label>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label>Required Date</label>
            <input name="requiredDate" type="date" value={form.requiredDate} onChange={handleChange} />
          </div>
          <div>
            <label>Estimated Budget</label>
            <input name="estimatedBudget" type="number" value={form.estimatedBudget} onChange={handleChange} />
          </div>
          <div>
            <label>Item Name</label>
            <input name="itemName" value={form.itemName} onChange={handleChange} />
          </div>
          <div>
            <label>Quantity</label>
            <input name="quantity" type="number" value={form.quantity} onChange={handleChange} />
          </div>
          <div>
            <label>Unit</label>
            <input name="unit" value={form.unit} onChange={handleChange} />
          </div>
          <div>
            <label>Estimated Unit Price</label>
            <input name="estimatedUnitPrice" type="number" value={form.estimatedUnitPrice} onChange={handleChange} />
          </div>
        </div>

        <label>Description</label>
        <textarea name="description" rows="5" value={form.description} onChange={handleChange} />

        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
