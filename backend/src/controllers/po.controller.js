import PDFDocument from "pdfkit";
import { query } from "../config/db.js";

function generatePoNo() {
  return `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export async function createPurchaseOrder(req, res, next) {
  try {
    const { quotationId, deliveryAddress, deliveryDeadline, approvedBy } = req.body;

    if (!quotationId) {
      return res.status(400).json({ message: "Quotation ID is required" });
    }

    const quoteResult = await query(
      `SELECT q.*, r.request_id
       FROM quotations q
       JOIN rfqs r ON r.id = q.rfq_id
       WHERE q.id = $1`,
      [quotationId]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const quote = quoteResult.rows[0];

    const poResult = await query(
      `INSERT INTO purchase_orders (
        po_no, request_id, quotation_id, vendor_id, total_amount,
        delivery_address, delivery_deadline, status, created_by, approved_by
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'issued',$8,$9)
       RETURNING *`,
      [
        generatePoNo(),
        quote.request_id,
        quote.id,
        quote.vendor_id,
        quote.total_amount,
        deliveryAddress || null,
        deliveryDeadline || null,
        req.user.id,
        approvedBy || req.user.id
      ]
    );

    const po = poResult.rows[0];

    const itemsResult = await query("SELECT * FROM quotation_items WHERE quotation_id = $1", [quotationId]);
    for (const item of itemsResult.rows) {
      await query(
        `INSERT INTO po_items (po_id, item_name, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [po.id, item.item_name, item.quantity, item.unit_price, item.total_price]
      );
    }

    await query("UPDATE quotations SET status = 'accepted', updated_at = NOW() WHERE id = $1", [quotationId]);
    await query("UPDATE rfqs SET status = 'awarded', updated_at = NOW() WHERE id = $1", [quote.rfq_id]);
    await query("UPDATE purchase_requests SET status = 'po_issued', updated_at = NOW() WHERE id = $1", [quote.request_id]);

    res.status(201).json({ purchaseOrder: po });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseOrders(req, res, next) {
  try {
    const result = await query(
      `SELECT po.*, v.company_name, pr.request_no, q.quotation_no
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN purchase_requests pr ON pr.id = po.request_id
       LEFT JOIN quotations q ON q.id = po.quotation_id
       ORDER BY po.created_at DESC`
    );

    res.json({ purchaseOrders: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseOrderById(req, res, next) {
  try {
    const poResult = await query(
      `SELECT po.*, v.company_name, v.email AS vendor_email, v.phone AS vendor_phone,
              v.address AS vendor_address, pr.request_no, q.quotation_no,
              creator.full_name AS created_by_name, approver.full_name AS approved_by_name
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN purchase_requests pr ON pr.id = po.request_id
       LEFT JOIN quotations q ON q.id = po.quotation_id
       LEFT JOIN users creator ON creator.id = po.created_by
       LEFT JOIN users approver ON approver.id = po.approved_by
       WHERE po.id = $1`,
      [req.params.id]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const itemsResult = await query("SELECT * FROM po_items WHERE po_id = $1", [req.params.id]);

    res.json({ purchaseOrder: poResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    next(error);
  }
}

export async function downloadPurchaseOrderPdf(req, res, next) {
  try {
    const poResult = await query(
      `SELECT po.*, v.company_name, v.email AS vendor_email, v.phone AS vendor_phone,
              v.address AS vendor_address, pr.request_no, q.quotation_no,
              creator.full_name AS created_by_name, approver.full_name AS approved_by_name
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN purchase_requests pr ON pr.id = po.request_id
       LEFT JOIN quotations q ON q.id = po.quotation_id
       LEFT JOIN users creator ON creator.id = po.created_by
       LEFT JOIN users approver ON approver.id = po.approved_by
       WHERE po.id = $1`,
      [req.params.id]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const po = poResult.rows[0];
    const itemsResult = await query("SELECT * FROM po_items WHERE po_id = $1", [req.params.id]);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${po.po_no}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text("MarineProcure Purchase Order", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`PO Number: ${po.po_no}`);
    doc.text(`Request Number: ${po.request_no || "N/A"}`);
    doc.text(`Quotation Number: ${po.quotation_no || "N/A"}`);
    doc.text(`Status: ${po.status}`);
    doc.text(`Created: ${new Date(po.created_at).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Vendor Details", { underline: true });
    doc.fontSize(12).text(`Company: ${po.company_name || "N/A"}`);
    doc.text(`Email: ${po.vendor_email || "N/A"}`);
    doc.text(`Phone: ${po.vendor_phone || "N/A"}`);
    doc.text(`Address: ${po.vendor_address || "N/A"}`);
    doc.moveDown();

    doc.fontSize(14).text("Delivery Details", { underline: true });
    doc.fontSize(12).text(`Delivery Address: ${po.delivery_address || "N/A"}`);
    doc.text(`Delivery Deadline: ${po.delivery_deadline || "N/A"}`);
    doc.moveDown();

    doc.fontSize(14).text("Items", { underline: true });
    doc.moveDown(0.5);

    itemsResult.rows.forEach((item, index) => {
      doc.fontSize(11).text(`${index + 1}. ${item.item_name}`);
      doc.text(`   Quantity: ${item.quantity}`);
      doc.text(`   Unit Price: ${Number(item.unit_price || 0).toLocaleString()}`);
      doc.text(`   Total: ${Number(item.total_price || 0).toLocaleString()}`);
      doc.moveDown(0.4);
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total Amount: ${Number(po.total_amount || 0).toLocaleString()}`, { align: "right" });
    doc.moveDown(2);

    doc.fontSize(11).text(`Prepared By: ${po.created_by_name || "N/A"}`);
    doc.text(`Approved By: ${po.approved_by_name || "N/A"}`);
    doc.moveDown();
    doc.fontSize(10).fillColor("gray").text("Generated by MarineProcure Web Portal", { align: "center" });

    doc.end();
  } catch (error) {
    next(error);
  }
}

export async function updatePurchaseOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ["draft", "issued", "pending_delivery", "partially_delivered", "delivered", "closed", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid purchase order status" });
    }

    const result = await query(
      `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    res.json({ purchaseOrder: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
