import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import { useAuth } from "@/src/context/AuthContext";
import { COLORS, SPACING, RADIUS, SHADOWS } from "@/src/constants/theme";
import { api } from "@/src/services/api";
import { storage } from "@/src/utils/storage";
import { DashboardChartsData } from "@/src/types/dashboard";
import MonthPicker from "@/src/components/dashboard/MonthPicker";
import SalesLineChart from "@/src/components/dashboard/SalesLineChart";
import TopPartiesChart from "@/src/components/dashboard/TopPartiesChart";
import StatusPieChart from "@/src/components/dashboard/StatusPieChart";
import CategorySalesChart from "@/src/components/dashboard/CategorySalesChart";
import StatewiseBarChart from "@/src/components/dashboard/StateWiseBarChart";
import AnimatedCard from "@/src/components/dashboard/AnimatedCard";
import AnimatedNumber from "@/src/components/dashboard/AnimatedNumber";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 2023 }, (_, i) => ({
  label: String(2024 + i),
  value: 2024 + i,
}));

interface DashboardData {
  total_orders: number;
  total_revenue: string;
  today_orders: number;
  this_month_orders: number;
  status_counts: {
    submitted: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    sap_created: number;
  };
}


export default function DashboardScreen() {
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<DashboardChartsData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [lineYear, setLineYear] = useState(new Date().getFullYear());
  const [donutYear, setDonutYear] = useState(new Date().getFullYear());
  const [donutMonth, setDonutMonth] = useState(0);

  useEffect(() => {
    fetchDashboard();
    fetchChartData(lineYear, donutYear, donutMonth);
  }, []);

  useEffect(() => {
    fetchChartData(lineYear, donutYear, donutMonth);
  }, [lineYear, donutYear, donutMonth]);

  const fetchDashboard = async () => {
    try {
      const token = await storage.getAccessToken();
      const result = await api.get("/orders/dashboard/", token || undefined);
      const payload = result?.data ?? result;
      if (payload && !payload.error && payload.total_orders !== undefined) {
        setData(payload);
      }
    } catch (error) {
      console.log("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (ly: number, dy: number, dm: number) => {
    setChartLoading(true);
    try {
      const token = await storage.getAccessToken();
      const result = await api.get(
        `/orders/dashboard/charts/?line_year=${ly}&year=${dy}&month=${dm}`,
        token || undefined,
      );
      const payload = result?.data ?? result;
      if (payload && !payload.error && payload.monthly_sales) {
        setChartData(payload);
      }
    } catch (error) {
      console.log("Chart data fetch error:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const statValues: Record<string, string> = data
    ? {
        revenue: `₹${Number(data.total_revenue).toLocaleString("en-IN")}`,
        today: String(data.today_orders),
        month: String(data.this_month_orders),
        total: String(data.total_orders),
      }
    : {};

  const cardWidth = (screenWidth - SPACING.lg * 2 - SPACING.sm) / 2;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: SPACING.xl }}
    >
      {/* Welcome Banner */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}>
        <View style={styles.bannerCircle1} />
        <View style={styles.bannerCircle2} />
        <View style={styles.bannerCircle3} />
        {/* <View style={styles.bannerContent}>
          <View>
            <Text style={styles.bannerGreeting}>Welcome back 👋</Text>
            <Text style={styles.bannerName}>
              {user?.name || user?.username}
            </Text>
            <Text style={styles.bannerSub}>
              Here's your business overview for today
            </Text>
          </View>
          <View style={styles.bannerBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#fff" />
            <Text style={styles.bannerBadgeText}>Admin</Text>
          </View>
        </View> */}
      </LinearGradient>

      {/* Stats Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>Analytics Overview</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.statsGrid}>
          {/* Revenue — full width */}
          {data && (
            <AnimatedCard style={styles.revenueCard}>
              <LinearGradient
                colors={[COLORS.primaryDark, COLORS.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.revenueGradient}
              >
                <View style={styles.revenueCircle} />
                <View style={styles.revenueRow}>
                  <View>
                    <Text style={styles.revenueLabel}>Total Revenue</Text>
                    <AnimatedNumber
                      value={statValues.revenue}
                      style={styles.revenueValue}
                    />
                  </View>
                  <View style={styles.revenueIconBox}>
                    <Ionicons name="cash-outline" size={28} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
            </AnimatedCard>
          )}

          {/* 3 smaller cards */}
          {[
            { key: "today", label: "Today's Orders", icon: "today-outline", color: "#7C3AED", bg: "#F5F3FF" },
            { key: "month", label: "This Month", icon: "calendar-outline", color: "#0891B2", bg: "#ECFEFF" },
            { key: "total", label: "Total Orders", icon: "document-text-outline", color: "#059669", bg: "#F0FDF4" },
          ].map((s) => (
            data && (
              <AnimatedCard
                key={s.key}
                style={[styles.smallCard, { width: cardWidth }]}
              >
                <View style={[styles.smallCardIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                </View>
                <AnimatedNumber
                  value={statValues[s.key]}
                  style={StyleSheet.flatten([styles.smallCardValue, { color: s.color }])}
                />
                <Text style={styles.smallCardLabel}>{s.label}</Text>
              </AnimatedCard>
            )
          ))}
        </View>
      )}

      {/* Charts Section */}
      {chartLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading charts...</Text>
        </View>
      ) : chartData ? (
        <View style={styles.chartsSection}>
          {/* Revenue Trend */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Revenue Trend</Text>
            <View style={{ flex: 1 }} />
            <Dropdown
              data={YEAR_OPTIONS}
              labelField="label"
              valueField="value"
              value={lineYear}
              onChange={(item) => setLineYear(item.value)}
              style={styles.yearDropdown}
              selectedTextStyle={styles.yearDropdownText}
            />
          </View>
          <SalesLineChart data={chartData.monthly_sales} />

          {/* Overview */}
          <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>
          <MonthPicker
            year={donutYear}
            month={donutMonth}
            onChangeYear={setDonutYear}
            onChangeMonth={setDonutMonth}
          />
          <View style={styles.chartsRow}>
            <View style={styles.chartHalf}>
              <StatusPieChart data={chartData.status_distribution} />
            </View>
            <View style={styles.chartHalf}>
              <CategorySalesChart data={chartData.category_sales} />
            </View>
          </View>
          <TopPartiesChart data={chartData.top_parties} />
          <StatewiseBarChart data={chartData.statewise_orders} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Banner
  banner: {
    margin: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...SHADOWS.button,
  },
  bannerCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  bannerCircle2: {
    position: "absolute",
    bottom: -25,
    left: -25,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  bannerCircle3: {
    position: "absolute",
    top: 20,
    right: 80,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bannerContent: {
    padding: SPACING.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bannerGreeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  bannerName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  bannerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },
  bannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bannerBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  // Stats
  loadingBox: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  revenueCard: {
    width: "100%",
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  revenueGradient: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  revenueCircle: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  revenueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  revenueIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  smallCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "flex-start",
    ...SHADOWS.card,
  },
  smallCardIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  smallCardValue: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  smallCardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Charts
  chartsSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  yearDropdown: {
    backgroundColor: COLORS.primaryLighter,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 90,
  },
  yearDropdownText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  chartsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  chartHalf: {
    flex: 1,
  },
});
