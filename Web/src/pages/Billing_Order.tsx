import { useState, useEffect } from "react";
import { ordersService } from "../services/ordersService";
import type { Order, OrderItem } from "../services/ordersService";

const now = new Date();

// First day of current month
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  .toISOString()
  .split("T")[0];

// Last day of current month
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  .toISOString()
  .split("T")[0];

export default function Billing_orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(firstDay);
  const [toDate, setToDate] = useState(lastDay);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await ordersService.getOrders(3);
      setOrders(data);
    } catch (error) {
      console.log("Error fetching orders:", error);
    }
  };

  const toggleMore = (orderId: number) => {
    setActiveOrderId(activeOrderId === orderId ? null : orderId);
  };

  const approveStatus = async (orderId: number) => {
    try {
      await ordersService.UpdateStatus(orderId, 6);
      alert("Status Updated");
      

      // const userChoice = window.confirm(
      //   "Do you want to create Sales Quotation for this order?",
      // );
      // if (userChoice) {
      //   const salesResponse = await api.post("/sap/approve-order/", {
      //     order_id: orderId,
      //   });
      //   if (salesResponse.data) {
      //     alert("Sales Quotation Created");
      //   }
      // }
      fetchOrders();
    } catch (error: any) {
      alert("Error: " + (error?.response?.data?.message || "Something went wrong"));
    }
  };

  const rejectStatus = async (orderId: number | null) => {
    if (!orderId) return;
    if (!rejectReason.trim()) {
      alert("Reason required");
      return;
    }
    try {
      await ordersService.UpdateStatus(orderId, 8, rejectReason);
      alert("Order Rejected");
      setShowRejectModal(false);
      setRejectReason("");
      fetchOrders();
    } catch (error: any) {
      alert("Error: " + (error?.response?.data?.message || "Unknown error"));
    }
  };

  const pendingApproval = async (orderId: number) => {
    try {
      await ordersService.UpdateStatus(orderId, 5);
      alert("Status Updated");
      setActiveOrderId(null);
      fetchOrders();
    } catch (error: any) {
      alert("Error: " + (error?.response?.data?.message || "Unknown error"));
    }
  };

  const needApproval = async (orderId: number) => {
    try {
      await ordersService.UpdateStatus(orderId, 4);
      alert("Status Updated");
      setActiveOrderId(null);
      fetchOrders();
    } catch (error: any) {
      alert("Error: " + (error?.response?.data?.message || "Unknown error"));
    }
  };

    const filteredOrders = orders.filter((order) => {
     let matchDate = true;

  if (fromDate && toDate) {
    const orderDate = new Date(order.created_at);
    const from = new Date(fromDate);
    const to = new Date(toDate);


    matchDate = orderDate >= from && orderDate <= to;
  }

    return matchDate;
  });

  return (
    <div className="bo-page">

      {/* ── LIST VIEW ── */}
      {!showDetails && (
        <>
          <div className="bo-toolbar">
            <div className="bo-search-wrap">
              <div className="bo-date-wrap">
                <label className="bo-date-label">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bo-date-input" />
              </div>
              <div className="bo-date-wrap">
                <label className="bo-date-label">To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bo-date-input" />
              </div>
            </div>
            <span className="bo-count">Total: {filteredOrders.length}</span>
          </div>

          <div className="bo-table-wrap">
            <table className="bo-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Card Code</th>
                  <th>Card Name</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>Action</th>
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
                        <span className={`bo-badge bo-badge-${(order.status_display || "").toLowerCase().replace(/\s+/g, "-")}`}>
                          {order.status_display}
                        </span>
                      </td>
                      <td>
                        <button
                          className="bo-btn-view"
                          onClick={() => {
                            setOrderDetails(order);
                            setSelectedItems(order.items || []);
                            setShowDetails(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                      <td className="bo-action-cell">
                        <button
                          className="bo-btn-approve"
                          onClick={() => approveStatus(order.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="bo-btn-reject"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </button>
                        <div className="bo-more-wrap">
                          <button
                            className="bo-btn-more"
                            onClick={() => toggleMore(order.id)}
                          >
                            More
                          </button>
                          {activeOrderId === order.id && (
                            <div className="bo-dropdown">
                              <button
                                className="bo-dropdown-item"
                                onClick={() => needApproval(order.id)}
                              >
                                Need Approval
                              </button>
                              <button
                                className="bo-dropdown-item"
                                onClick={() => pendingApproval(order.id)}
                              >
                                Pending Approval
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="bo-empty">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── DETAIL VIEW ── */}
      {showDetails && orderDetails && (
        <div className="bo-detail">
          <div className="bo-d-top">
            <button className="bo-d-back" onClick={() => setShowDetails(false)}>← Back</button>
            <span className="bo-d-ordnum">{orderDetails.order_number}</span>
            <span className={`bo-badge bo-badge-${(orderDetails.status_display || "").toLowerCase().replace(/\s+/g, "-")}`}>{orderDetails.status_display}</span>
            <span className="bo-d-spacer" />
          </div>
          <div className="bo-d-section-label">Order Info</div>
          <div className="bo-d-info-strip">
            <div className="bo-d-cell"><span className="bo-d-cl">Party</span><span className="bo-d-cv">{orderDetails.card_name}</span></div>
            <div className="bo-d-cell"><span className="bo-d-cl">Code</span><span className="bo-d-cv">{orderDetails.card_code}</span></div>
            <div className="bo-d-cell"><span className="bo-d-cl">Bill To</span><span className="bo-d-cv">{orderDetails.bill_to_address || "—"}</span></div>
            <div className="bo-d-cell"><span className="bo-d-cl">Ship To</span><span className="bo-d-cv">{orderDetails.ship_to_address || "—"}</span></div>
            <div className="bo-d-cell"><span className="bo-d-cl">PO</span><span className="bo-d-cv">{orderDetails.po_number || "—"}</span></div>
            <div className="bo-d-cell"><span className="bo-d-cl">Delivery</span><span className="bo-d-cv">{orderDetails.delivery_date || "—"}</span></div>
          </div>
          <div className="bo-table-wrap bo-d-table-wrap">
            <table className="bo-table">
              <thead><tr><th>#</th><th>Item Code</th><th>Item Name</th><th>Category</th><th>Qty</th><th>Pcs</th><th>Boxes</th><th>Ltrs</th><th>Basic Price</th><th>Market Price</th><th>Tax %</th><th>Amount</th></tr></thead>
              <tbody>
                {selectedItems.length > 0 ? selectedItems.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td><td>{item.item_code}</td><td>{item.item_name}</td><td>{item.category}</td>
                    <td>{item.qty}</td><td>{item.pcs}</td><td>{Number(item.boxes).toFixed(2)}</td><td>{item.ltrs}</td>
                    <td>{Number(item.basic_price).toFixed(2)}</td><td>{Number(item.market_price).toFixed(2)}</td>
                    <td>{Number(item.tax_rate).toFixed(2)}</td><td>{Number(item.total).toFixed(2)}</td>
                  </tr>
                )) : (<tr><td colSpan={12} className="bo-empty">No items found</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="bo-d-summary">
            <div className="bo-d-stotal"><span className="bo-d-sl">Total</span><span className="bo-d-sv">{selectedItems.reduce((s, i) => s + Number(i.total || 0), 0).toFixed(2)}</span></div>
            <div className="bo-d-stotal"><span className="bo-d-sl">Tax</span><span className="bo-d-sv">{selectedItems.reduce((s, i) => s + (Number(i.total || 0) * Number(i.tax_rate || 0) / 100), 0).toFixed(2)}</span></div>
            <div className="bo-d-stotal bo-d-grand"><span className="bo-d-sl">Grand Total</span><span className="bo-d-sv">{(selectedItems.reduce((s, i) => s + Number(i.total || 0), 0) + selectedItems.reduce((s, i) => s + (Number(i.total || 0) * Number(i.tax_rate || 0) / 100), 0)).toFixed(2)}</span></div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {showRejectModal && (
        <div className="bo-modal-overlay">
          <div className="bo-modal">
            <div className="bo-modal-title">Rejection Reason</div>
            <textarea
              className="bo-modal-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Type reason..."
              rows={4}
            />
            <div className="bo-modal-actions">
              <button
                className="bo-btn-approve"
                onClick={() => rejectStatus(selectedOrderId)}
              >
                Submit
              </button>
              <button
                className="bo-btn-cancel"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        .bo-page { font-family: 'Inter', sans-serif; }

        .bo-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 12px;
        }

        .bo-count {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .bo-search-wrap { display:flex; align-items:center; gap:10px; }
        .bo-date-wrap { display:flex; align-items:center; gap:6px; }
        .bo-date-label { font-size:12px; font-weight:500; color:#1e293b; white-space:nowrap; }
        .bo-date-input { background:#fff; border:1px solid #7f8183; border-radius:6px; padding:6px 10px; font-size:13px; font-family:'Inter',sans-serif; color:#1e293b; outline:none; color-scheme:light; }
        .bo-date-input:focus { border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.15); }

        /* TABLE WRAP */
        .bo-table-wrap {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          overflow-x: auto;
          overflow-y: auto;
          max-height: calc(100vh - 58px - 4rem - 60px);
        }

        .bo-detail .bo-table-wrap {
          max-height: calc(100vh - 58px - 4rem - 200px);
        }

        .bo-table-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
        .bo-table-wrap::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 6px; }
        .bo-table-wrap::-webkit-scrollbar-thumb { background: #64748b; border-radius: 6px; }
        .bo-table-wrap::-webkit-scrollbar-thumb:hover { background: #475569; }

        /* TABLE */
        .bo-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .bo-table thead {
          background: #1e293b;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .bo-table th {
          color: #ffffff;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          white-space: nowrap;
        }

        .bo-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
        }

        .bo-table tbody tr:hover { background: #f8fafc; }
        .bo-table tbody tr:nth-child(even) { background: #fafafa; }
        .bo-table tbody tr:nth-child(even):hover { background: #f1f5f9; }

        .bo-action-cell {
          white-space: nowrap;
        }

        .bo-empty {
          text-align: center;
          color: #94a3b8;
          padding: 24px !important;
        }

        /* BADGE */
        .bo-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          background: #dbeafe;
          color: #1e40af;
        }

        /* BUTTONS */
        .bo-btn-view {
          background: #1e293b;
          color: #ffffff;
          border: none;
          border-radius: 5px;
          padding: 5px 10px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.2s;
        }
        .bo-btn-view:hover { background: #334155; }

        .bo-btn-approve {
          background: #16a34a;
          color: #ffffff;
          border: none;
          border-radius: 5px;
          padding: 5px 12px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          margin-right: 6px;
        }
        .bo-btn-approve:hover { background: #15803d; }

        .bo-btn-reject {
          background: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 5px;
          padding: 5px 12px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          margin-right: 6px;
        }
        .bo-btn-reject:hover { background: #b91c1c; }

        .bo-btn-more {
          background: #2563eb;
          color: #ffffff;
          border: none;
          border-radius: 5px;
          padding: 5px 12px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .bo-btn-more:hover { background: #1d4ed8; }

        .bo-btn-back-link { background:#fff; border:1px solid #cbd5e1; color:#475569; font-size:13px; font-weight:500; font-family:'Inter',sans-serif; cursor:pointer; padding:7px 16px; border-radius:8px; transition:all .2s; }
        .bo-btn-back-link:hover { background:#f1f5f9; border-color:#94a3b8; color:#0f172a; }

        .bo-btn-cancel {
          background: #ffffff;
          color: #dc2626;
          border: 1px solid #fca5a5;
          border-radius: 5px;
          padding: 5px 12px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bo-btn-cancel:hover { background: #fef2f2; border-color: #f87171; }

        /* MORE DROPDOWN */
        .bo-more-wrap {
          display: inline-block;
          position: relative;
        }

        .bo-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          z-index: 100;
          min-width: 140px;
          padding: 4px 0;
        }

        .bo-dropdown-item {
          display: block;
          width: 100%;
          padding: 8px 14px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          color: #374151;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }
        .bo-dropdown-item:hover { background: #f1f5f9; }

        /* DETAIL VIEW */
        .bo-detail { display:flex; flex-direction:column; gap:10px; }
        .bo-d-top { display:flex; align-items:center; gap:10px; }
        .bo-d-back { background:none; color:#64748b; border:none; padding:0; font-size:13px; font-weight:500; font-family:'Inter',sans-serif; cursor:pointer; }
        .bo-d-back:hover { color:#1e293b; }
        .bo-d-ordnum { font-size:15px; font-weight:700; color:#1e293b; }
        .bo-d-spacer { flex:1; }

        .bo-d-section-label { font-size:11px; font-weight:600; color:white; padding: 3px; display:inline-block; text-align: left; background: #1e293b; border-radius: 4px; width: fit-content; }
        .bo-d-info-strip { display:flex; background:#fff; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; }
        .bo-d-cell { flex:1; padding:10px 14px; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; gap:2px; min-width:0;  color:#1e293b; }
        .bo-d-cell:last-child { border-right:none; }
        .bo-d-cl { font-size:10px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; color:#1e293b; }
        .bo-d-cv { font-size:12px; font-weight:600; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .bo-d-table-wrap { border-radius:6px; max-height:calc(100vh - 58px - 4rem - 240px); }

        .bo-d-summary { display:flex; gap:16px; justify-content:flex-end; }
        .bo-d-stotal { display:flex; align-items:center; gap:6px; font-size:13px; }
        .bo-d-sl { color:#64748b; font-weight:500; }
        .bo-d-sv { color:#1e293b; font-weight:600; }
        .bo-d-grand { background:#1e293b; padding:6px 14px; border-radius:5px; }
        .bo-d-grand .bo-d-sl { color:#94a3b8; }
        .bo-d-grand .bo-d-sv { color:#fff; font-size:15px; font-weight:700; }

        @media (max-width:768px) {
          .bo-d-info-strip { flex-wrap:wrap; }
          .bo-d-cell { flex:1 1 45%; border-bottom:1px solid #e2e8f0; }
          .bo-d-top { flex-wrap:wrap; }
          .bo-d-summary { flex-wrap:wrap; justify-content:flex-start; }
        }

        /* MODAL */
        .bo-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .bo-modal {
          background: #ffffff;
          border-radius: 10px;
          padding: 24px;
          width: 340px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }

        .bo-modal-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .bo-modal-textarea {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        }
        .bo-modal-textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
        }

        .bo-modal-actions { display: flex; gap: 8px; }

      `}</style>
    </div>
  );
}
