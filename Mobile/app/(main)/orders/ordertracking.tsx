import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { OrderItemList, orderService } from "@/src/services/order.service";
import { COLORS } from "@/constants/theme";
import { useRouter } from "expo-router";
import Dropdown from "@/src/components/common/DropdownProps";

export default function OrderTrackingScreen() {
  const [orders, setOrders] = useState<OrderItemList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderbyuserid();

      console.log("datavalue" + JSON.stringify(data));
      setOrders(data);
    } catch (error) {
      console.log("Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusName = (item: any) => String(item?.status_name || "").trim();

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-GB");
  };

  const getCategoryText = (item: OrderItemList) => {
    const categories = item.categories || [];
    if (categories.length === 0) return "-";
    if (categories.length <= 2) return categories.join(", ");
    return `${categories.slice(0, 2).join(", ")} +${categories.length - 2}`;
  };

  const statusOptions = [
    ...new Set(
      orders
        .map((item: any) => getStatusName(item))
        .filter(Boolean),
    ),
  ]
    .sort()
    .map((status) => ({ label: status, value: status }));

  const filteredOrders = orders.filter((item: any) => {
    if (!selectedStatus) return true;
    return getStatusName(item) === selectedStatus;
  });

  const renderOrder = ({ item }: { item: OrderItemList }) => (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      // onPress={() =>
      //   // router.push({
      //   //   pathname: "/orders/orderflow",
      //   //   params: { orderId: item.id },
      //   // })
      // }
    >
      {/* Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberWrap}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <Text style={styles.createdText}>
            Created: {formatDate(item.created_at)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{(item as any).status_name}</Text>
        </View>
      </View>

      {/* Party Info */}
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
          <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
          <Text style={styles.metaText}>PO: {item.po_number || "-"}</Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amountValue}>₹{item.total_amount}</Text>
      </View>
      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.detailsBtn]}
          onPress={() => {
            router.push({
              pathname: "/orders/orderdetails",
              params: { orderId: item.id, from: "orders/ordertracking" },
            });
          }}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.progressBtn]}
          onPress={() => {
            router.push({
              pathname: "/orders/orderprogress",
              params: { orderId: item.id },
            });
          }}
        >
          <Ionicons name="git-branch-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>View Progress</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {selectedStatus
          ? `No orders found for ${selectedStatus}`
          : "No orders found"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterWrap}>
        <Dropdown
          label="Filter by Status"
          data={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
          placeholder="All statuses"
          searchable={false}
        />
      </View>

      {/* Orders Count */}
      {!loading && filteredOrders.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {filteredOrders.length} order{filteredOrders.length > 1 ? "s" : ""}{" "}
            found
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
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },

  detailsBtn: {
    backgroundColor: COLORS.primary,
  },

  progressBtn: {
    backgroundColor: "#4CAF50",
  },

  actionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  countBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterWrap: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingTop: 8,
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

});
