import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { canAccess } from "./config/roleAccess.js";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Requests from "./pages/Requests.jsx";
import CreateRequest from "./pages/CreateRequest.jsx";
import Vendors from "./pages/Vendors.jsx";
import RFQs from "./pages/RFQs.jsx";
import Quotations from "./pages/Quotations.jsx";
import PurchaseOrders from "./pages/PurchaseOrders.jsx";
import Deliveries from "./pages/Deliveries.jsx";
import Invoices from "./pages/Invoices.jsx";
import Payments from "./pages/Payments.jsx";
import Reports from "./pages/Reports.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Documents from "./pages/Documents.jsx";
import AdminConsole from "./pages/AdminConsole.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  if (!canAccess(user?.role, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function withRole(component) {
  return <RoleRoute>{component}</RoleRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="admin-console" element={withRole(<AdminConsole />)} />
        <Route path="requests" element={withRole(<Requests />)} />
        <Route path="requests/new" element={withRole(<CreateRequest />)} />
        <Route path="vendors" element={withRole(<Vendors />)} />
        <Route path="rfqs" element={withRole(<RFQs />)} />
        <Route path="quotations" element={withRole(<Quotations />)} />
        <Route path="purchase-orders" element={withRole(<PurchaseOrders />)} />
        <Route path="deliveries" element={withRole(<Deliveries />)} />
        <Route path="invoices" element={withRole(<Invoices />)} />
        <Route path="payments" element={withRole(<Payments />)} />
        <Route path="reports" element={withRole(<Reports />)} />
        <Route path="audit-logs" element={withRole(<AuditLogs />)} />
        <Route path="documents" element={withRole(<Documents />)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
