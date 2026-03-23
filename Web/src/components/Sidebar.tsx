import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser } from "../services/authService";
import "./Sidebar.css";

type SidebarProps = {
  children: ReactNode;
};

export default function Sidebar({ children }: SidebarProps) {

  // const [userOpen, setUserOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const location = useLocation();

  // Close sidebar
  const closeSidebar = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
   try {
    const data = await getCurrentUser();
    console.log("dataofuser",+JSON.stringify(data));
    setUserRole(data.role);
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

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="logo-area">
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          {/* <div className="logo-mark">
            <i className="fa-solid fa-truck-fast" style={{fontSize:'11px'}} />
          </div> */}
          <span className="logo-text">OMS</span>
        </div>

        <div className="header-right">
          <span className="admin-text">{userRole?.toUpperCase()}</span>
        </div>
      </header>

      {menuOpen && <div className="overlay" onClick={closeSidebar}></div>}

      {/* ================= SIDEBAR ================= */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <ul>
          {/* Dashboard */}
          <li className={location.pathname === "/Dashboard" ? "active" : ""}>
            <Link to="/Dashboard" onClick={closeSidebar}>
              Dashboard
            </Link>
          </li>

          {/* <div className="sb-rule" /> */}

          {/* User Management — Admin only */}
          {(userRole?.toLowerCase() === "admin") && (
            // <li>
            //   <div className="dropdown-toggle" onClick={() => setUserOpen(!userOpen)}>
            //     User Management
            //     <span className={`sb-chevron ${userOpen ? "open" : ""}`}></span>
            //   </div>
            //   {userOpen && (
            //     <ul className="dropdown-list">
            //       {/* <li><Link to="/ManageRole" onClick={closeSidebar}>Manage Role</Link></li> */}
            //       <li><Link to="/App_User" onClick={closeSidebar}>App Users</Link></li>
            //     </ul>
            //   )}
            // </li>

             <li className={location.pathname === "/App_User" ? "active" : ""}>
              <Link to="/App_User" onClick={closeSidebar}>App User</Link>
            </li>
          )}

          {/* SAP Sync — Admin only */}
          {(userRole?.toLowerCase() === "admin") && (
            <li className={location.pathname === "/Sap_sync" ? "active" : ""}>
              <Link to="/Sap_sync" onClick={closeSidebar}>SAP Sync</Link>
            </li>
          )}

          {/* Sales — Manager only */}
          {(userRole?.toLowerCase() === "manager") && (
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

          {/* Auditor */}
          {(userRole?.toLowerCase() ===  "auditor") && (
            <li className={location.pathname === "/Auditor_orders" ? "active" : ""}>
              <Link to="/Auditor_orders" onClick={closeSidebar}>Orders</Link>
            </li>
          )}

          {/* Billing */}
          {(userRole?.toLowerCase() ===  "billing" ) && (
            <li className={location.pathname === "/Billing_orders" ? "active" : ""}>
              <Link to="/Billing_orders" onClick={closeSidebar}>Orders</Link>
            </li>
          )}

          {/* <div className="sb-rule" /> */}

          {/* <li className={location.pathname === "/Pricelist" ? "active" : ""}>
            <Link to="/Pricelist" onClick={closeSidebar}>Pricelist</Link>
          </li>

          <li className={location.pathname === "/Reports" ? "active" : ""}>
            <Link to="/Reports" onClick={closeSidebar}>Reports</Link>
          </li> */}
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

      {/* ================= CONTENT ================= */}
      <main className="content-area">{children}</main>

    </>
  );
  
}
