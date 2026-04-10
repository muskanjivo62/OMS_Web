import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ApproveOr,
  OrderItemList,
  productService,
} from "@/src/services/order.service";
import { COLORS } from "@/constants/theme";
import { router } from "expo-router";
import Dropdown from "@/src/components/common/DropdownProps";
import { useAuth } from "@/src/context/AuthContext";

type OrderListTab = "pending" | "others";

const OTHER_STATUS_OPTIONS = [
  { label: "Approved", value: "6" },
  { label: "Rejected", value: "7" },
];

const PENDING_STATUS_CODES = new Set([
  "BILLING",
  "BILLING_PENDING",
]);

export default function BillingOrderList() {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || "";

  const [pendingActionType, setPendingActionType] = useState<
    "NEED_APPROVAL" | "BILLING_PENDING" | null
  >(null);

  const [orders, setOrders] = useState<OrderItemList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderListTab>("pending");
  const [selectedOtherStatus, setSelectedOtherStatus] = useState<string>("6");
  const [actionLoading, setActionLoading] = useState<{
    id: number;
    type: "approve" | "reject";
  } | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState<number | null>(
    null,
  );

  // Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [pendingReason, setPendingReason] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const statusFilter = activeTab === "pending" ? undefined : selectedOtherStatus;
      const data = await productService.getOrders(0, statusFilter);

      const normalized = Array.isArray(data) ? data : [];
      const filtered =
        activeTab === "pending"
          ? normalized.filter((order) =>
              PENDING_STATUS_CODES.has(String(order.status || "").toUpperCase()),
            )
          : normalized;

      console.log("datavalue" + JSON.stringify(filtered));
      setOrders(filtered);
    } catch (error) {
      console.log("Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedOtherStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openPendingModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setPendingReason("");
    setPendingModalVisible(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-GB");
  };

  const getCategoryText = (item: OrderItemList) => {
    const fromCategories = item.categories || [];
    const categories =
      fromCategories.length > 0
        ? fromCategories
        : Array.from(
            new Set(
              (item.items || [])
                .map((it: any) => String(it?.category || "").trim())
                .filter(Boolean),
            ),
          );

    if (categories.length === 0) return "-";
    if (categories.length <= 2) return categories.join(", ");
    return `${categories.slice(0, 2).join(", ")} +${categories.length - 2}`;
  };

  const handleApprove = (order: OrderItemList) => {
    console.log("Approve order:", order.id);
    Alert.alert("Approve Order", `Approve order ${order.order_number}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          try {
            setActionLoading({ id: order.id, type: "approve" });

            const approvalItems = (Array.isArray(order.items) ? order.items : []).flatMap(
              (item: any) => {
                const schemeQty = Number(item?.qty_scheme) || 0;
                const derivedSchemeVisible =
                  Boolean(item?.is_scheme_visible) ||
                  (Boolean(item?.scheme_id ?? item?.scheme) && schemeQty > 0);
                const baseItem = {
                  ...item,
                  is_scheme_visible: derivedSchemeVisible,
                };
                const hasSchemeLine =
                  derivedSchemeVisible &&
                  Boolean(item?.scheme_item_code) &&
                  schemeQty > 0;

                if (!hasSchemeLine) {
                  return [baseItem];
                }

                return [
                  baseItem,
                  {
                    id: `${item.id ?? item.item_code}-scheme`,
                    item_code: String(item.scheme_item_code),
                    item_name: item.scheme_name || String(item.scheme_item_code),
                    category: item.category || "",
                    brand: item.brand || "",
                    variety: item.variety || "",
                    item_type: "SCHEME",
                    qty: String(item.qty_scheme ?? 0),
                    pcs: String(item.qty_scheme ?? 0),
                    boxes: String(item.qty_scheme ?? 0),
                    ltrs: String(item.qty_scheme ?? 0),
                    basic_price: "0.00",
                    market_price: "0.00",
                    total: "0.00",
                    tax_rate: "0.00",
                    is_scheme_visible: true,
                    is_scheme_line: true,
                    parent_item_code: String(item.item_code || ""),
                    order: order.id,
                    scheme_id: item.scheme_id ?? item.scheme ?? null,
                    scheme_name: item.scheme_name || null,
                    scheme: item.scheme_id ?? item.scheme ?? null,
                  },
                ];
              },
            );

            const payload: ApproveOr = {
              order_id: order.id,
              card_code: order.card_code,
              created_at: order.created_at,
              po_number: order.order_number,
              ship_to_address: order.ship_to_address,
              bill_to_address: order.bill_to_address,
              dispatch_from_id: order.dispatch_from_id,
              items: approvalItems,
            };
            
            console.log("printvalue"+JSON.stringify(payload));  
            const res = await productService.sapApproveOrder(payload);
            console.log("Approval response:", JSON.stringify(res));
            console.log("Approval response:", JSON.stringify(res));
              
            if (!res?.success) {
              let errorMessage = "Approval failed";
              try {
                const sapError = JSON.parse(res?.data?.error || "{}");
                errorMessage =
                  sapError?.error?.message ||
                  res?.message ||
                  res?.data?.error ||
                  "Approval failed";
              } catch {
                errorMessage = res?.message || res?.data?.error || "Approval failed";
              }
              throw new Error(errorMessage);
            }

            Alert.alert("Success", "Order approved");

            loadOrders();
          } catch (err) {
            console.log(err);

            if (err instanceof Error) {
              Alert.alert("Error", err.message);
            } else {
              Alert.alert("Error", "Approval failed");
            }
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const openRejectModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Error", "Please enter rejection reason");
      return;
    }

    try {
      setActionLoading({ id: selectedOrderId!, type: "reject" });
      await productService.updatestatus(selectedOrderId!, "7", rejectReason);
      setRejectModalVisible(false);
      Alert.alert("Success", "Order rejected");
      loadOrders();
    } catch (error) {
      console.log("Error rejecting:", error);
      Alert.alert("Error", "Failed to reject order");
    } finally {
      setActionLoading(null);
    }
  };

  const renderOrder = ({ item }: { item: OrderItemList }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/orders/orderdetails",
          params: { orderId: item.id, from: "orders/orderlist" },
        })
      }
      style={styles.orderCard}
      activeOpacity={0.85}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberWrap}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <Text style={styles.createdText}>
            Created: {formatDate(item.created_at)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {(item as any).status_display || item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.cardName}>{item.card_name}</Text>
      <Text style={styles.cardCode}>{item.card_code}</Text>

      <View style={styles.metaWrap}>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.metaText}>
            Delivery: {formatDate(item.delivery_date)}
          </Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="cube-outline" size={14} color={COLORS.primary} />
          <Text style={styles.metaText}>{item.items_count || 0} items</Text>
        </View>
      </View>

      <View style={styles.metaWrap}>
        <View style={styles.metaChip}>
          <Ionicons name="pricetags-outline" size={14} color={COLORS.primary} />
          <Text style={styles.metaText}>Category: {getCategoryText(item)}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons
            name="document-text-outline"
            size={14}
            color={COLORS.primary}
          />
          <Text style={styles.metaText}>PO: {item.po_number || "-"}</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amountValue}>₹{item.total_amount}</Text>
      </View>

      {activeTab === "pending" && (
        <>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => openRejectModal(item.id)}
              disabled={actionLoading !== null}
            >
              {actionLoading?.id === item.id && actionLoading.type === "reject" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item)}
              disabled={actionLoading !== null}
            >
              {actionLoading?.id === item.id && actionLoading.type === "approve" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.moreBtn]}
              onPress={() =>
                setActionMenuVisible(actionMenuVisible === item.id ? null : item.id)
              }
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>More</Text>
            </TouchableOpacity>
          </View>
          <View>
            {actionMenuVisible === item.id && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setActionMenuVisible(null);
                    setPendingActionType("NEED_APPROVAL");
                    openPendingModal(item.id);
                  }}>
                  <Text style={styles.dropdownText}>Need Approval</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setActionMenuVisible(null);
                    setPendingActionType("BILLING_PENDING");
                    openPendingModal(item.id);
                  }}
                >
                  <Text style={styles.dropdownText}>Billing Pending</Text>
                </TouchableOpacity>

                <View style={styles.dropdownDivider} />

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setActionMenuVisible(null);
                    router.push({
                      pathname: "/orders/orderdetails",
                      params: { orderId: item.id, from: "orders/orderlist" },
                    });
                  }}
                >
                  <Text style={styles.dropdownText}>Order Details</Text>
                </TouchableOpacity>

                {userRole === "billing" && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setActionMenuVisible(null);
                      router.push({
                        pathname: "/orders/create",
                        params: { orderId: item.id, mode: "edit" },
                      });
                    }}
                  >
                    <Text style={styles.dropdownText}>Edit Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </>
      )}

      {activeTab === "others" && (
        <>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.moreBtn]}
              onPress={() =>
                setActionMenuVisible(actionMenuVisible === item.id ? null : item.id)
              }
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>More</Text>
            </TouchableOpacity>
          </View>
          <View>
            {actionMenuVisible === item.id && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setActionMenuVisible(null);
                    router.push({
                      pathname: "/orders/orderdetails",
                      params: { orderId: item.id, from: "orders/orderlist" },
                    });
                  }}
                >
                  <Text style={styles.dropdownText}>Order Details</Text>
                </TouchableOpacity>

                {userRole === "billing" && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setActionMenuVisible(null);
                      router.push({
                        pathname: "/orders/create",
                        params: { orderId: item.id, mode: "edit" },
                      });
                    }}
                  >
                    <Text style={styles.dropdownText}>Edit Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === "pending" ? "checkmark-done-circle-outline" : "filter-outline"}
        size={64}
        color={COLORS.textLight}
      />
      <Text style={styles.emptyText}>
        {activeTab === "pending"
          ? "No pending orders"
          : `No ${OTHER_STATUS_OPTIONS.find((s) => s.value === selectedOtherStatus)?.label || "orders"}`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activePendingTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}
          >
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "others" && styles.activeOthersTab]}
          onPress={() => setActiveTab("others")}
        >
          <Text
            style={[styles.tabText, activeTab === "others" && styles.activeTabText]}
          >
            Others
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "others" && (
        <View style={styles.filterWrap}>
          <Dropdown
            label="Status"
            data={OTHER_STATUS_OPTIONS}
            value={selectedOtherStatus}
            onChange={setSelectedOtherStatus}
            placeholder="Select status"
            searchable={false}
          />
        </View>
      )}

      {/* Orders Count */}
      {!loading && orders.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {orders.length} order{orders.length > 1 ? "s" : ""} found
          </Text>
        </View>
      )}

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Order</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejection:
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmRejectBtn]}
                onPress={() => handleReject()}
                disabled={actionLoading !== null}
              >
                {actionLoading?.type === "reject" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmRejectText}>Reject Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pending Modal */}
      <Modal
        visible={pendingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPendingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ color: "#000", fontWeight: "600" }}>
              {pendingActionType?.toUpperCase() === "NEED_APPROVAL"
                ? "Mark as Need Approval"
                : "Mark as Billing Pending"}
            </Text>

            <Text style={styles.modalSubtitle}>
              Please provide pending reason:
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason..."
              value={pendingReason}
              onChangeText={setPendingReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setPendingModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.pendingBtn]}
                onPress={handleReject}
                disabled={actionLoading !== null}
              >
                {actionLoading?.type === "reject" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Mark Pending
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    alignItems: "center",
  },
  activePendingTab: {
    backgroundColor: COLORS.warning,
  },
  activeOthersTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: "#fff",
  },
  filterWrap: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  countBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  countText: {
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderNumberWrap: {
    flex: 1,
    paddingRight: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  createdText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  statusText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: "700",
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  cardCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  metaWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },

  approveBtn: {
    backgroundColor: COLORS.success,
  },

  pendingBtn: {
    backgroundColor: COLORS.pending,
  },

  needapproveBtn: {
    backgroundColor: COLORS.warning,
  },

  rejectBtn: {
    backgroundColor: COLORS.error,
  },

  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
  },

  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 16,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelBtn: {
    backgroundColor: COLORS.background,
  },

  cancelBtnText: {
    color: COLORS.text,
    fontWeight: "600",
  },

  confirmRejectBtn: {
    backgroundColor: COLORS.error,
  },

  confirmRejectText: {
    color: "#fff",
    fontWeight: "600",
  },
  moreBtn: {
    backgroundColor: "#607D8B",
  },

  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
  },

  dropdownText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
});
