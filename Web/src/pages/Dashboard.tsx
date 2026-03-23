import { useState, useEffect } from "react";
import api from "../services/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import "../styles/Dashboard.css";

interface KPIData {
  total_orders: number;
  total_revenue: string;
  today_orders: number;
  this_month_orders: number;
  status_counts: Record<string, number>;
  user_counts: Record<string, number>;
}

interface ChartsData {
  monthly_sales: { month: string; label: string; revenue: number; count: number }[];
  statewise_orders: { state: string; orders: number }[];
  status_distribution: { status: string; label: string; count: number }[];
  category_sales: { category: string; total_sales: number; count: number }[];
}

const PALETTE = ["#1e293b", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const fmt = (n: number | string) =>
  Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const fmtCurrency = (n: number | string) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear];

export default function Dashboard() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, chartsRes] = await Promise.all([
        api.get(`/orders/dashboard/?year=${year}`),
        api.get(`/orders/dashboard/charts/?line_year=${year}&year=${year}&month=0`),
      ]);
      setKpi(kpiRes.data);
      setCharts(chartsRes.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="db-loading">
        <div className="db-spinner" />
        Loading dashboard…
      </div>
    );
  }

  const asmCount = kpi?.user_counts?.manager ?? 0;
  const activeStatewise = charts?.statewise_orders.filter(s => s.state !== "Unknown").slice(0, 12) ?? [];
  const activeStatus = charts?.status_distribution.filter(s => s.count > 0) ?? [];

  return (
    <div className="db-root">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="db-header">
        <h1 className="db-title">Admin Dashboard</h1>
        <select
          className="db-year-select"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="db-kpi-row">
        <div className="db-card db-card--blue">
          <div className="db-card-icon">👤</div>
          <div className="db-card-label">Total ASMs</div>
          <div className="db-card-value">{fmt(asmCount)}</div>
          <div className="db-card-sub">Active managers</div>
        </div>

        <div className="db-card db-card--dark">
          <div className="db-card-icon">📦</div>
          <div className="db-card-label">Total Orders</div>
          <div className="db-card-value">{fmt(kpi?.total_orders ?? 0)}</div>
          <div className="db-card-sub">{year}</div>
        </div>

        <div className="db-card db-card--green">
          <div className="db-card-icon">📅</div>
          <div className="db-card-label">This Month</div>
          <div className="db-card-value">{fmt(kpi?.this_month_orders ?? 0)}</div>
          <div className="db-card-sub">Orders placed</div>
        </div>

        <div className="db-card db-card--amber">
          <div className="db-card-icon">💰</div>
          <div className="db-card-label">Total Revenue</div>
          <div className="db-card-value db-card-value--sm">{fmtCurrency(kpi?.total_revenue ?? 0)}</div>
          <div className="db-card-sub">{year}</div>
        </div>
      </div>

      {/* ── Row 1: Monthly Trend + Status Donut ────────────── */}
      <div className="db-charts-row">

        <div className="db-chart-box db-chart-box--wide">
          <div className="db-chart-title">Monthly Sales Trend ({year})</div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={charts?.monthly_sales ?? []} margin={{ top: 10, right: 16, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e293b" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={52} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#1e293b" strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: "#1e293b" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="db-chart-box">
          <div className="db-chart-title">Order Status ({year})</div>
          {activeStatus.length === 0 ? (
            <div className="db-no-data">No data for this period</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={activeStatus}
                    dataKey="count"
                    nameKey="label"
                    cx="50%" cy="50%"
                    outerRadius={70}
                    innerRadius={38}
                  >
                    {activeStatus.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="db-legend">
                {activeStatus.map((s, i) => (
                  <div key={s.status} className="db-legend-item">
                    <span className="db-legend-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="db-legend-label">{s.label}</span>
                    <span className="db-legend-val">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: State-wise + Category Sales ─────────────── */}
      <div className="db-charts-row">

        <div className="db-chart-box db-chart-box--wide">
          <div className="db-chart-title">State-wise Orders ({year})</div>
          {activeStatewise.length === 0 ? (
            <div className="db-no-data">No state data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, activeStatewise.length * 32)}>
              <BarChart
                data={activeStatewise}
                layout="vertical"
                margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 12, fill: "#374151" }} width={110} />
                <Tooltip />
                <Bar dataKey="orders" radius={[0, 4, 4, 0]}>
                  {activeStatewise.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="db-chart-box">
          <div className="db-chart-title">Category Sales ({year})</div>
          {(charts?.category_sales ?? []).length === 0 ? (
            <div className="db-no-data">No category data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={charts?.category_sales ?? []}
                margin={{ top: 10, right: 16, bottom: 24, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#64748b" }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={52} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Sales"]} />
                <Bar dataKey="total_sales" radius={[4, 4, 0, 0]}>
                  {(charts?.category_sales ?? []).map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
