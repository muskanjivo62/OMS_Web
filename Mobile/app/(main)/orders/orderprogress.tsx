import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { orderService } from "@/src/services/order.service";

interface OrderLog {
  id: number;
  status_name: string;
  remarks: string;
  performed_by_name: string | null;
  created_at: string;
}

const DONE_GREEN = "#2E7D32";
const PENDING_YELLOW = "#FF9800";
const DONE_CARD = "#E8F5E9";
const PENDING_CARD = "#FFF3E0";

export default function OrderProgressScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [orderId]);

  const fetchLogs = async () => {
    if (!orderId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      const response = await orderService.getOrderLogs(Number(orderId));
      setLogs(Array.isArray(response) ? response : []);
    } catch (error) {
      console.log("Error loading order logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleString("en-IN");
    } catch {
      return value;
    }
  };

  const renderItem = ({ item, index }: { item: OrderLog; index: number }) => {
    const isDone = Boolean(item.performed_by_name);
    const accent = isDone ? DONE_GREEN : PENDING_YELLOW;
    const cardColor = isDone ? DONE_CARD : PENDING_CARD;

    return (
      <View style={styles.timelineRow}>
        <View style={styles.leftColumn}>
          <View style={[styles.iconCircle, { backgroundColor: accent }]}>
            <Ionicons
              name={isDone ? "checkmark" : "time-outline"}
              size={15}
              color="#fff"
            />
          </View>
          {index !== logs.length - 1 ? (
            <View style={[styles.connector, { backgroundColor: accent }]} />
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={styles.statusText}>{item.status_name}</Text>
          {!!item.remarks && <Text style={styles.remarks}>{item.remarks}</Text>}
          <Text style={styles.meta}>
            {item.performed_by_name || ""} • {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PENDING_YELLOW} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.hero}>
        <Text style={styles.heroTitle}>Order Status Timeline</Text>
      </View> */}

      <View style={styles.content}>
        <Text style={styles.title}>Order Progress</Text>
        <Text style={styles.subtitle}>Track your order through all stages</Text>

        {logs.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              No progress found for this order.
            </Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F3F7",
  },
  hero: {
    height: 170,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
    backgroundColor: "#5B2BBF",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 36,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  leftColumn: {
    width: 44,
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: {
    width: 4,
    flex: 1,
    minHeight: 56,
    borderRadius: 2,
    marginTop: 6,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },
  remarks: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: "#222",
    fontWeight: "500",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
  },
});
