import { useEffect, useState } from "react";
import { sapService } from "../services/sapService";
import type { Product } from "../services/sapService";


export default function Products() {
const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let data = await sapService.getProducts();
      setProducts(data);
    } catch (error) {
      console.log("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.item_code?.toLowerCase().includes(search.toLowerCase()) ||
      product.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      product.brand?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="pr-page">
      <div className="pr-toolbar">
        <span className="pr-count">Total: {filteredProducts.length}</span>
        <div className="pr-search-wrap">
          <input
            type="text"
            placeholder="Search by code, name or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-search"
          />
          <div className="pr-search-line" />
        </div>
      </div>

      {loading ? (
        <p className="pr-loading">Loading products...</p>
      ) : filteredProducts.length > 0 ? (
        <div className="pr-grid">
          {filteredProducts.map((product) => (
            <div className="pr-card" key={product.id}>
              <div className="pr-card-head">
                <span className="pr-code">{product.item_code}</span>
                {product.category && <span className="pr-badge">{product.category}</span>}
              </div>
              <div className="pr-card-name">{product.item_name}</div>
              <div className="pr-card-details">
                <span>Brand: {product.brand}</span>
                <span>Pack: {product.sal_pack_unit}</span>
                {product.variety && <span>Variety: {product.variety}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="pr-empry">No products found</p>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

.pr-page {
  font-family: 'Inter', sans-serif;
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
}

/* Toolbar */

.pr-toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.pr-count {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #6b7280;
}

/* Search */

.pr-search-wrap {
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

.pr-search-wrap:hover {
  border-color: #cbd5e1;
}

.pr-search-wrap:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.pr-search {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;s
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.pr-search::placeholder {
  color: #94a3b8;
}

.pr-search-line {
  display: none;
}

/* Grid */

.pr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

/* Card */

.pr-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.pr-card:hover {
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}
/* Card header */

.pr-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.pr-code {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* Badge */

.pr-badge {
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 3px 8px;
  border-radius: 5px;
}

/* Product name */

.pr-card-name {
  font-size: 14px;
  color: #374151;
  margin-bottom: 10px;
  font-weight: 500;
  text-align: left;
}

/* Details */

.pr-card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 12px;
  color: #64748b;
}

/* States */

.pr-loading,
.pr-empry {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  margin-top: 40px;
}

/* Mobile */

@media (max-width: 768px) {
  .pr-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .pr-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </div>
  );
}
