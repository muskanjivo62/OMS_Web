import React, { useEffect, useState } from "react";
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
  orderService,
  productService,
} from "@/src/services/order.service";
import { COLORS } from "@/constants/theme";
import { router } from "@/.expo/types/router";
import { useRouter } from "expo-router";

export default function OrderTrackingScreen() {
  const [orders, setOrders] = useState<OrderItemList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        <Text style={styles.orderNumber}>{item.order_number}</Text>
      </View>

      {/* Party Info */}
      <Text style={styles.cardName}>{item.card_name}</Text>
      <Text style={styles.cardCode}>{item.card_code}</Text>

      {/* Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="cube-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>{item.items_count} items</Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={COLORS.textLight}
          />
          <Text style={styles.detailText}>{item.created_at}</Text>
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
              params: { orderId: item.id },
            });
          }}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.progressBtn]}
          // onPress={() => {
          //   router.push({
          //     pathname: "/orders/orderprogress",
          //     params: { orderId: item.id },
          //   });
          // }}
        >
          <Ionicons name="git-branch-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>View Progress</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>"No pending orders"</Text>
    </View>
  );

  return (
    <View style={styles.container}>
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
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  activeTabText: {
    color: "#fff",
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
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
    color: COLORS.textLight,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  dropdownText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  redCircle: {
    backgroundColor: "#F44336",
  },

  redCard: {
    backgroundColor: "#FFEBEE",
  },
});
