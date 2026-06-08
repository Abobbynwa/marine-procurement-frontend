export const roleAccess = {
  admin: ["/", "/requests", "/requests/new", "/vendors", "/rfqs", "/quotations", "/purchase-orders", "/deliveries", "/invoices", "/payments", "/reports", "/audit-logs", "/documents"],
  requester: ["/", "/requests", "/requests/new", "/documents"],
  approver: ["/", "/requests", "/rfqs", "/quotations", "/purchase-orders", "/deliveries", "/invoices", "/reports"],
  procurement: ["/", "/requests", "/vendors", "/rfqs", "/quotations", "/purchase-orders", "/deliveries", "/invoices", "/reports", "/audit-logs", "/documents"],
  vendor: ["/", "/rfqs", "/quotations", "/purchase-orders", "/documents"],
  finance: ["/", "/requests", "/purchase-orders", "/deliveries", "/invoices", "/payments", "/reports"]
};

export function canAccess(role, path) {
  const allowed = roleAccess[role] || [];
  return allowed.includes(path);
}
