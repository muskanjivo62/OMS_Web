import { useEffect, useState } from "react";
import { sapService } from "../services/sapService";

interface LastSync {
  type: string;
  date: string;
  time: string;
  status: "success" | "failed";
}

const PAGE_SIZE = 10;

export default function Status() {
  const [branches, setBranches] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<LastSync | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "parties" | "addresses" | "branches">("products");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProducts();
    fetchAddresses();
    fetchParties();
    fetchBranches();

    const saved = localStorage.getItem("lastSync");
    if (saved) {
      setLastSync(JSON.parse(saved));
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await sapService.getProducts();
      setProducts(data);
    } catch (error) {
      console.log("Error fetching products:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const data = await sapService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.log("Error fetching addresses:", error);
    }
  };

  const fetchParties = async () => {
    try {
      const data = await sapService.getParties();
      setParties(data);
    } catch (error) {
      console.log("Error fetching parties:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await sapService.getBranches();
      setBranches(data);
    } catch (error) {
      console.log("Error fetching branches:", error);
    }
  };

  const saveLastSync = (type: string, status: "success" | "failed") => {
    const now = new Date();
    const entry: LastSync = {
      type,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      status,
    };
    localStorage.setItem("lastSync", JSON.stringify(entry));
    setLastSync(entry);
  };

  const syncData = async (syncType: string) => {
    setLoading(syncType);

    try {
      const data = await sapService.syncData(syncType);

      // Backend returns { success: true|false, message: "..." }
      const isSuccess = data?.success === true;

      saveLastSync(syncType, isSuccess ? "success" : "failed");

      if (isSuccess) {
        fetchProducts();
        fetchAddresses();
        fetchParties();
        fetchBranches();
        alert(data?.message || "Sync completed successfully");
      } else {
        alert("Sync failed: " + (data?.message || "Unknown error"));
      }
    } catch (err: any) {
      saveLastSync(syncType, "failed");
      alert(
        "Sync failed: " +
          (err?.response?.data?.message || err?.message || "Unknown error")
      );
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="st-page">
      {/* ── MANUAL SYNC ── */}
      <div className="st-section-label">Manual Sync</div>
      <div className="st-sync-grid">
        <button className="st-sync-btn st-sync-all" onClick={() => syncData("all")}>
          {loading === "all" ? "Syncing..." : "Sync All"}
        </button>
        <button className="st-sync-btn" onClick={() => syncData("products")}>
          {loading === "products" ? "Syncing..." : "Products"}
        </button>
        <button className="st-sync-btn" onClick={() => syncData("parties")}>
          {loading === "parties" ? "Syncing..." : "Parties"}
        </button>
        <button className="st-sync-btn" onClick={() => syncData("addresses")}>
          {loading === "addresses" ? "Syncing..." : "Addresses"}
        </button>
        <button className="st-sync-btn st-sync-full" onClick={() => syncData("branches")}>
          {loading === "branches" ? "Syncing..." : "Branches"}
        </button>
      </div>

      {/* ── CURRENT DATA ── */}
      <div className="st-section-label">Current Data</div>
      <div className="st-stats-grid">
        <div className="st-stat-card">
          <div className="st-stat-number">{products.length}</div>
          <div className="st-stat-label">Products</div>
        </div>
        <div className="st-stat-card">
          <div className="st-stat-number">{parties.length}</div>
          <div className="st-stat-label">Parties</div>
        </div>
        <div className="st-stat-card">
          <div className="st-stat-number">{addresses.length}</div>
          <div className="st-stat-label">Addresses</div>
        </div>
        <div className="st-stat-card">
          <div className="st-stat-number">{branches.length}</div>
          <div className="st-stat-label">Branches</div>
        </div>
      </div>

      {/* ── DATA TABS ── */}
      <div className="st-section-label" style={{ marginTop: "28px" }}>Synced Data</div>
      <div className="st-tabs">
        {(["products", "parties", "addresses", "branches"] as const).map((tab) => (
          <button
            key={tab}
            className={`st-tab${activeTab === tab ? " st-tab-active" : ""}`}
            onClick={() => { setActiveTab(tab); setPage(1); }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {(() => {
        const dataMap = { products, parties, addresses, branches };
        const rows = dataMap[activeTab];
        const totalPages = Math.ceil(rows.length / PAGE_SIZE);
        const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

        const colsMap: Record<string, { key: string; label: string }[]> = {
          products:  [{ key: "item_code", label: "Item Code" }, { key: "item_name", label: "Item Name" }, { key: "brand", label: "Brand" }, { key: "category", label: "Category" }, { key: "sal_pack_unit", label: "Pack Unit" }, { key: "variety", label: "Variety" }],
          parties:   [{ key: "card_code", label: "Card Code" }, { key: "card_name", label: "Party Name" }, { key: "category", label: "Category" }, { key: "state", label: "State" }, { key: "main_group", label: "Main Group" }],
          addresses: [{ key: "card_code", label: "Card Code" }, { key: "address_name", label: "Address Name" }, { key: "address_type", label: "Type" }, { key: "city", label: "City" }, { key: "state", label: "State" }, { key: "gst_number", label: "GST" }],
          branches:  [{ key: "bpl_id", label: "BPL ID" }, { key: "bpl_name", label: "Branch Name" }, { key: "is_active", label: "Status" }],
        };
        const cols = colsMap[activeTab];

        return (
          <div className="st-table-card">
            <table className="st-table">
              <thead>
                <tr>{cols.map(c => <th key={c.key}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {paged.length > 0 ? paged.map((row, i) => (
                  <tr key={i}>
                    {cols.map(c => (
                      <td key={c.key}>
                        {c.key === "is_active"
                          ? <span className={row[c.key] ? "st-badge-active" : "st-badge-inactive"}>{row[c.key] ? "Active" : "Inactive"}</span>
                          : (row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr><td colSpan={cols.length} className="st-empty">No data found</td></tr>
                )}
              </tbody>
            </table>
            <div className="st-pagination">
              <span className="st-page-info">
                {rows.length === 0 ? "0 records" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, rows.length)} of ${rows.length}`}
              </span>
              <div className="st-page-btns">
                <button className="st-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`st-page-btn${p === page ? " st-page-active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="st-page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages || totalPages === 0}>›</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LAST SYNC ── */}
      <div className="st-last-sync">
        <div className="st-last-title">Last Sync</div>
        <div className="st-last-row">
          <span className="st-last-label">Type</span>
          <span className="st-last-value">{lastSync?.type || "—"}</span>
        </div>
        <div className="st-last-row">
          <span className="st-last-label">Date</span>
          <span className="st-last-value">{lastSync?.date || "—"}</span>
        </div>
        <div className="st-last-row">
          <span className="st-last-label">Time</span>
          <span className="st-last-value">{lastSync?.time || "—"}</span>
        </div>
        <div className="st-last-row">
          <span className="st-last-label">Status</span>
          {lastSync?.status ? (
            <span className={`st-status-badge st-status-${lastSync.status}`}>
              {lastSync.status === "success" ? "Success" : "Failed"}
            </span>
          ) : (
            <span className="st-last-value">—</span>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        .st-page {
          font-family: 'Inter', sans-serif;
          width: 100%;
        }

        .st-section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 10px;
        }

        /* SYNC BUTTONS */
        .st-sync-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 26px;
        }

        .st-sync-btn {
          padding: 9px 12px;
          background: #1d4ed8;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: .2s;
        }

        .st-sync-btn:hover { background: #1e40af; }
        .st-sync-btn:disabled { opacity: .6; cursor: not-allowed; }

        .st-sync-full { grid-column: span 2; }

        /* STAT CARDS */
        .st-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }

        .st-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 18px 12px;
          text-align: center;
        }

        .st-stat-number {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .st-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        /* TABS */
        .st-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 14px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0;
        }
        .st-tab {
          padding: 8px 16px;
          border: none;
          background: none;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: .15s;
          text-transform: capitalize;
          letter-spacing: .04em;
        }
        .st-tab:hover { color: #475569; }
        .st-tab-active { color: #1d4ed8; border-bottom-color: #1d4ed8; }

        /* TABLE CARD */
        .st-table-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 28px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .st-table {
          width: 100%;
          border-collapse: collapse;
        }
        .st-table thead { background: #1e293b; }
        .st-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(255,255,255,.55);
          white-space: nowrap;
        }
        .st-table td {
          padding: 11px 14px;
          font-size: 12px;
          color: #374151;
          border-bottom: 1px solid #f1f5f9;
        }
        .st-table tbody tr:last-child td { border-bottom: none; }
        .st-table tbody tr:hover { background: #f8fafc; }
        .st-empty {
          text-align: center;
          padding: 2.5rem;
          color: #94a3b8;
          font-size: 13px;
        }
        .st-badge-active {
          font-size: 10px; font-weight: 600; text-transform: uppercase;
          color: #16a34a; background: rgba(22,163,74,.08);
          padding: 2px 7px; border-radius: 4px;
        }
        .st-badge-inactive {
          font-size: 10px; font-weight: 600; text-transform: uppercase;
          color: #64748b; background: #f1f5f9;
          padding: 2px 7px; border-radius: 4px;
        }

        /* PAGINATION */
        .st-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
        }
        .st-page-info { font-size: 12px; color: #94a3b8; }
        .st-page-btns { display: flex; gap: 4px; }
        .st-page-btn {
          min-width: 28px; height: 28px; padding: 0 6px;
          border: 1.5px solid #e2e8f0; background: white;
          border-radius: 5px; font-size: 12px; font-weight: 500;
          color: #475569; cursor: pointer; transition: .15s;
        }
        .st-page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
        .st-page-btn:disabled { opacity: .35; cursor: default; }
        .st-page-active { background: #1d4ed8; border-color: #1d4ed8; color: white; }

        /* LAST SYNC CARD */
        .st-last-sync {
          background: #1e293b;
          padding: 18px;
          border-radius: 6px;
        }

        .st-last-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(255,255,255,.45);
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,.1);
        }

        .st-last-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 0;
        }

        .st-last-label {
          font-size: 12px;
          color: rgba(255,255,255,.5);
        }

        .st-last-value {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
        }

        .st-status-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .st-status-success {
          background: rgba(22,163,74,.2);
          color: #4ade80;
        }

        .st-status-failed {
          background: rgba(220,38,38,.2);
          color: #f87171;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .st-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 500px) {
          .st-sync-grid { grid-template-columns: 1fr; }
          .st-sync-full { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
}
