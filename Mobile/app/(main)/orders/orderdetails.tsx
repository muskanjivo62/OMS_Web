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
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      console.log("Fetching details for order ID:", orderId);
      const res = await orderService.getorderdetailsbyid(Number(orderId));
      setOrder(res);
    } catch {
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

  const InfoRow = ({ label, value }: any) => {
    if (!value) return null;

    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoColon}>:</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* ===== Header ===== */}
      <LinearGradient
        colors={[COLORS.primary, "#2a1eabff"]}
        style={styles.header}
      >
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
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <InfoRow label="Item Name" value={item.item_name} />
                <InfoRow label="Item Code" value={item.item_code} />
                <InfoRow label="Qty" value={item.qty} />
                <InfoRow label="Box" value={item.boxes} />
                <InfoRow label="Ltrs" value={item.ltrs} />

                {/* <Text style={styles.itemQty}>
                  Qty {item.qty} | Box {item.boxes} | Ltrs {item.ltrs}
                </Text> */}
              </View>

              <View style={styles.priceWrap}>
                <Text style={styles.price}>₹{item.market_price}</Text>
                <Text style={styles.lineTotal}>₹{item.total}</Text>
              </View>
            </View>
          )}
        />
      </View>

      {/* ===== Total ===== */}
      <LinearGradient
        colors={[COLORS.primary, "#2a1eabff"]}
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

const InfoRow = ({ label, value }: any) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
});
