import { useEffect, useState } from "react";
import { sapService } from "../services/sapService";
import type { Address } from "../services/sapService";

export default function Addresses() {
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      let data = await sapService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.log("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAddresses = addresses.filter(
    (address) =>
      address.card_code?.toLowerCase().includes(search.toLowerCase()) ||
      address.address_name?.toLowerCase().includes(search.toLowerCase()) ||
      address.city?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="ad-page">
      <div className="ad-toolbar">
        <span className="ad-count">Total: {filteredAddresses.length}</span>
        <div className="ad-search-wrap">
          <input
            type="text"
            placeholder="Search by code, name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ad-search"
          />
          <div className="ad-search-line" />
        </div>
      </div>

      {loading ? (
        <p className="ad-loading">Loading addresses...</p>
      ) : filteredAddresses.length > 0 ? (
        <div className="ad-grid">
          {filteredAddresses.map((address) => (
            <div className="ad-card" key={address.id}>
              <div className="ad-card-head">
                <span className="ad-code">{address.card_code}</span>
                <span className="ad-badge">{address.address_type === "S" ? "Shipping" : "Billing"}</span>
              </div>
              <div className="ad-card-name">{address.address_name}</div>
              {address.full_address && <div className="ad-card-addr">{address.full_address}</div>}
              <div className="ad-card-details">
                <span>City: {address.city}</span>
                <span>State: {address.state}</span>
                <span>PIN: {address.zip_code}</span>
                {address.gst_number && <span>GST: {address.gst_number}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="ad-empty">No addresses found</p>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

       .ad-page {
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  padding: 20px;
  min-height: 100vh;
}

/* Toolbar */

.ad-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.ad-count {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

/* Search */

.ad-search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  transition: all 0.2s ease;
}

.ad-search-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
}

.ad-search {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
}

.ad-search-line {
  display: none;
}

/* Grid */

.ad-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 18px;
}

/* Card */

.ad-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.ad-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.08);
}

/* Card header */

.ad-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ad-code {
  font-size: 14px;
  font-weight: 600;
  color: #1d4ed8;
}

/* Badge */

.ad-badge {
  font-size: 11px;
  font-weight: 600;
  background: #dbeafe;
  color: #1e40af;
  padding: 3px 8px;
  border-radius: 5px;
}

/* Address name */

.ad-card-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
  text-align: left;
}

/* Address line */

.ad-card-addr {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
  text-align: left;
}

/* Details */

.ad-card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 12px;
  color: #475569;
}

.ad-card-details span {
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 5px;
}

/* States */

.ad-loading,
.ad-empty {
  text-align: center;
  color: #94a3b8;
  margin-top: 40px;
}

/* Mobile */

@media (max-width: 768px) {
  .ad-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </div>
  );
}
