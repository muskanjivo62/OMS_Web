import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import { Text, Surface } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import { COLORS, SPACING, RADIUS } from "@/src/constants/theme";
import { MonthlySalesEntry } from "@/src/types/dashboard";

interface Props {
  data: MonthlySalesEntry[];
}

export default function SalesLineChart({ data }: Props) {
  const screenWidth = Dimensions.get("window").width - SPACING.lg * 2;

  if (!data || !data.length) {
    return (
      <Surface style={styles.card}>
        <Text style={styles.title}>Monthly Revenue Trend</Text>
        <Text style={styles.noData}>No sales data available</Text>
      </Surface>
    );
  }

  const labels = data.map((d) => d.label.split(" ")[0]);
  const values = data.map((d) => d.revenue);

  return (
    <Surface style={styles.card}>
      <Text style={styles.title}>Monthly Revenue Trend</Text>
      <LineChart
        data={{
          labels,
          datasets: [{ data: values }],
        }}
        width={screenWidth - SPACING.md * 2}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        formatYLabel={(val) => {
          const num = Number(val);
          if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
          if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
          return `₹${num}`;
        }}
        chartConfig={{
          backgroundColor: COLORS.surface,
          backgroundGradientFrom: COLORS.surface,
          backgroundGradientTo: COLORS.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
          labelColor: () => COLORS.textSecondary,
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: COLORS.primary,
          },
          propsForLabels: {
            fontSize: 12,
          },
        }}
        bezier
        style={styles.chart}
        verticalLabelRotation={30}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chart: {
    borderRadius: RADIUS.md,
    marginLeft: -16,
  },
  noData: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: SPACING.xl,
  },
});
