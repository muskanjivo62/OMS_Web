import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/authService";
import "./Sidebar.css";

type SidebarProps = {
  children: ReactNode;
};

export default function Sidebar({ children }: SidebarProps) {
  const [salesOpen, setSalesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [reportsOpen, setReportsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const roleLabel = userRole ? userRole.toUpperCase() : "USER";
  const displayName = userName || "User";

  const closeSidebar = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const data = await getCurrentUser();
      setUserRole(data.role);
      setUserName(data.full_name || data.name || data.username || "");
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    setSalesOpen(
      location.pathname === "/Add_Sales" || location.pathname === "/View_Orders"
    );
    setReportsOpen(
      location.pathname === "/Daily_Report" ||
        location.pathname === "/PersonWise_Report" ||
        location.pathname === "/Sales_Report"
    );
  }, [location.pathname]);

  return (
    <>
      <header className="header">
        <div className="logo-area">
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="logo-mark" aria-hidden="true">
            <img src="/logo.png" alt="OMS logo" className="logo-mark-img" />
          </div>
          <span className="logo-text">OMS</span>
        </div>

        <div className="header-right">
          <div className="header-profile">
            <span className="header-profile-name">{displayName}</span>
            <span className="header-profile-role">{roleLabel}</span>
          </div>
        </div>
      </header>

      {menuOpen && <div className="overlay" onClick={closeSidebar}></div>}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <ul>
          <li className={location.pathname === "/Dashboard" ? "active" : ""}>
            <Link to="/Dashboard" onClick={closeSidebar}>
              Dashboard
            </Link>
          </li>

          {(userRole?.toLowerCase() === "admin") && (
            <li className={location.pathname === "/App_User" ? "active" : ""}>
              <Link to="/App_User" onClick={closeSidebar}>App User</Link>
            </li>
          )}

          {(userRole?.toLowerCase() === "admin") && (

            <>
            <li className={location.pathname === "/Sap_sync" ? "active" : ""}>
              <Link to="/Sap_sync" onClick={closeSidebar}>SAP Sync</Link>
            </li>

             <li className={location.pathname === "/Party_Assignment" ? "active" : ""}>
              <Link to="/Party_Assignment" onClick={closeSidebar}>Party Assignment</Link>
            </li>

            <li className={location.pathname === "/Party_Product_Assignment" ? "active" : ""}>
              <Link to="/Party_Product_Assignment" onClick={closeSidebar}>Party Product Assignment</Link>
            </li>

            </>
          )}

          {(userRole?.toLowerCase() === "manager" || userRole?.toLowerCase() == "billing") && (
            <li>
              <div className="dropdown-toggle" onClick={() => setSalesOpen(!salesOpen)}>
                Sales
                <span className={`sb-chevron ${salesOpen ? "open" : ""}`}></span>
              </div>
              {salesOpen && (
                <ul className="dropdown-list">
                  <li><Link to="/Add_Sales" onClick={closeSidebar}>Add Sales</Link></li>
                  <li><Link to="/View_Orders" onClick={closeSidebar}>View Orders</Link></li>
                </ul>
              )}
            </li>
          )}

          {(userRole?.toLowerCase() ===  "auditor") && (
            <>
              <li className={location.pathname === "/Auditor_orders" ? "active" : ""}>
                <Link to="/Auditor_orders" onClick={closeSidebar}>Orders</Link>
              </li>
              <li className={location.pathname === "/Auditor_status_tracking" ? "active" : ""}>
                <Link to="/Auditor_status_tracking" onClick={closeSidebar}>Status Tracking</Link>
              </li>
            </>
          )}

          {(userRole?.toLowerCase() ===  "billing" ) && (
            <>
              <li className={location.pathname === "/Billing_orders" ? "active" : ""}>
                <Link to="/Billing_orders" onClick={closeSidebar}>Orders</Link>
              </li>
              <li className={location.pathname === "/Billing_status_tracking" ? "active" : ""}>
                <Link to="/Billing_status_tracking" onClick={closeSidebar}>Status Tracking</Link>
              </li>
            </>
          )}

          {(userRole?.toLowerCase() ===  "manager" ) && (
            <>
              <li className={location.pathname === "/Order_Tracking" ? "active" : ""}>
                <Link to="/Order_Tracking" onClick={closeSidebar}>Order Tracker</Link>
              </li>
            </>
          )}

          {(userRole?.toLowerCase() ===  "billing" || userRole?.toLowerCase() === "admin") && (
            <li>
              <div className="dropdown-toggle" onClick={() => setReportsOpen(!reportsOpen)}>
                Reports
                <span className={`sb-chevron ${reportsOpen ? "open" : ""}`}></span>
              </div>
              {reportsOpen && (
                <ul className="dropdown-list">
                  <li><Link to="/Daily_Report" onClick={closeSidebar}>Daily Report</Link></li>
                  <li><Link to="/PersonWise_Report" onClick={closeSidebar}>Person Wise Report</Link></li>
                  <li><Link to="/Sales_Report" onClick={closeSidebar}>Sales Report</Link></li>
                  
                </ul>
              )}
            </li>
          )}

         
        </ul>

        <div className="sb-logout-wrap">
          <button
            className="sb-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" style={{width:'14px',height:'14px',flexShrink:0}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── LOGOUT CONFIRM MODAL ── */}
      {showLogoutModal && (
        <div className="sb-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="sb-modal" onClick={e => e.stopPropagation()}>
            <div className="sb-modal-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
              </svg>
            </div>
            <h3 className="sb-modal-title">Logout</h3>
            <p className="sb-modal-msg">Are you sure you want to logout?</p>
            <div className="sb-modal-actions">
              <button className="sb-modal-cancel" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="sb-modal-confirm" onClick={() => {
                localStorage.removeItem("access");
                window.location.href = "/";
              }}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      <main className="content-area">{children}</main>
    </>
  );
}
