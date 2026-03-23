import { useState } from "react";
import Status from "./Status";
import Products from "./Products";
import Parties from "./Parties";
import Addresses from "./Addresses";
import Branches from "./Branches";
import Logs from "./Logs";

export default function Sap_sync() {
  const [activeTab, setActiveTab] = useState("Status");

  const renderContent = () => {
    switch (activeTab) {
      case "Status":
        return <Status />;
      case "Products":
        return <Products />;
      case "Parties":
        return <Parties />;
      case "Addresses":
        return <Addresses />;
      case "Branches":
        return <Branches />;
      case "Logs":
        return <Logs />;
      default:
        return null;
    }
  };

  return (
    <div className="sap-page">

      {/* ── HEADER ── */}
      <div className="sap-header">
        <div>
          <h1 className="sap-title">SAP Data Sync</h1>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="sap-tabs">
        {["Status", "Products", "Parties", "Addresses", "Branches", "Logs"].map((tab) => (
          <button
            key={tab}
            className={`sap-tab ${activeTab === tab ? "sap-tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="sap-content">{renderContent()}</div>

      <style>{`
       @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

.sap-page{
  font-family:'Inter',sans-serif;
  width:100%;
}

/* HEADER */

.sap-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:20px;
}

.sap-title{
  font-size:1.4rem;
  font-weight:600;
  color:#1e293b;
  margin:0;
  line-height:1.2;
}

.sap-subtitle{
  font-size:12px;
  color:#94a3b8;
  margin-top:3px;
}

/* TABS */

.sap-tabs{
  display:flex;
  gap:2px;
  border-bottom:1px solid #e2e8f0;
  margin-bottom:22px;
}

.sap-tab{
  padding:8px 16px;
  background:transparent;
  border:none;
  border-bottom:2px solid transparent;
  font-family:'Inter',sans-serif;
  font-size:12px;
  font-weight:500;
  letter-spacing:.05em;
  color:#64748b;
  cursor:pointer;
  transition:.2s;
}

.sap-tab:hover{
  color:#1e293b;
}

.sap-tab-active{
  color:#1d4ed8;
  font-weight:600;
  border-bottom:2px solid #1d4ed8;
}

/* CONTENT */

.sap-content{
  width:100%;
}
      `}</style>
    </div>
  );
}
