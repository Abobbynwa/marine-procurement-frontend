import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Topbar />
        <section className="page-container">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
