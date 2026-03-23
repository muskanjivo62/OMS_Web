import { useEffect, useState } from "react";
import { sapService } from "../services/sapService";
import type { Party } from "../services/sapService";

export default function Parties() {
const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    setLoading(true);
    try {
      let data = await sapService.getParties();
      setParties(data);
    } catch (error) {
      console.log("Error fetching parties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParties = parties.filter(
    (party) =>
      party.card_code?.toLowerCase().includes(search.toLowerCase()) ||
      party.card_name?.toLowerCase().includes(search.toLowerCase()) ||
      party.main_group?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="pt-page">
      <div className="pt-toolbar">
        <span className="pt-count">Total: {filteredParties.length}</span>
        <div className="pt-search-wrap">
          <input
            type="text"
            placeholder="Search by code, name or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pt-search"
          />
          <div className="pt-search-line" />
        </div>
      </div>

      {loading ? (
        <p className="pt-loading">Loading parties...</p>
      ) : filteredParties.length > 0 ? (
        <div className="pt-grid">
          {filteredParties.map((party) => (
            <div className="pt-card" key={party.id}>
              <div className="pt-card-head">
                <span className="pt-code">{party.card_code}</span>
                {party.category && <span className="pt-badge">{party.category}</span>}
              </div>
              <div className="pt-card-name">{party.card_name}</div>
              <div className="pt-card-details">
                <span>State: {party.state}</span>
                <span>Group: {party.main_group}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="pt-empty">No parties found</p>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

.pt-page {
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  padding: 20px;
  min-height: 100vh;
}
        .pt-toolbar {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin-bottom: 1.4rem;
        }

        .pt-count {
          font-size: 12px;
  font-weight: 600;
  color: #64748b;
        }

    .pt-search-wrap {
  flex: 1;
  position: relative;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.pt-search-wrap:hover {
  border-color: #cbd5e1;
}

.pt-search-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.pt-search {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.pt-search::placeholder {
  color: #94a3b8;
}

.pt-search-line {
  display: none;
}
        .pt-loading, .pt-empty {
          text-align: center;
          font-size: .9rem;
          color: #9ca3af;
          margin-top: 2rem;
        }

      .pt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

      .pt-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.pt-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}
        .pt-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: .5rem;
        }

    .pt-code {
  font-size: 14px;
  font-weight: 600;
  color: #1d4ed8;
}

     .pt-badge {
  font-size: 11px;
  font-weight: 600;
  color: #1e40af;
  background: #dbeafe;
  padding: 3px 8px;
  border-radius: 5px;
}
.pt-card-name {
  font-size: 14px;
  color: #374151;
  margin-bottom: 10px;
  font-weight: 500;
  text-align: left;
}

        .pt-card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 12px;
  color: #64748b;
}

        @media (max-width: 768px) {
          .pt-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
