import { NavLink } from "react-router-dom";
import { BarChart3, ClipboardList, FilePlus2, Handshake, ShipWheel } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/requests", label: "Requests", icon: ClipboardList },
  { to: "/requests/new", label: "New Request", icon: FilePlus2 },
  { to: "/vendors", label: "Vendors", icon: Handshake }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><ShipWheel size={24} /></div>
        <div>
          <h1>MarineProcure</h1>
          <p>Full-stack Portal</p>
        </div>
      </div>

      <nav className="nav-list">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} end={link.to === "/"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
