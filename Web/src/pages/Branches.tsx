import { useEffect, useState } from "react";
import { sapService } from "../services/sapService";
import type { Branch } from "../services/sapService";

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      let data = await sapService.getBranches();
      setBranches(data);
    } catch (error) {
      console.log("Error fetching Branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.bpl_id?.toString().includes(search.toLowerCase()) ||
      branch.bpl_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="br-page">
      <div className="br-toolbar">
        <span className="br-count">Total: {filteredBranches.length}</span>
        <div className="br-search-wrap">
          <input
            type="text"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="br-search"
          />
          <div className="br-search-line" />
        </div>
      </div>

      {loading ? (
        <p className="br-loading">Loading branches...</p>
      ) : filteredBranches.length > 0 ? (
        <div className="br-grid">
          {filteredBranches.map((branch) => (
            <div className="br-card" key={branch.id}>
              <div className="br-card-head">
                <span className="br-code">BPL-{branch.bpl_id}</span>
                <span className={branch.is_active ? "br-badge-active" : "br-badge-inactive"}>
                  {branch.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="br-card-name">{branch.bpl_name}</div>
              <div className="br-card-details">
                <span>Updated: {branch.updated_at}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="br-empty">No branches found</p>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

       .br-page {
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  padding: 20px;
  min-height: 100vh;
}

/* Toolbar */

.br-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.br-count {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

/* Search */

.br-search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  transition: all 0.2s ease;
}

.br-search-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
}

.br-search {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
}

.br-search-line {
  display: none;
}

/* Grid */

.br-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

/* Card */

.br-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.br-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
}

/* Header */

.br-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.br-code {
  font-size: 14px;
  font-weight: 600;
  color: #1d4ed8;
}

/* Badges */

.br-badge-active {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 3px 8px;
  border-radius: 5px;
}

.br-badge-inactive {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 5px;
}

/* Name */

.br-card-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 6px;
  text-align: left;
}

/* Details */

.br-card-details {
  font-size: 12px;
  color: #64748b;
  text-align: left;
}

/* States */

.br-loading,
.br-empty {
  text-align: center;
  color: #94a3b8;
  margin-top: 40px;
}

/* Mobile */

@media (max-width: 768px) {
  .br-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </div>
  );
}
