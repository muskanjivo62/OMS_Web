import { useEffect, useMemo, useState } from "react";
import { ordersService } from "../services/ordersService";
import type { Order, OrderLog } from "../services/ordersService";
import { loadCurrentUserOrders } from "../utils/orderHistory";
import "../styles/Order_Tracking.css";

export default function Order_Tracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [tracker, setTracker] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "rejected">("all");
  
  useEffect(() => {
    void fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await loadCurrentUserOrders();
      setOrders(data || []);
    } catch (error) {
      console.log("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (activeTab === "rejected") {
          return String(order.status_display || "").toLowerCase().includes("reject");
        }
        return true;
      })
      .sort((a, b) => {
        const first = new Date(b.created_at || "").getTime();
        const second = new Date(a.created_at || "").getTime();

        if (Number.isNaN(first) || Number.isNaN(second)) {
          return String(b.order_number || "").localeCompare(
            String(a.order_number || "")
          );
        }

        return first - second;
      });
  }, [orders, activeTab]);

  const orderedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const first = new Date(a.created_at || "").getTime();
      const second = new Date(b.created_at || "").getTime();

      if (Number.isNaN(first) && Number.isNaN(second)) {
        return a.id - b.id;
      }

      if (Number.isNaN(first)) return 1;
      if (Number.isNaN(second)) return -1;

      return first - second;
    });
  }, [logs]);

  const latestStageLogs = useMemo(() => {
    const stageLogs = new Map<string, OrderLog>();
    let lastStageKey: string | null = null;

    const getStageKey = (statusName: string) => {
      const normalizedStatus = String(statusName || "").toLowerCase().trim();

      if (!normalizedStatus) return "unknown";

      const isGenericOutcome =
        normalizedStatus === "approved" ||
        normalizedStatus === "rejected" ||
        normalizedStatus === "accepted" ||
        normalizedStatus === "cancelled" ||
        normalizedStatus === "canceled" ||
        normalizedStatus === "completed" ||
        normalizedStatus === "complete";

      if (isGenericOutcome && lastStageKey) {
        return lastStageKey;
      }

      if (normalizedStatus.includes("auditor")) {
        return "auditor";
      }

      if (normalizedStatus.includes("billing")) {
        return "billing";
      }

      if (normalizedStatus.includes("approval") || normalizedStatus.includes("approve")) {
        return "approval";
      }

      if (
        normalizedStatus.includes("reject") ||
        normalizedStatus.includes("cancel")
      ) {
        return "outcome";
      }

      if (
        normalizedStatus.includes("complete") ||
        normalizedStatus.includes("dispatch")
      ) {
        return "fulfillment";
      }

      return normalizedStatus;
    };

    orderedLogs.forEach((log) => {
      const stageKey = getStageKey(log.status_name);
      const normalizedStatus = String(log.status_name || "").toLowerCase().trim();

      if (
        normalizedStatus !== "approved" &&
        normalizedStatus !== "rejected" &&
        normalizedStatus !== "accepted" &&
        normalizedStatus !== "cancelled" &&
        normalizedStatus !== "canceled" &&
        normalizedStatus !== "completed" &&
        normalizedStatus !== "complete"
      ) {
        lastStageKey = stageKey;
      }

      stageLogs.set(stageKey, log);
    });

    return Array.from(stageLogs.values()).sort((a, b) => {
      const first = new Date(a.created_at || "").getTime();
      const second = new Date(b.created_at || "").getTime();

      if (Number.isNaN(first) && Number.isNaN(second)) {
        return a.id - b.id;
      }

      if (Number.isNaN(first)) return 1;
      if (Number.isNaN(second)) return -1;

      return first - second;
    });
  }, [orderedLogs]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("en-IN");
  };

  const getLogTone = (status: string, performedBy: string | null) => {
    const normalized = String(status || "").toLowerCase();
    const normalizedPerformer = String(performedBy || "").toLowerCase();

    const isPendingPerformer =
      !normalizedPerformer ||
      normalizedPerformer.includes("pending") ||
      normalizedPerformer.includes("system");

    if (normalized.includes("reject") || normalized.includes("cancel")) {
      return "rejected";
    }

    if (isPendingPerformer) {
      return "pending";
    }

    if (
      normalized.includes("approve") ||
      normalized.includes("accept") ||
      normalized.includes("bill") ||
      normalized.includes("complete")
    ) {
      return "approved";
    }

    return "progress";
  };

  const handleTrack = async (order: Order) => {
    setSelectedOrder(order);
    setTracker(true);
    setLogs([]);
    setLogsLoading(true);

    try {
      const response = await ordersService.getOrderLogs(order.id);
      setLogs(Array.isArray(response) ? response : []);
    } catch (error) {
      console.log("Error fetching order logs:", error);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleBack = () => {
    setTracker(false);
    setSelectedOrder(null);
    setLogs([]);
  };

  return (
    <div className="tracker-page">
      <div className="tracker-head">
        <h4>Order Tracker</h4>
      </div>

      {!tracker && (
        <div style={{ display: 'flex', gap: '10px', padding: '0 20px', marginBottom: '15px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: activeTab === 'all' ? '#1E3A5F' : '#fff', color: activeTab === 'all' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 600 }}
          >
            All Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: activeTab === 'rejected' ? '#EF4444' : '#fff', color: activeTab === 'rejected' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 600 }}
          >
            Rejected Orders
          </button>
        </div>
      )}

      {!tracker && (
        <div>
          <div className="tracker-list-head">
            <h5>Select the order you want to track</h5>
            {!loading && (
              <span className="tracker-count">Total: {filteredOrders.length}</span>
            )}
          </div>

          <div className="tracker-table-wrap">
            <table className="vo-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Card Code</th>
                  <th>Card Name</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Tracker</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="vo-empty">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.card_code}</td>
                      <td>{order.card_name}</td>
                      <td>{order.delivery_date}</td>
                      <td>
                        <span
                          className={`vo-badge vo-badge-${(
                            order.status_display || ""
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {order.status_display}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="tracker-btn"
                          onClick={() => void handleTrack(order)}
                        >
                          Track
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="vo-empty">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tracker && selectedOrder && (
        <div className="tracker-detail-card">
          <div className="tracker-detail-top">
            <button
              type="button"
              className="tracker-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
            <span
              className={`vo-badge vo-badge-${(
                selectedOrder.status_display || ""
              )
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {selectedOrder.status_display}
            </span>
          </div>

          <div className="tracker-summary-grid">
            <div>
              <p className="tracker-label">Order ID</p>
              <h5>{selectedOrder.order_number}</h5>
            </div>
            <div>
              <p className="tracker-label">Card Code</p>
              <p>{selectedOrder.card_code}</p>
            </div>
            <div>
              <p className="tracker-label">Card Name</p>
              <p>{selectedOrder.card_name}</p>
            </div>
            <div>
              <p className="tracker-label">Delivery Date</p>
              <p>{selectedOrder.delivery_date || "-"}</p>
            </div>
          </div>

          <div className="tracker-timeline">
            <h5>Order Log Timeline</h5>

            {logsLoading ? (
              <p className="vo-empty">Loading order logs...</p>
            ) : latestStageLogs.length === 0 ? (
              <p className="vo-empty">No tracking logs found for this order.</p>
            ) : (
              latestStageLogs.map((log, index) => {
                const tone = getLogTone(log.status_name, log.performed_by_name);

                return (
                  <div key={log.id} className="tracker-timeline-row">
                    <div className="tracker-timeline-left">
                      <div className={`tracker-dot ${tone}`}>
                        {tone === "approved"
                          ? "✓"
                          : tone === "rejected"
                            ? "✕"
                            : "•"}
                      </div>
                      {index !== latestStageLogs.length - 1 ? (
                        <div className={`tracker-line ${tone}`} />
                      ) : null}
                    </div>

                    <div className={`tracker-log-card ${tone}`}>
                      <div className="tracker-log-head">
                        <h6>{log.status_name}</h6>
                        <span>{formatDateTime(log.created_at)}</span>
                      </div>

                      <p className="tracker-log-meta">
                        Performed By: {log.performed_by_name || "Pending"}
                      </p>

                      {log.remarks ? (
                        <p className="tracker-log-remarks">Remark: {log.remarks}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
