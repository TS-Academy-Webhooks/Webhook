// src/layouts/DashboardLayout.jsx

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
function DashboardLayout() {
  const { user, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();

    // Send the user back to the login page.
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">W</div>

          <span>Webhook Manager</span>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={
              location.pathname === "/dashboard"
                ? "nav-link active"
                : "nav-link"
            }
          >
            Dashboard
          </Link>

          <Link
            to="/webhooks"
            className="nav-link"
          >
            Webhooks
          </Link>

          <Link
            to="/deliveries"
            className="nav-link"
          >
            Deliveries
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <Link
            to="/settings"
            className="nav-link"
          >
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main application area */}
      <div className="dashboard-main">
        <header className="topbar">
          <div>
            <span className="topbar-title">
              Webhook Management
            </span>
          </div>

          <div className="user-menu">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user?.name || "User"}</strong>

              <span>{user?.email || ""}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {/* Child dashboard pages are rendered here. */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;