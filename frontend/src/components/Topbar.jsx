import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div>
        <strong>{user?.full_name || user?.fullName || "MarineProcure User"}</strong>
        <span>{user?.role || "user"}</span>
      </div>

      <button className="logout-button" type="button" onClick={handleLogout}>
        <LogOut size={17} /> Logout
      </button>
    </header>
  );
}
