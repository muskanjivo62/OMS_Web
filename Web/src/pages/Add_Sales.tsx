import { useState, useEffect } from "react";
import { ordersService } from "../services/ordersService";
import { userService } from "../services/userService";
import type { Product, PartyProduct, RowType } from "../services/ordersService";

export default function Add_Sales() {
   
  const [parties, setParties] = useState<any[]>([]);
  const [dispatch, setDispatch] = useState<any[]>([]); 
  const [billAddress, setBillAddress] = useState<any[]>([]);
  const [shipAddress, setShipAddress] = useState<any[]>([]);
  const [category, setCategory] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<any[]>([]);
  const [partyProducts, setPartyProducts] = useState<PartyProduct[]>([]);

  const [formData, setFormData] = useState({
    parties: "",
    dispatch: "",
    date: new Date().toISOString().split("T")[0],
    billAddress: "",
    shipAddress: "",
    Deliverydate: "",
    company: "",
    po_number: "",
  });

  const [rows, setRows] = useState<RowType[]>([
  {
    category: "",
    brand: "",
    variety: "",
    type: "",
    item: "",
    pcs: "",
    qty: "",
    ltrs: "",
    boxes: "",
    basicPrice: "",
    marketPrice: "",
    tax: "",
    amount: "",
  },
  ]);

  useEffect(() => {
    fetchPartyName();
    fetchDispatchFrom();
    fetchProducts();
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      let data = await userService.getCompany();
      setCompany(data);
    } catch (error) {
      console.log("Error fetching Company:", error);
    }
  };

  const fetchPartyName = async () => {
    try {
      let data = await ordersService.getPartyName();
      let filtered = data.filter((d: any) => (d.category).toLowerCase() === "oil");
      setParties(filtered);
    } catch (error) {
      console.log("Error fetching parties name:", error);
    }
  };

  const fetchDispatchFrom = async () => {
    try {
      let data = await ordersService.getDispatchFrom();
      setDispatch(data);
    } catch (error) {
      console.log("Error fetching dispatch data:", error);
    }
  };

  const fetchPartyAddresses = async (card_code: string) => {
    try {
      let data = await ordersService.getPartyAdd(card_code);
      setBillAddress(data.bill_to);
      setShipAddress(data.ship_to);
    } catch (error) {
      console.log("Error fetching addresses:", error);
    }
  };

  const fetchPartyCategories = async (card_code:string) => {
    try {
      let products = await ordersService.getPartyProduct(card_code);
      setPartyProducts(products);
      const categories = [...new Set(products.map((p: PartyProduct) => p.category))] as string[];
      setCategory(categories);
    } catch (error) {
      console.log("Error fetching categories:", error);
    }
  };
    
  const fetchProducts = async () => {
    let data = await ordersService.getProducts();
    setProducts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const selectedParty = parties.find((p) => p.value === formData.parties);

  const payload = {
    card_code: formData.parties,
    card_name: selectedParty?.label || "",
    bill_to_id: Number(formData.billAddress),
    bill_to_address:
      billAddress.find((b) => b.id === Number(formData.billAddress))
        ?.address_name || "",
    ship_to_id: Number(formData.shipAddress),
    ship_to_address:
      shipAddress.find((s) => s.id === Number(formData.shipAddress))
        ?.address_name || "",
    dispatch_from_id: Number(formData.dispatch),
    dispatch_from_name:
      dispatch.find((d) => d.id === Number(formData.dispatch))?.name || "",

    delivery_date: formData.Deliverydate,
    company: Number(formData.company),
    po_number: formData.po_number,

    total_amount: totalAmount,
    tax_amount: taxAmount,
    grand_total: grandTotal,

    items: rows.map((row) => ({
      item_code:
        partyProducts.find(
          (p) =>
            p.item_name === row.item &&
            p.category === row.category &&
            (p.brand || "") === (row.brand || "") &&
            (p.variety || "") === (row.variety || ""),
        )?.item_code || "",

      item_name: row.item,
      category: row.category,
      brand: row.brand,
      variety: row.variety,
      item_type: row.type,

      qty: Number(row.qty),
      pcs: Number(row.pcs),
      boxes: Number(row.boxes),
      ltrs: Number(row.ltrs),

      basic_price: Number(row.basicPrice),
      market_price: Number(row.marketPrice),
      tax_rate: Number(row.tax),
      total: Number(row.amount || 0),
    })),
  };

  try {
    console.log("Submitting Payload:", payload);
    const data = await ordersService.createOrder(payload);

    console.log("API Response:", data);

    alert("Order Added Successfully ✅");
    handleClearForm();

  } catch (error) {
    console.error(error);
    alert("Error creating order ❌");
  }

};

  const handleClearForm = () => {
    setFormData({
      parties: "",
      dispatch: "",
      date: new Date().toISOString().split("T")[0],
      billAddress: "",
      shipAddress: "",
      Deliverydate: "",
      company: "",
      po_number: ""
  
    });

    setRows([
      {
        category: "",
        brand: "",
        variety: "",
        type: "",
        item: "",
        pcs: "",
        qty: "",
        ltrs: "",
        boxes: "",
        basicPrice: "",
        marketPrice: "",
        tax: "",
        amount: "",
      },
    ]);
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        category: "",
        brand: "",
        variety: "",
        type: "",
        item: "",
        pcs: "",
        boxes: "",
        qty: "",
        ltrs: "",
        basicPrice: "",
        marketPrice: "",
        tax: "",
        amount: "",
      },
    ]);
  };

  const handleRowChange = (
  index: number,
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  let updatedRows = [...rows];
  let row = { ...updatedRows[index] };

  // assign value (RowType is all strings)
  (row as any)[name] = value;

  //  ITEM SELECT
  if (name === "item") {
    row.qty = "";
    row.ltrs = "";
    row.boxes = "";
    row.marketPrice = "";
    row.amount = "";

    const partyProduct = partyProducts.find(
      (p) =>
        p.item_name === value &&
        p.category === row.category &&
        (p.brand || "") === (row.brand || "") &&
        (p.variety || "") === (row.variety || "")
    );

    if (partyProduct) {
      const match = partyProduct.item_name.match(
        /(\d+\.?\d*)\s*(LTR|ML|KG|GM|GMS|L)/i,
      );
      row.type = match ? `${match[1]} ${match[2].toUpperCase()}` : "Others";
      row.pcs = String(partyProduct.sal_factor2 ?? "");
      row.tax = String(partyProduct.tax_rate ?? "");
      row.basicPrice = String(partyProduct.basic_rate ?? "");
    }
  }

  //  CALCULATIONS
  if (name === "qty" || name === "marketPrice") {
    const qty = Number(row.qty) || 0;
    const basic = Number(row.basicPrice) || 0;
    const market = Number(row.marketPrice) || 0;

    const price = market > 0 ? market : basic;

    row.amount = (price * qty).toFixed(2);

    const product =
      partyProducts.find((p) => (p.item_name || "") === (row.item || "")) ||
      products.find((p) => p.item_name === row.item);

    if (product) {
      row.ltrs = String(Number(product.sal_pack_unit) * qty);
      row.boxes = String(qty / (Number(product.sal_factor2) || 1));
    }
  }

  updatedRows[index] = row;
  setRows(updatedRows);
  };

  const handleDeleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "parties") {
      fetchPartyAddresses(value);
      fetchPartyCategories(value);
    }
  };

  const totalAmount = rows.reduce((sum, row) => {
    const amount = Number(row.amount);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const taxAmount = rows.reduce((sum, row) => {
    const amount = Number(row.amount);
    const taxRate = Number(row.tax);
    return sum + (isNaN(amount) ? 0 : (amount * taxRate) / 100);
  }, 0);

  const grandTotal = totalAmount + taxAmount;

  const getProductType = (itemName: string) => {
    const match = itemName.match(/(\d+\.?\d*)\s*(LTR|ML|KG|GM|GMS|L)/i);
    return match ? `${match[1]} ${match[2].toUpperCase()}` : "Others";
  };
  
  return (
    <div className="sl-page">
      <div className="sl-header">
        <h1 className="sl-title">Add Sales Order</h1>
      </div>

      <form className="sl-form" onSubmit={handleSubmit}>
        {/* Party Name */}
        <div className="sl-section-label">Order Details</div>
        <div className="sl-grid">
          <div className="sl-field">
            <label className="sl-label">Party Name</label>
            <div className="sl-input-wrap">
              <select
                value={formData.parties}
                name="parties"
                onChange={handleChange}
                required
              >
                <option>--select--</option>
                {parties.length > 0
                  ? parties.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))
                  : null}
              </select>
              <div className="sl-focus-line" />
            </div>
          </div>

          {/* Dispatch */}
          <div className="sl-field">
            <label className="sl-label">Dispatch From</label>
            <div className="sl-input-wrap">
              <select
                value={formData.dispatch}
                name="dispatch"
                onChange={handleChange}
                required
              >
                <option>--select--</option>
                {dispatch.length > 0
                  ? dispatch.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))
                  : null}
              </select>
              <div className="sl-focus-line" />
            </div>
          </div>

          {/* Date */}
          <div className="sl-field">
            <label className="sl-label">Date</label>
            <div className="sl-input-wrap">
              <input type="date" name="date" value={formData.date} readOnly />
              <div className="sl-focus-line" />
            </div>
          </div>

          {/* Bill To */}
          <div className="sl-field">
            <label className="sl-label">Bill To Address</label>
            <div className="sl-input-wrap">
              <select
                value={formData.billAddress}
                name="billAddress"
                onChange={handleChange}
                required
              >
                <option>--select--</option>
                {billAddress.length > 0
                  ? billAddress.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.address_name || b.full_address || b.address_id}
                      </option>
                    ))
                  : null}
              </select>
              <div className="sl-focus-line" />
            </div>
          </div>

          {/* Ship To */}
          <div className="sl-field">
            <label className="sl-label">Ship To Address</label>
            <div className="sl-input-wrap">
              <select
                value={formData.shipAddress}
                name="shipAddress"
                onChange={handleChange}
                required
              >
                <option>--select--</option>
                {shipAddress.length > 0
                  ? shipAddress.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.address_name || s.full_address || s.address_id}
                      </option>
                    ))
                  : null}
              </select>
              <div className="sl-focus-line" />
            </div>
          </div>

          {/* Delivery Date */}
          <div className="sl-field">
            <label className="sl-label" htmlFor="Deliverydate">Delivery Date</label>
            <div className="sl-input-wrap">
              <input
                type="date"
                name="Deliverydate"
                value={formData.Deliverydate}
                onChange={handleChange}
              />
              <div className="sl-focus-line" />
            </div>
          </div>
        </div>

        
        <div className="sl-table-wrap">
          <table className="sl-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Brand</th>
                <th>Variety</th>
                <th>Type</th>
                <th>Item</th>
                <th>Pcs</th>
                <th>Qty</th>
                <th>Ltrs</th>
                <th>Boxes</th>
                <th>Basic Price</th>
                <th>Market Price</th>
                <th>Tax %</th>
                <th>Amount</th>
                <th>X</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {/* Category */}
                  <td>
                    <select
                      value={row.category}
                      name="category"
                      onChange={(e) => handleRowChange(index, e)}
                    >
                      <option value="">--select--</option>
                      {category.map((c, i) => (
                        <option key={i} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Brand */}
                  <td>
                    <select
                      value={row.brand}
                      name="brand"
                      onChange={(e) => handleRowChange(index, e)}
                    >
                      <option value="">--select--</option>

                      {[
                        ...new Set(
                          partyProducts
                            .filter((p) => p.category === row.category)
                            .map((p) => p.brand),
                        ),
                      ].map((b, i) => (
                        <option key={i} value={b ?? ""}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Variety */}
                  <td>
                    <select
                      value={row.variety}
                      name="variety"
                      onChange={(e) => handleRowChange(index, e)}
                    >
                      <option value="">--select--</option>

                      {[
                        ...new Set(
                          partyProducts
                            .filter(
                              (p) =>
                                p.category === row.category &&
                                (p.brand || "") === (row.brand || ""),
                            )
                            .map((p) => p.variety),
                        ),
                      ].map((v, i) => (
                        <option key={i} value={v ?? ""}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Type */}
                  <td>
                    <select
                      value={row.type}
                      name="type"
                      onChange={(e) => handleRowChange(index, e)}
                    >
                      <option value="">--select--</option>

                      {[
                        ...new Set(
                          partyProducts
                            .filter(
                              (p) =>
                                p.category === row.category &&
                                (p.brand || "") === (row.brand || "") &&
                                (p.variety || "") === (row.variety || ""),
                            )
                            .map((p) => {
                              const match = p.item_name.match(
                                /(\d+\.?\d*)\s*(LTR|ML|KG|GM|GMS|L)/i,
                              );

                              return match
                                ? `${match[1]} ${match[2].toUpperCase()}`
                                : "Others";
                            }),
                        ),
                      ]
                        // Sort types properly
                        .sort((a, b) => {
                          if (a === "Others") return 1; // Others always last
                          if (b === "Others") return -1;

                          const numA = parseFloat(a);
                          const numB = parseFloat(b);

                          return numA - numB;
                        })
                        .map((t, i) => (
                          <option key={i} value={t}>
                            {t}
                          </option>
                        ))}
                    </select>
                  </td>

                  {/* Item */}
                  <td>
                    <select
                      value={row.item}
                      name="item"
                      onChange={(e) => handleRowChange(index, e)}
                    >
                      <option value="">--select--</option>

                      {partyProducts
                        .filter(
                          (p) =>
                            p.category === row.category &&
                            (p.brand || "") === (row.brand || "") &&
                            (p.variety || "") === (row.variety || "") &&
                            (row.type
                              ? getProductType(p.item_name) === row.type
                              : true),
                        )
                        .map((p, i) => (
                          <option key={i} value={p.item_name}>
                            {p.item_name}
                          </option>
                        ))}
                    </select>
                  </td>

                  {/* PCS */}
                  <td>
                    <input
                      type="number"
                      value={row.pcs ? Number(row.pcs).toFixed(1) : ""}
                      readOnly
                    />
                  </td>

                  {/* Qty */}
                  <td>
                    <input
                      type="number"
                      name="qty"
                      value={row.qty}
                      onChange={(e) => handleRowChange(index, e)}
                    />
                  </td>

                  {/* Ltrs */}
                  <td>
                    <input type="number" value={row.ltrs} readOnly />
                  </td>

                  <td>
                    <input type="number" value={row.boxes} readOnly />
                  </td>

                  {/* Basic Price */}
                  <td>
                    <input type="number" value={row.basicPrice} readOnly />
                  </td>

                  {/* Market Price */}
                  <td>
                    <input
                      type="number"
                      name="marketPrice"
                      value={row.marketPrice}
                      onChange={(e) => handleRowChange(index, e)}
                    />
                  </td>

                  {/* Tax */}
                  <td>
                    <input type="text"  value={(Number(row.tax)).toFixed(2)} readOnly />
                  </td>

                  {/* Amount */}
                  <td>
                    <input type="number" value={row.amount} readOnly />
                  </td>

                  {/* Delete */}
                  <td>
                    <button
                      type="button"
                      className="sl-delete-btn"
                      onClick={() => handleDeleteRow(index)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="sl-add-row" onClick={handleAddRow}>
          <span>+ Add Row</span>
        </button>

        <div className="sl-section-label">Summary</div>
        <div className="sl-grid">
          <div className="sl-field">
            <label className="sl-label">PO Number</label>
            <div className="sl-input-wrap">
              <input
                type="text"
                name="po_number"
                value={formData.po_number || ""}
                onChange={handleChange}
              />
              <div className="sl-focus-line" />
            </div>
          </div>

          <div className="sl-field">
            <label className="sl-label">Company</label>
            <div className="sl-input-wrap">
              <select
                value={formData.company}
                onChange={handleChange}
                name="company"
                required
              >
                <option value="">Select Company</option>
                {company.length > 0
                  ? company.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))
                  : null}
              </select>
              <div className="sl-focus-line" />
            </div>
          </div>

          <div className="sl-field">
            <label className="sl-label">Total</label>
            <div className="sl-input-wrap">
              <input type="text" value={totalAmount.toFixed(2)} readOnly />
              <div className="sl-focus-line" />
            </div>
          </div>

          <div className="sl-field">
            <label className="sl-label">Choose PO</label>
            <div className="sl-input-wrap">
              <input type="file" />
              <div className="sl-focus-line" />
            </div>
          </div>

          <div className="sl-field">
            <label className="sl-label">Tax</label>
            <div className="sl-input-wrap">
              <input type="text" value={taxAmount} readOnly />
              <div className="sl-focus-line" />
            </div>
          </div>

          <div className="sl-field">
            <label className="sl-label">Grand Total</label>
            <div className="sl-input-wrap">
              <input type="text" name="gtotal" value={grandTotal.toFixed(1)} readOnly />
              <div className="sl-focus-line" />
            </div>
          </div>

          {/* <div className="sl-field sl-full">
            <label className="sl-label">Comment</label>
            <div className="sl-input-wrap">
              <textarea rows={2} placeholder="Add a note..." />
              <div className="sl-focus-line" />
            </div>
          </div> */}
        </div>

        <div className="sl-actions">
          <button type="submit" className="sl-btn-save">
            <span>Save Order</span>
          </button>
          <button type="button" className="sl-btn-clear" onClick={handleClearForm}>
            <span>Clear</span>
          </button>
        </div>
      </form>

      <style>{`
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

/* ================= PAGE ================= */
.sl-page {
font-family: 'Inter', sans-serif;
background: #f1f5f9;
padding: 6px 16px; /* FIX: remove extra top space */
}

/* ================= HEADER ================= */
.sl-header {
margin-bottom: 6px; /* FIX: less gap */
}

.sl-title {
font-size: 20px;
font-weight: 600;
color: #1e293b;
text-align: left;
margin-top: -1rem;
}

/* ================= FORM ================= */
.sl-form {
width: 100%;
max-width: 1100px;
}

/* ================= SECTION ================= */
.sl-section-label {
font-size: 12px;
font-weight: 600;
color: #ffffff;
background: #1e293b;
padding: 6px 10px;
border-radius: 4px;
margin: 8px 0;
}

/* ================= GRID ================= */
.sl-grid {
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 12px;
}

/* ================= FIELD ================= */
.sl-field {
display: flex;
flex-direction: column;
}

/* 🔥 LABEL FIX */
.sl-label {
font-size: 13px;
font-weight: 500;
color: #1e293b; /* FIX: darker = visible */
margin-bottom: 3px;
text-align: left;
}

/* ================= INPUT WRAP ================= */
.sl-input-wrap {

border: 2px solid #94a3b8; 
border-radius: 6px;
padding: 5px 8px;
color: black;
}

/* focus */
.sl-input-wrap:focus-within {
border-color: #2563eb;
color: black;
}

/* ================= INPUT + SELECT ================= */
.sl-input-wrap input,
.sl-input-wrap select {
width: 100%;
border: none;
outline: none;
font-size: 13px;
background: transparent;
color: #111827;
color-scheme: light;
}

.sl-input-wrap select {
background: #ffffff;
}



/* ================= TABLE ================= */
.sl-table-wrap {
margin-top: 10px;
border-radius: 6px;
border: 1px solid #cbd5e1;
background: #ffffff;
overflow-x: auto;

}

.sl-table-wrap::-webkit-scrollbar {
height: 8px;
}

.sl-table-wrap::-webkit-scrollbar-track {
background: #e2e8f0;
border-radius: 0 0 6px 6px;
}

.sl-table-wrap::-webkit-scrollbar-thumb {
background: #64748b;
border-radius: 6px;
}

.sl-table-wrap::-webkit-scrollbar-thumb:hover {
background: #475569;
}






.sl-table {
width: 100%;
min-width: 1200px; 
border-collapse: collapse;
}

/* header */
.sl-table thead {
background: #1e293b;
}

.sl-table th {
color: #ffffff;
padding: 8px;
font-size: 12px;
text-align: left;
}

/* rows */
.sl-table td {
padding: 5px;
border-bottom: 1px solid #8a8b8b;
}

/* ================= TABLE INPUT ================= */
.sl-table td input,
.sl-table td select {
width: 100%;
border: 1.5px solid #94a3b8;
border-radius: 4px;
padding: 4px;
font-size: 12px;
background: #ffffff;
color: black;
color-scheme: light;
}

.sl-table td input:focus,
.sl-table td select:focus {
border-color: #2563eb;
}

/* ================= ADD ROW ================= */
.sl-add-row {
  display: block;
  width: fit-content;     /* button chhota rahe */
  margin-top: 10px;
  margin-bottom: 20px;
  margin-left: 0;         /* LEFT ALIGN */
  padding: 6px 12px;
  background: #2563eb;
  color: #fff;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}
/* ================= DELETE ================= */
.sl-delete-btn {
background: #fee2e2;
color: #dc2626;
border: none;
padding: 4px 6px;
border-radius: 4px;
cursor: pointer;
}


/* ================= BUTTONS ================= */
.sl-actions {
display: flex;
gap: 10px;
margin-top: 10px;
}

.sl-btn-save {
background: #2563eb;
color: #ffffff;
padding: 8px 14px;
border-radius: 5px;
border: none;
font-size: 13px;
cursor: pointer;
}

.sl-btn-clear {
border: 1px solid #ca1111;
padding: 8px 14px;
background: #ca1111;
border-radius: 5px;
font-size: 13px;
cursor: pointer;
}

/* ================= RESPONSIVE ================= */
@media (max-width: 1024px) {
.sl-grid {
grid-template-columns: repeat(2, 1fr);
}
}

@media (max-width: 768px) {
.sl-grid {
grid-template-columns: 1fr;
}
}

      `}</style>
    </div>
  );
  
}
