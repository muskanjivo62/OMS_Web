import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { orderService } from "@/src/services/order.service";
import { useLocalSearchParams } from "expo-router";

interface OrderLog {
  id: number;
  status_name: string;
  remarks: string;
  performed_by_name: string;
  created_at: string;
}

export default function OrderFlowScreen({ route }: any) {
  const { orderId } = useLocalSearchParams();

  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await orderService.getOrderLogs(Number(orderId));
      console.log(JSON.stringify(res));
      setLogs(res);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  const renderItem = ({ item, index }: any) => {
    const isRejected = item.status_name === "REJECTED";
    const isApproved = item.status_name === "APPROVED";

    return (
      <View style={styles.timelineRow}>
        {/* LEFT TIMELINE */}
        <View style={styles.timelineLeft}>
          <View
            style={[
              styles.circle,
              isRejected && styles.redCircle,
              isApproved && styles.greenCircle,
              !isRejected && !isApproved && styles.orangeCircle,
            ]}
          >
            <Ionicons
              name={
                isRejected ? "close" : isApproved ? "checkmark" : "time-outline"
              }
              size={16}
              color="#fff"
            />
          </View>

          {/* Vertical line */}
          {index !== logs.length - 1 && (
            <View
              style={[
                styles.verticalLine,
                isRejected && { backgroundColor: "#F44336" },
                isApproved && { backgroundColor: "#4CAF50" },
                !isRejected && !isApproved && { backgroundColor: "#FF9800" },
              ]}
            />
          )}
        </View>

        {/* RIGHT CARD */}
        <View
          style={[
            styles.card,
            isRejected && styles.redCard,
            isApproved && styles.greenCard,
            !isRejected && !isApproved && styles.orangeCard,
          ]}
        >
          <Text style={styles.statusTitle}>{item.status_name}</Text>

          {item.remarks ? (
            <Text style={styles.remarks}>{item.remarks}</Text>
          ) : null}

          <Text style={styles.meta}>
            {item.performed_by_name || "System"} •{" "}
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7B1FA2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      {/* <LinearGradient colors={["#7B1FA2", "#512DA8"]} style={styles.header}>
        <Text style={styles.headerTitle}>Order Status Timeline</Text>
      </LinearGradient> */}

      <View style={styles.content}>
        <Text style={styles.pageTitle}>Order Progress</Text>
        <Text style={styles.subtitle}>Track your order through all stages</Text>

        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greenCircle: { backgroundColor: "#4CAF50" },
  orangeCircle: { backgroundColor: "#FF9800" },
  redCircle: { backgroundColor: "#F44336" },

  greenCard: { backgroundColor: "#E8F5E9" },
  orangeCard: { backgroundColor: "#FFF3E0" },
  redCard: { backgroundColor: "#FFEBEE" },

  container: { flex: 1, backgroundColor: "#F4F5F7" },

  remarks: {
    fontSize: 13,
    color: "#333",
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 6,
  },

  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginRight: 6,
  },

  metaValue: {
    fontSize: 12,
    color: "#444",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  content: {
    padding: 16,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },

  subtitle: {
    color: "#777",
    marginBottom: 20,
  },

  timelineRow: {
    flexDirection: "row",
    marginBottom: 30,
  },

  timelineLeft: {
    width: 40,
    alignItems: "center",
  },

  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  greenCircle: {
    backgroundColor: "#4CAF50",
  },

  orangeCircle: {
    backgroundColor: "#FF9800",
  },

  verticalLine: {
    width: 3,
    flex: 1,
    marginTop: 4,
    borderRadius: 2,
  },

  card: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
  },

  greenCard: {
    backgroundColor: "#E8F5E9",
  },

  orangeCard: {
    backgroundColor: "#FFF3E0",
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  label: {
    fontSize: 13,
    color: "#555",
    marginTop: 6,
  },

  value: {
    fontSize: 14,
    fontWeight: "500",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
