import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ordersService } from "../services/ordersService";
import type { Order, OrderItem } from "../services/ordersService";

export default function Auditor_orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await ordersService.getOrders(10);
      setOrders(data);
    } catch (error) {
      console.log("Error fetching orders:", error);
    }
  };

  const approveStatus = async (orderId: number) => {
    try {
      await ordersService.UpdateStatus(orderId, 10);
      alert("Status Updated");
      fetchOrders();
    } catch (error: any) {
      alert("Error: " + (error?.response?.data?.message || "Unknown error"));
    }
  };

  const rejectStatus = async (orderId: number | null) => {
    if (!orderId) return;
    if (!rejectReason.trim()) {
      alert("Reason required");
      return;
    }
    try {
      await ordersService.UpdateStatus(orderId, 7, rejectReason);
      alert("Order Rejected");
      setShowRejectModal(false);
      setRejectReason("");
      fetchOrders();
    } catch (error: any) {
      alert("Error: " + (error?.response?.data?.message || "Unknown error"));
    }
  };

  const downloadExcel = (order: Order) => {
    let excelData: object[] = [];

    if (order.items && order.items.length > 0) {
      excelData = order.items.map((item: OrderItem) => ({
        "Order Number": order.order_number,
        "Card Code": order.card_code,
        "Card Name": order.card_name,
        "Delivery Date": order.delivery_date,
        Status: order.status_display,
        "Bill To": order.bill_to_address,
        "Ship To": order.ship_to_address,
        "PO Number": order.po_number,
        "Item Code": item.item_code,
        "Item Name": item.item_name,
        Boxes: item.qty,
        "PCS/Case": item.pcs,
        "Total PCS": item.boxes,
        Liters: item.ltrs,
        "Total Amount": item.total,
      }));
    } else {
      excelData.push({
        "Order Number": order.order_number,
        "Card Code": order.card_code,
        "Card Name": order.card_name,
        "Delivery Date": order.delivery_date,
        Status: order.status_display,
        "Bill To": order.bill_to_address,
        "Ship To": order.ship_to_address,
        "PO Number": order.po_number,
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(file, `Order_${order.order_number}.xlsx`);
  };

  return (
    <div className="ao-page">

      {/* ── LIST VIEW ── */}
      {!showDetails && (
        <>
          <div className="ao-toolbar">
            <span className="ao-count">Total: {orders.length}</span>
          </div>

          <div className="ao-table-wrap">
            <table className="ao-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Card Code</th>
                  <th>Card Name</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>Action</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.card_code}</td>
                      <td>{order.card_name}</td>
                      <td>{order.delivery_date}</td>
                      <td>
                        <span className={`ao-badge ao-badge-${(order.status_display || "").toLowerCase().replace(/\s+/g, "-")}`}>
                          {order.status_display}
                        </span>
                      </td>
                      <td>
                        <button
                          className="ao-btn-view"
                          onClick={() => {
                            setOrderDetails(order);
                            setSelectedItems(order.items || []);
                            setShowDetails(true);
                          }}
                        >
                          View
                        </button>
                      </td>
                      <td className="ao-action-cell">
                        <button
                          className="ao-btn-approve"
                          onClick={() => approveStatus(order.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="ao-btn-reject"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </button>
                      </td>
                      <td>
                        <button
                          className="ao-btn-download"
                          onClick={() => downloadExcel(order)}
                        >
                          Excel
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="ao-empty">No orders found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── DETAIL VIEW ── */}
      {showDetails && orderDetails && (
        <div className="ao-detail">
          <div className="ao-d-top">
            <button className="ao-d-back" onClick={() => setShowDetails(false)}>← Back</button>
            <span className="ao-d-ordnum">{orderDetails.order_number}</span>
            <span className={`ao-badge ao-badge-${(orderDetails.status_display || "").toLowerCase().replace(/\s+/g, "-")}`}>{orderDetails.status_display}</span>
            <span className="ao-d-spacer" />
            <button className="ao-d-export" onClick={() => downloadExcel(orderDetails)}>Export Excel</button>
          </div>
          <div className="ao-d-section-label">Order Info</div>
          <div className="ao-d-info-strip">
            <div className="ao-d-cell"><span className="ao-d-cl">Party</span><span className="ao-d-cv">{orderDetails.card_name}</span></div>
            <div className="ao-d-cell"><span className="ao-d-cl">Code</span><span className="ao-d-cv">{orderDetails.card_code}</span></div>
            <div className="ao-d-cell"><span className="ao-d-cl">Bill To</span><span className="ao-d-cv">{orderDetails.bill_to_address || "—"}</span></div>
            <div className="ao-d-cell"><span className="ao-d-cl">Ship To</span><span className="ao-d-cv">{orderDetails.ship_to_address || "—"}</span></div>
            <div className="ao-d-cell"><span className="ao-d-cl">PO</span><span className="ao-d-cv">{orderDetails.po_number || "—"}</span></div>
            <div className="ao-d-cell"><span className="ao-d-cl">Delivery</span><span className="ao-d-cv">{orderDetails.delivery_date || "—"}</span></div>
          </div>
          <div className="ao-table-wrap ao-d-table-wrap">
            <table className="ao-table">
              <thead><tr><th>#</th><th>Item Code</th><th>Item Name</th><th>Category</th><th>Boxes</th><th>PCS/Case</th><th>Total PCS</th><th>Ltrs</th><th>Basic Price</th><th>Market Price</th><th>Tax %</th><th>Amount</th></tr></thead>
              <tbody>
                {selectedItems.length > 0 ? selectedItems.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td><td>{item.item_code}</td><td>{item.item_name}</td><td>{item.category}</td>
                    <td>{item.qty}</td><td>{item.pcs}</td><td>{Number(item.boxes).toFixed(2)}</td><td>{item.ltrs}</td>
                    <td>{Number(item.basic_price).toFixed(2)}</td><td>{Number(item.market_price).toFixed(2)}</td>
                    <td>{Number(item.tax_rate).toFixed(2)}</td><td>{Number(item.total).toFixed(2)}</td>
                  </tr>
                )) : (<tr><td colSpan={12} className="ao-empty">No items found</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="ao-d-summary">
            <div className="ao-d-stotal"><span className="ao-d-sl">Total</span><span className="ao-d-sv">{selectedItems.reduce((s, i) => s + Number(i.total || 0), 0).toFixed(2)}</span></div>
            <div className="ao-d-stotal"><span className="ao-d-sl">Tax</span><span className="ao-d-sv">{selectedItems.reduce((s, i) => s + (Number(i.total || 0) * Number(i.tax_rate || 0) / 100), 0).toFixed(2)}</span></div>
            <div className="ao-d-stotal ao-d-grand"><span className="ao-d-sl">Grand Total</span><span className="ao-d-sv">{(selectedItems.reduce((s, i) => s + Number(i.total || 0), 0) + selectedItems.reduce((s, i) => s + (Number(i.total || 0) * Number(i.tax_rate || 0) / 100), 0)).toFixed(2)}</span></div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {showRejectModal && (
        <div className="ao-modal-overlay">
          <div className="ao-modal">
            <div className="ao-modal-title">Rejection Reason</div>
            <textarea
              className="ao-modal-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Type reason..."
              rows={4}
            />
            <div className="ao-modal-actions">
              <button
                className="ao-btn-approve"
                onClick={() => rejectStatus(selectedOrderId)}
              >
                Submit
              </button>
              <button
                className="ao-btn-cancel"
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

        /* PAGE */
        .ao-page {
          font-family: 'Inter', sans-serif;
        }

        /* TOOLBAR */
        .ao-toolbar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          margin-bottom: 16px;
        }

        .ao-count {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #6b7280;
          white-space: nowrap;
        }

        /* TABLE WRAP */
        .ao-table-wrap {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          overflow-x: auto;
          overflow-y: auto;
          max-height: calc(100vh - 58px - 4rem - 60px);
        }

        .ao-detail .ao-table-wrap {
          max-height: calc(100vh - 58px - 4rem - 200px);
        }

        .ao-table-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
        .ao-table-wrap::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 6px; }
        .ao-table-wrap::-webkit-scrollbar-thumb { background: #64748b; border-radius: 6px; }
        .ao-table-wrap::-webkit-scrollbar-thumb:hover { background: #475569; }

        /* TABLE */
        .ao-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .ao-table thead {
          background: #1e293b;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .ao-table th {
          color: #ffffff;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          white-space: nowrap;
        }

        .ao-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #374151;
        }

        .ao-table tbody tr:hover { background: #f8fafc; }
        .ao-table tbody tr:nth-child(even) { background: #fafafa; }
        .ao-table tbody tr:nth-child(even):hover { background: #f1f5f9; }

        /* ACTION CELL */
        .ao-action-cell {
          white-space: nowrap;
        }

        /* EMPTY */
        .ao-empty {
          text-align: center;
          color: #94a3b8;
          padding: 24px !important;
        }

        /* STATUS BADGE */
        .ao-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          background: #dbeafe;
          color: #1e40af;
        }

        /* BUTTONS */
        .ao-btn-view {
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
        .ao-btn-view:hover { background: #334155; }

        .ao-btn-approve {
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
        .ao-btn-approve:hover { background: #15803d; }

        .ao-btn-reject {
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
        }
        .ao-btn-reject:hover { background: #b91c1c; }

        .ao-btn-download {
          background: #16a34a;
          color: #ffffff;
          border: none;
          border-radius: 5px;
          padding: 5px 10px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ao-btn-download:hover { background: #15803d; }


        .ao-btn-cancel {
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
        .ao-btn-cancel:hover {
          background: #fef2f2;
          border-color: #f87171;
        }

        /* DETAIL VIEW */
        .ao-detail { display:flex; flex-direction:column; gap:10px; }
        .ao-d-top { display:flex; align-items:center; gap:10px; }
        .ao-d-back { background:none; color:#64748b; border:none; padding:0; font-size:13px; font-weight:500; font-family:'Inter',sans-serif; cursor:pointer; }
        .ao-d-back:hover { color:#1e293b; }
        .ao-d-ordnum { font-size:15px; font-weight:700; color:#1e293b; }
        .ao-d-spacer { flex:1; }
        .ao-d-export { background:#1e293b; color:#fff; border:none; border-radius:5px; padding:5px 14px; font-size:12px; font-weight:500; font-family:'Inter',sans-serif; cursor:pointer; }
        .ao-d-export:hover { background:#334155; }

        .ao-d-section-label { font-size:11px; font-weight:600; color:white; padding:3px; display:inline-block; text-align:left; background:#1e293b; border-radius:4px; width:fit-content; }
        .ao-d-info-strip { display:flex; background:#fff; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; }
        .ao-d-cell { flex:1; padding:10px 14px; border-right:1px solid #e2e8f0; display:flex; flex-direction:column; gap:2px; min-width:0; color:#1e293b; }
        .ao-d-cell:last-child { border-right:none; }
        .ao-d-cl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:#1e293b; }
        .ao-d-cv { font-size:12px; font-weight:600; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .ao-d-table-wrap { border-radius:6px; max-height:calc(100vh - 58px - 4rem - 240px); }

        .ao-d-summary { display:flex; gap:16px; justify-content:flex-end; }
        .ao-d-stotal { display:flex; align-items:center; gap:6px; font-size:13px; }
        .ao-d-sl { color:#64748b; font-weight:500; }
        .ao-d-sv { color:#1e293b; font-weight:600; }
        .ao-d-grand { background:#1e293b; padding:6px 14px; border-radius:5px; }
        .ao-d-grand .ao-d-sl { color:#94a3b8; }
        .ao-d-grand .ao-d-sv { color:#fff; font-size:15px; font-weight:700; }

        @media (max-width:768px) {
          .ao-d-info-strip { flex-wrap:wrap; }
          .ao-d-cell { flex:1 1 45%; border-bottom:1px solid #e2e8f0; }
          .ao-d-top { flex-wrap:wrap; }
          .ao-d-summary { flex-wrap:wrap; justify-content:flex-start; }
        }

        /* MODAL */
        .ao-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .ao-modal {
          background: #ffffff;
          border-radius: 10px;
          padding: 24px;
          width: 340px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }

        .ao-modal-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .ao-modal-textarea {
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
        .ao-modal-textarea:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
        }

        .ao-modal-actions {
          display: flex;
          gap: 8px;
        }

        @media (max-width:1024px) { .ao-d-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:768px) { .ao-d-grid { grid-template-columns:1fr; } .ao-d-topbar { flex-direction:column; gap:8px; align-items:flex-start; } }
      `}</style>
    </div>
  );
}
