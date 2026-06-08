import { useEffect, useState } from "react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({
    rfqId: "",
    vendorId: "",
    totalAmount: "",
    deliveryTime: "",
    validityPeriod: "",
    paymentTerms: "",
    warranty: "",
    notes: "",
    itemName: "",
    quantity: 1,
    unitPrice: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [quoteRes, rfqRes, vendorRes] = await Promise.all([
        api.get("/quotations"),
        api.get("/rfqs"),
        api.get("/vendors")
      ]);
      setQuotations(quoteRes.data.quotations || []);
      setRfqs((rfqRes.data.rfqs || []).filter((item) => item.status === "open"));
      setVendors((vendorRes.data.vendors || []).filter((item) => item.status === "active"));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load quotation data");
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
      await api.post("/quotations", {
        rfqId: form.rfqId,
        vendorId: form.vendorId,
        totalAmount: Number(form.totalAmount || 0),
        deliveryTime: form.deliveryTime,
        validityPeriod: form.validityPeriod,
        paymentTerms: form.paymentTerms,
        warranty: form.warranty,
        notes: form.notes,
        items: [
          {
            itemName: form.itemName || "Quoted Item",
            quantity: Number(form.quantity || 1),
            unitPrice: Number(form.unitPrice || 0)
          }
        ]
      });
      setSuccess("Quotation submitted successfully");
      setForm({ rfqId: "", vendorId: "", totalAmount: "", deliveryTime: "", validityPeriod: "", paymentTerms: "", warranty: "", notes: "", itemName: "", quantity: 1, unitPrice: "" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit quotation");
    } finally {
      setLoading(false);
    }
  }

  async function markRecommended(id) {
    try {
      await api.patch(`/quotations/${id}/status`, { status: "recommended" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update quotation");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Quotations</h2>
          <p>Submit and compare vendor quotations.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>RFQ</label>
            <select name="rfqId" value={form.rfqId} onChange={handleChange} required>
              <option value="">Select RFQ</option>
              {rfqs.map((rfq) => <option key={rfq.id} value={rfq.id}>{rfq.rfq_no} - {rfq.title}</option>)}
            </select>
          </div>
          <div>
            <label>Vendor</label>
            <select name="vendorId" value={form.vendorId} onChange={handleChange} required>
              <option value="">Select vendor</option>
              {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.company_name}</option>)}
            </select>
          </div>
          <div><label>Total Amount</label><input name="totalAmount" type="number" value={form.totalAmount} onChange={handleChange} required /></div>
          <div><label>Delivery Time</label><input name="deliveryTime" value={form.deliveryTime} onChange={handleChange} placeholder="e.g. 5 days" /></div>
          <div><label>Validity Period</label><input name="validityPeriod" value={form.validityPeriod} onChange={handleChange} placeholder="e.g. 14 days" /></div>
          <div><label>Warranty</label><input name="warranty" value={form.warranty} onChange={handleChange} /></div>
          <div><label>Item Name</label><input name="itemName" value={form.itemName} onChange={handleChange} /></div>
          <div><label>Quantity</label><input name="quantity" type="number" value={form.quantity} onChange={handleChange} /></div>
          <div><label>Unit Price</label><input name="unitPrice" type="number" value={form.unitPrice} onChange={handleChange} /></div>
          <div><label>Payment Terms</label><input name="paymentTerms" value={form.paymentTerms} onChange={handleChange} /></div>
        </div>
        <label>Notes</label>
        <textarea name="notes" rows="4" value={form.notes} onChange={handleChange} />
        <button className="primary-button" disabled={loading} type="submit">{loading ? "Submitting..." : "Submit Quotation"}</button>
      </form>

      <div className="panel space-top">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Quotation No</th><th>RFQ</th><th>Vendor</th><th>Amount</th><th>Delivery</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((quote) => (
                <tr key={quote.id}>
                  <td>{quote.quotation_no}</td>
                  <td>{quote.rfq_no}</td>
                  <td>{quote.company_name}</td>
                  <td>₦{Number(quote.total_amount || 0).toLocaleString()}</td>
                  <td>{quote.delivery_time || "-"}</td>
                  <td><StatusBadge status={quote.status} /></td>
                  <td><button className="small-button" type="button" onClick={() => markRecommended(quote.id)}>Recommend</button></td>
                </tr>
              ))}
              {quotations.length === 0 && <tr><td colSpan="7">No quotations found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
