import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/theme";
import { orderService } from "@/src/services/order.service";

export default function OrderDetailsScreen() {
  
  const { orderId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const parsedOrderId = Number(Array.isArray(orderId) ? orderId[0] : orderId);
    if (!parsedOrderId) {
      setOrder(null);
      setLoading(false);
      return;
    }
    fetchOrder(parsedOrderId);
  }, [orderId]);

  const fetchOrder = async (id: number) => {
    try {
      setLoading(true);
      setOrder(null);
     
      const res = await orderService.getorderdetailsbyid(id);
      console.log("Fetching details for order ID:", JSON.stringify(res));
      setOrder(res);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loader}>
        <Text>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* ===== Header ===== */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <Text style={styles.orderNo}>{order.order_number}</Text>
        <Text style={styles.party}>{order.card_name}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{order.status_display}</Text>
        </View>
      </LinearGradient>

      {/* ===== Order Info ===== */}
      <View style={styles.card}>
        <SectionTitle icon="information-circle-outline" title="Order Info" />

        <InfoRow label="Delivery Date" value={order.delivery_date} />
        <InfoRow label="PO Number" value={order.po_number} />
        <InfoRow label="Bill To" value={order.bill_to_address} />
        <InfoRow label="Ship To" value={order.ship_to_address} />
      </View>

      {/* ===== Items ===== */}
      <View style={styles.card}>
        <SectionTitle
          icon="cube-outline"
          title={`Items (${order.items_count})`}
        />

        <FlatList
          data={order.items}
          keyExtractor={(i) => i.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const bp = parseFloat(item.basic_price) || 0;
            const mp = parseFloat(item.market_price) || 0;
            const isFlagged = mp > 0 && mp < bp;

            return (
            <View style={[styles.itemRow, isFlagged && styles.flaggedItem]}>

              <View style={{ flex: 1 }}>

                <InfoRow label="Item Name" value={item.item_name} />
                <InfoRow label="Item Code" value={item.item_code} />
                <InfoRow label="Basic Price" value={`₹${item.basic_price}`} />
                <InfoRow label="Market Price" value={`₹${item.market_price}`} highlight={isFlagged} />
                <InfoRow label="Qty" value={item.qty} />
                <InfoRow label="Box" value={item.boxes} />
                <InfoRow label="Ltrs" value={item.ltrs} />
                <InfoRow label="Total" value={`₹${item.total}`} />
                {!!item.scheme_name && (
                  <View style={styles.schemeBadge}>
                    <Ionicons name="pricetag-outline" size={13} color="#7C3AED" />
                    <Text style={styles.schemeBadgeText}>
                      {item.scheme_name}
                      {item.qty_scheme > 0 ? `  ·  Qty: ${item.qty_scheme}` : ""}
                    </Text>
                  </View>
                )}

              </View>

              {/* <View style={styles.priceWrap}>
                <Text style={styles.price}>₹{item.market_price}</Text>
                <Text style={styles.lineTotal}>₹{item.total}</Text>
              </View> */}

            </View>
          );
          }}
        />
      </View>

      {/* ===== Total ===== */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalCard}
      >
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>₹{order.total_amount}</Text>
      </LinearGradient>
    </ScrollView>
  );
}

/* ---------------- Components ---------------- */

const SectionTitle = ({ icon, title }: any) => (
  <View style={styles.sectionTitleRow}>
    <Ionicons name={icon} size={18} color={COLORS.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const InfoRow = ({ label, value, highlight }: any) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && { color: COLORS.error, fontWeight: "800" }]}>{value}</Text>
    </View>
  ) : null;

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  infoLabel: {
    width: 110, // keeps alignment clean
    fontSize: 13,
    color: COLORS.black,
  },

  infoColon: {
    marginHorizontal: 4,
    color: COLORS.textLight,
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  container: { flex: 1, backgroundColor: "#F4F6FA" },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    padding: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  orderNo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  party: {
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },

  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },

  badgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 6,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  flaggedItem: {
    backgroundColor: "#FFF3F3",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    paddingLeft: 10,
    borderRadius: 6,
  },

  itemName: { fontWeight: "700", fontSize: 14 },

  itemCode: { fontSize: 12, color: COLORS.textLight },

  itemQty: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

  priceWrap: { alignItems: "flex-end" },

  price: { fontWeight: "700", fontSize: 14 },

  lineTotal: { fontSize: 12, color: COLORS.textLight },

  totalCard: {
    margin: 16,
    borderRadius: 20,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: { color: "#fff", fontSize: 14 },

  totalValue: { color: "#fff", fontSize: 22, fontWeight: "800" },

  schemeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  schemeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
  },
});
