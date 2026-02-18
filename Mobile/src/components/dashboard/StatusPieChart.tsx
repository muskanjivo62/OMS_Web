import React from "react";
import { StyleSheet } from "react-native";
import { Text, Surface } from "react-native-paper";
import { COLORS, SPACING, RADIUS } from "@/src/constants/theme";
import { StatusDistEntry } from "@/src/types/dashboard";
import DonutChart from "./DonutChart";

const STATUS_COLORS: Record<string, string> = {
  submitted: "#2563EB",
  pending_approval: "#F59E0B",
  approved: "#22C55E",
  rejected: "#DC2626",
  sap_created: "#6366F1",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  pending_approval: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  sap_created: "SAP Created",
};

interface Props {
  data: StatusDistEntry[];
}

export default function StatusPieChart({ data }: Props) {
  const filtered = data.filter((d) => d.status !== "sap_created");
  const total = filtered.reduce((sum, d) => sum + d.count, 0);

  const chartData = filtered.map((entry) => ({
    label: STATUS_LABELS[entry.status] || entry.status,
    value: entry.count,
    color: STATUS_COLORS[entry.status] || "#94A3B8",
  }));

  return (
    <Surface style={styles.card}>
      <Text style={styles.title}>Order Status</Text>
      <DonutChart
        data={chartData}
        size={110}
        strokeWidth={14}
        centerValue={String(total)}
        centerLabel="Total"
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
});
