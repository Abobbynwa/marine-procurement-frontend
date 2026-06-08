import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
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

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
        <Route path="requests" element={<Requests />} />
        <Route path="requests/new" element={<CreateRequest />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="rfqs" element={<RFQs />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="payments" element={<Payments />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
