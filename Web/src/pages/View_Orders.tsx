import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ordersService } from "../services/ordersService";
import type { OrderItem, Order, OrderStatus } from "../services/ordersService";

const now = new Date();

// First day of current month
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  .toISOString()
  .split("T")[0];

// Last day of current month
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  .toISOString()
  .split("T")[0];


export default function View_Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [status, setStatus] = useState<OrderStatus[]>([]);
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(lastDay);

 
  useEffect(() => {
    fetchOrders();
    fetchOrderStatus();
  }, []);

  const fetchOrders = async () => {
    try {
      let data = await ordersService.getOrders();
      setOrders(data);
    } catch (error) {
      console.log("Error fetching orders:", error);
    }
  };

  const fetchOrderStatus = async () => {
    try {
      let data = await ordersService.getOrdersStatus();
      setStatus(data);
    } catch (error) {
      console.log("Error fetching order Status:", error);
    }
  };

  console.log("Selected Items:", JSON.stringify(selectedItems));
  console.log("Order Details:", JSON.stringify(orderDetails));

  const filteredOrders = orders.filter((order) => {
    const matchStatus = statusFilter ? order.status_display === statusFilter : true;
     let matchDate = true;

  if (fromDate && toDate) {
    const orderDate = new Date(order.created_at);
    const from = new Date(fromDate);
    const to = new Date(toDate);

    matchDate = orderDate >= from && orderDate <= to;
  }

    return matchStatus && matchDate;
  });

  const downloadExcel = (order: Order) => {
    let excelData = [];

    // If items exist → flatten data
    if (order.items && order.items.length > 0) {
      excelData = order.items.map((item: OrderItem) => ({
        "Order Number": order.order_number,
        "Card Code": order.card_code,
        "Card Name": order.card_name,
        "Delivery Date": order.delivery_date,
        "Status": order.status_display,

        "Bill To": order.bill_to_address,
        "Ship To": order.ship_to_address,
        "PO Number": order.po_number,

        "Item Code": item.item_code,
        "Item Name": item.item_name,
        "Boxes": item.qty,
        "PCS/Case": item.pcs,
        "Total PCS": item.boxes,
        "Liters": item.ltrs,
        "Total Amount": item.total,
      }));
    } else {
      // If no items → still export order
      excelData.push({
        "Order Number": order.order_number,
        "Card Code": order.card_code,
        "Card Name": order.card_name,
        "Delivery Date": order.delivery_date,
        "Status": order.status_display,
        "Bill To": order.bill_to_address,
        "Ship To": order.ship_to_address,
        "PO Number": order.po_number,
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, `Order_${order.order_number}.xlsx`);
  };
  return (
    <div className="vo-page">

      {/* ── LIST VIEW ── */}
      {!showDetails && (
        <>
          <div className="vo-toolbar">
            <div className="vo-search-wrap">
              <select
                className="vo-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {status.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              <div className="vo-date-wrap">
                <label className="vo-date-label">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="vo-date-input" />
              </div>
              <div className="vo-date-wrap">
                <label className="vo-date-label">To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="vo-date-input" />
              </div>
            </div>
            <span className="vo-count">Total: {filteredOrders.length}</span>
          </div>

          <div className="vo-table-wrap">
            <table className="vo-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Card Code</th>
                  <th>Card Name</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.card_code}</td>
                      <td>{order.card_name}</td>
                      <td>{order.delivery_date}</td>
                      <td>
                        <span className={`vo-badge vo-badge-${(order.status_display || "").toLowerCase().replace(/\s+/g, "-")}`}>
                          {order.status_display}
                        </span>
                      </td>
                      <td>
                        <button
                          className="vo-btn-view"
                          onClick={() => {
                            setOrderDetails(order);
                            setSelectedItems(order.items || []);
                            setShowDetails(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                      <td>
                        <button
                          className="vo-btn-download"
                          onClick={() => downloadExcel(order)}
                        >
                          Excel
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="vo-empty">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── DETAIL VIEW ── */}
      {showDetails && orderDetails && (
        <div className="vo-detail">
          {/* Top row */}
          <div className="vo-d-top">
            <button className="vo-d-back" onClick={() => setShowDetails(false)}>← Back</button>
            <span className="vo-d-ordnum">{orderDetails.order_number}</span>
            <span className={`vo-badge vo-badge-${(orderDetails.status_display || "").toLowerCase().replace(/\s+/g, "-")}`}>{orderDetails.status_display}</span>
            <span className="vo-d-spacer" />
            <button className="vo-d-export" onClick={() => downloadExcel(orderDetails)}>Export Excel</button>
          </div>

          {/* Info strip */}
          <div className="vo-d-section-label">Order Info</div>
          <div className="vo-d-info-strip">
            <div className="vo-d-cell"><span className="vo-d-cl">Party</span><span className="vo-d-cv">{orderDetails.card_name}</span></div>
            <div className="vo-d-cell"><span className="vo-d-cl">Code</span><span className="vo-d-cv">{orderDetails.card_code}</span></div>
            <div className="vo-d-cell"><span className="vo-d-cl">Bill To</span><span className="vo-d-cv">{orderDetails.bill_to_address || "—"}</span></div>
            <div className="vo-d-cell"><span className="vo-d-cl">Ship To</span><span className="vo-d-cv">{orderDetails.ship_to_address || "—"}</span></div>
            <div className="vo-d-cell"><span className="vo-d-cl">PO</span><span className="vo-d-cv">{orderDetails.po_number || "—"}</span></div>
            <div className="vo-d-cell"><span className="vo-d-cl">Delivery</span><span className="vo-d-cv">{orderDetails.delivery_date || "—"}</span></div>
          </div>

          {/* Items table — only this gets the dark header */}
          <div className="vo-table-wrap vo-d-table-wrap">
            <table className="vo-table">
              <thead>
                <tr>
                  <th>#</th><th>Item Code</th><th>Item Name</th><th>Category</th><th>Boxes</th><th>PCS/Case</th><th>Total PCS</th><th>Ltrs</th><th>Basic Price</th><th>Market Price</th><th>Tax %</th><th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.length > 0 ? selectedItems.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td><td>{item.item_code}</td><td>{item.item_name}</td><td>{item.category}</td>
                    <td>{item.qty}</td><td>{item.pcs}</td><td>{Number(item.boxes).toFixed(2)}</td><td>{item.ltrs}</td>
                    <td>{Number(item.basic_price).toFixed(2)}</td><td>{Number(item.market_price).toFixed(2)}</td>
                    <td>{Number(item.tax_rate).toFixed(2)}</td><td>{Number(item.total).toFixed(2)}</td>
                  </tr>
                )) : (<tr><td colSpan={12} className="vo-empty">No items found</td></tr>)}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="vo-d-summary">
            <div className="vo-d-stotal"><span className="vo-d-sl">Total</span><span className="vo-d-sv">{selectedItems.reduce((s, i) => s + Number(i.total || 0), 0).toFixed(2)}</span></div>
            <div className="vo-d-stotal"><span className="vo-d-sl">Tax</span><span className="vo-d-sv">{selectedItems.reduce((s, i) => s + (Number(i.total || 0) * Number(i.tax_rate || 0) / 100), 0).toFixed(2)}</span></div>
            <div className="vo-d-stotal vo-d-grand"><span className="vo-d-sl">Grand Total</span><span className="vo-d-sv">{(selectedItems.reduce((s, i) => s + Number(i.total || 0), 0) + selectedItems.reduce((s, i) => s + (Number(i.total || 0) * Number(i.tax_rate || 0) / 100), 0)).toFixed(2)}</span></div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .vo-page { font-family: 'Inter', sans-serif; }

        .vo-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; gap:12px; }
        .vo-count { font-size:12px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#6b7280; }
        .vo-search-wrap { display:flex; align-items:center; gap:10px; }
        .vo-status-select { background:#fff; border:1px solid #7f8183; border-radius:6px; padding:6px 10px; font-size:13px; font-family:'Inter',sans-serif; color:#1e293b; outline:none; cursor:pointer; }
        .vo-status-select:focus { border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.15); }

        .vo-date-wrap { display:flex; align-items:center; gap:6px; }
        .vo-date-label { font-size:12px; font-weight:500; color:#1e293b; white-space:nowrap; }
        .vo-date-input { background:#fff; border:1px solid #7f8183; border-radius:6px; padding:6px 10px; font-size:13px; font-family:'Inter',sans-serif; color:#1e293b; outline:none; color-scheme:light; }
        .vo-date-input:focus { border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.15); }

        .vo-table-wrap { border-radius:8px; border:1px solid #e2e8f0; background:#fff; overflow-x:auto; overflow-y:auto; max-height:calc(100vh - 58px - 4rem - 60px); }
        .vo-table-wrap::-webkit-scrollbar { width:6px; height:6px; }
        .vo-table-wrap::-webkit-scrollbar-track { background:#f1f5f9; }
        .vo-table-wrap::-webkit-scrollbar-thumb { background:#94a3b8; border-radius:6px; }

        .vo-table { width:100%; border-collapse:collapse; font-size:13px; }
        .vo-table thead { background:#1e293b; position:sticky; top:0; z-index:1; }
        .vo-table th { color:#fff; padding:10px 12px; font-size:12px; font-weight:600; text-align:left; white-space:nowrap; }
        .vo-table td { padding:10px 12px; border-bottom:1px solid #f1f5f9; color:#374151; }
        .vo-table tbody tr:hover { background:#f8fafc; }
        .vo-table tbody tr:nth-child(even) { background:#fafafa; }
        .vo-table tbody tr:nth-child(even):hover { background:#f1f5f9; }
        .vo-empty { text-align:center; color:#94a3b8; padding:24px !important; }

        .vo-badge { display:inline-block; padding:3px 8px; border-radius:5px; font-size:11px; font-weight:600; background:#dbeafe; color:#1e40af; }
        .vo-btn-view { background:#1e293b; color:#fff; border:none; border-radius:5px; padding:5px 10px; font-size:12px; font-family:'Inter',sans-serif; cursor:pointer; }
        .vo-btn-view:hover { background:#334155; }
        .vo-btn-download { background:#16a34a; color:#fff; border:none; border-radius:5px; padding:5px 10px; font-size:12px; font-family:'Inter',sans-serif; font-weight:500; cursor:pointer; }
        .vo-btn-download:hover { background:#15803d; }

        /* ====== DETAIL ====== */
        .vo-detail { display:flex; flex-direction:column; gap:10px; }

        /* Top row — light */
        .vo-d-top { display:flex; align-items:center; gap:10px; }
        .vo-d-back { background:none; color:#64748b; border:none; padding:0; font-size:13px; font-weight:500; font-family:'Inter',sans-serif; cursor:pointer; }
        .vo-d-back:hover { color:#1e293b; }
        .vo-d-ordnum { font-size:15px; font-weight:700; color:#1e293b; }
        .vo-d-spacer { flex:1; }
        .vo-d-export { background:#1e293b; color:#fff; border:none; border-radius:5px; padding:5px 14px; font-size:12px; font-weight:500; font-family:'Inter',sans-serif; cursor:pointer; }
        .vo-d-export:hover { background:#334155; }

        .vo-d-section-label { font-size:11px; font-weight:600; color:white; padding:3px; display:inline-block; text-align:left; background:#1e293b; border-radius:4px; width:fit-content; }
        .vo-d-info-strip { display:flex; background:#fff; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; }
        .vo-d-cell { flex:1; padding:10px 14px; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; gap:2px; min-width:0; color:#1e293b; }
        .vo-d-cell:last-child { border-right:none; }
        .vo-d-cl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:#1e293b; }
        .vo-d-cv { font-size:12px; font-weight:600; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        /* Items table — only this has dark header */
        .vo-d-table-wrap { border-radius:6px; max-height:calc(100vh - 58px - 4rem - 240px); }

        /* Summary — light */
        .vo-d-summary { display:flex; gap:16px; justify-content:flex-end; }
        .vo-d-stotal { display:flex; align-items:center; gap:6px; font-size:13px; }
        .vo-d-sl { color:#64748b; font-weight:500; }
        .vo-d-sv { color:#1e293b; font-weight:600; }
        .vo-d-grand { background:#1e293b; padding:6px 14px; border-radius:5px; }
        .vo-d-grand .vo-d-sl { color:#94a3b8; }
        .vo-d-grand .vo-d-sv { color:#fff; font-size:15px; font-weight:700; }

        @media (max-width:768px) {
          .vo-d-info-strip { flex-wrap:wrap; }
          .vo-d-cell { flex:1 1 45%; border-bottom:1px solid #e2e8f0; }
          .vo-d-top { flex-wrap:wrap; }
          .vo-d-summary { flex-wrap:wrap; justify-content:flex-start; }
        }
      `}</style>
    </div>
  );
}
