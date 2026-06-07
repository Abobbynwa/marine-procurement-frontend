import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Requests from "./pages/Requests.jsx";
import CreateRequest from "./pages/CreateRequest.jsx";
import Vendors from "./pages/Vendors.jsx";
import RFQs from "./pages/RFQs.jsx";
import Quotations from "./pages/Quotations.jsx";
import PurchaseOrders from "./pages/PurchaseOrders.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Layout from "./components/Layout.jsx";

function isLoggedIn() {
  return Boolean(localStorage.getItem("marine_user"));
}

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
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
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
