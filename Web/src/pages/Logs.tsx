import { useEffect, useState } from "react";
import { sapService } from "../services/sapService";
import type {Log} from "../services/sapService";

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let data = await sapService.getLogs();
      setLogs(data);
    } catch (error) {
      console.log("Error fetching Logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    log.sync_type?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="lg-page">
      <div className="lg-toolbar">
        <span className="lg-count">Total: {filteredLogs.length}</span>
        <div className="lg-search-wrap">
          <input
            type="text"
            placeholder="Search by sync type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg-search"
          />
          <div className="lg-search-line" />
        </div>
      </div>

      {loading ? (
        <p className="lg-loading">Loading logs...</p>
      ) : filteredLogs.length > 0 ? (
        <div className="lg-list">
          {filteredLogs.map((log) => (
            <div className="lg-card" key={log.id}>
              <div className="lg-card-head">
                <span className="lg-type">{log.sync_type}</span>
                <span className={log.status.toLowerCase() === "success" ? "lg-badge-ok" : "lg-badge-fail"}>
                  {log.status}
                </span>
              </div>
              <div className="lg-card-stats">
                <div className="lg-stat">
                  <span className="lg-stat-num">{log.records_processed}</span>
                  <span className="lg-stat-lbl">Processed</span>
                </div>
                <div className="lg-stat">
                  <span className="lg-stat-num">{log.records_created}</span>
                  <span className="lg-stat-lbl">Created</span>
                </div>
                <div className="lg-stat">
                  <span className="lg-stat-num">{log.records_updated}</span>
                  <span className="lg-stat-lbl">Updated</span>
                </div>
              </div>
              <div className="lg-card-footer">Triggered by: {log.triggered_by}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="lg-empty">No logs found</p>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
.lg-page {
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  padding: 20px;
  min-height: 100vh;
}

/* Toolbar */

.lg-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.lg-count {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

/* Search */

.lg-search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  transition: all 0.2s ease;
}

.lg-search-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
}

.lg-search {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
}

.lg-search-line {
  display: none;
}

/* List */

.lg-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Card */

.lg-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #6366f1;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.lg-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
}

/* Header */

.lg-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.lg-type {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  text-transform: capitalize;
}

/* Status badges */

.lg-badge-ok {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 3px 8px;
  border-radius: 5px;
}

.lg-badge-fail {
  font-size: 11px;
  font-weight: 600;
  color: #dc2626;
  background: #fee2e2;
  padding: 3px 8px;
  border-radius: 5px;
}

/* Stats */

.lg-card-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.lg-stat {
  display: flex;
  flex-direction: column;
}

.lg-stat-num {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.lg-stat-lbl {
  font-size: 10px;
  text-transform: uppercase;
  color: #94a3b8;
}

/* Footer */

.lg-card-footer {
  font-size: 12px;
  color: #64748b;
  border-top: 1px solid #f1f5f9;
  padding-top: 6px;
}

/* States */

.lg-loading,
.lg-empty {
  text-align: center;
  color: #94a3b8;
  margin-top: 40px;
}
      `}</style>
    </div>
  );
}
