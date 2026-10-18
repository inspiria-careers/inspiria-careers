"use client";
import React, { useMemo } from "react";
import { t, Lang } from "@/translations";
import { formatInr } from "@/lib/paymentUtils";

interface AppointmentData {
  id: string;
  userId?: string | null;
  serviceTitle: string;
  serviceFee?: number | null;
  paymentStatus?: string;
  status: string;
  date: string;
}

interface InsightsViewProps {
  appointments: AppointmentData[];
  lang?: Lang;
}

export default function InsightsView({ appointments, lang = "en" }: InsightsViewProps) {
  const metrics = useMemo(() => {
    const total = appointments.length;
    if (total === 0) {
      return {
        total: 0,
        completed: 0,
        confirmed: 0,
        cancelled: 0,
        noShow: 0,
        cancellationRate: "0%",
        noShowRate: "0%",
        verifiedRevenue: 0,
        monthlyCounts: [] as { month: string; count: number; revenue: number }[],
        servicesBreakdown: [] as { title: string; count: number; percentage: number }[],
        returningClientRate: "0%",
      };
    }

    let completed = 0;
    let confirmed = 0;
    let cancelled = 0;
    let noShow = 0;
    let verifiedRevenue = 0;

    const monthlyMap: Record<string, { count: number; revenue: number }> = {};
    const serviceMap: Record<string, number> = {};
    const userClientCounts: Record<string, number> = {};

    appointments.forEach((appt) => {
      if (appt.status === "completed") completed++;
      else if (appt.status === "confirmed") confirmed++;
      else if (appt.status === "cancelled") cancelled++;
      else if (appt.status === "no_show") noShow++;

      if (appt.paymentStatus === "verified" && appt.serviceFee) {
        verifiedRevenue += Number(appt.serviceFee);
      }

      // Monthly aggregation (YYYY-MM)
      const monthKey = appt.date ? appt.date.substring(0, 7) : "Unknown";
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { count: 0, revenue: 0 };
      }
      monthlyMap[monthKey].count++;
      if (appt.paymentStatus === "verified" && appt.serviceFee) {
        monthlyMap[monthKey].revenue += Number(appt.serviceFee);
      }

      // Service popularity
      const sTitle = appt.serviceTitle || "General Counselling";
      serviceMap[sTitle] = (serviceMap[sTitle] || 0) + 1;

      // Returning client tracking
      if (appt.userId) {
        userClientCounts[appt.userId] = (userClientCounts[appt.userId] || 0) + 1;
      }
    });

    const cancellationRate = ((cancelled / total) * 100).toFixed(1) + "%";
    const noShowRate = ((noShow / total) * 100).toFixed(1) + "%";

    // Returning clients
    const uniqueClients = Object.keys(userClientCounts).length;
    const returningClients = Object.values(userClientCounts).filter((c) => c > 1).length;
    const returningClientRate = uniqueClients > 0
      ? ((returningClients / uniqueClients) * 100).toFixed(1) + "%"
      : "N/A";

    // Sorted monthly (last 6 months)
    const sortedMonths = Object.keys(monthlyMap)
      .sort()
      .slice(-6)
      .map((m) => ({
        month: m,
        count: monthlyMap[m].count,
        revenue: monthlyMap[m].revenue,
      }));

    // Services breakdown sorted
    const servicesBreakdown = Object.entries(serviceMap)
      .sort((a, b) => b[1] - a[1])
      .map(([title, count]) => ({
        title,
        count,
        percentage: Math.round((count / total) * 100),
      }));

    return {
      total,
      completed,
      confirmed,
      cancelled,
      noShow,
      cancellationRate,
      noShowRate,
      verifiedRevenue,
      monthlyCounts: sortedMonths,
      servicesBreakdown,
      returningClientRate,
    };
  }, [appointments]);

  const maxMonthCount = useMemo(() => {
    return Math.max(...metrics.monthlyCounts.map((m) => m.count), 1);
  }, [metrics.monthlyCounts]);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--brand-primary)" }}>
          📊 {t("insights", lang)}
        </h2>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Aggregated practice analytics, verified revenue, and attendance statistics. Zero personal client data.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Bookings
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand-primary)", marginTop: "0.25rem" }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {metrics.completed} Completed • {metrics.confirmed} Confirmed
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            {t("totalRevenue", lang)}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10b981", marginTop: "0.25rem" }}>
            {formatInr(metrics.verifiedRevenue)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            From verified UPI payments
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            {t("cancellationRate", lang)}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f59e0b", marginTop: "0.25rem" }}>
            {metrics.cancellationRate}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {metrics.cancelled} Cancelled sessions
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            {t("noShowRate", lang)}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#ef4444", marginTop: "0.25rem" }}>
            {metrics.noShowRate}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {metrics.noShow} Missed sessions
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Monthly Booking Trends (Pure CSS / SVG Bar Chart) */}
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--brand-primary)" }}>
            📈 Monthly Consultation Volume
          </h3>
          {metrics.monthlyCounts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              Not enough data to graph monthly trends.
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", height: "180px", gap: "1rem", paddingTop: "1rem", borderBottom: "1px solid var(--border)" }}>
              {metrics.monthlyCounts.map((m) => {
                const heightPercent = Math.round((m.count / maxMonthCount) * 100);
                return (
                  <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.25rem" }}>
                      {m.count}
                    </span>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "40px",
                        height: `${Math.max(heightPercent, 8)}%`,
                        background: "linear-gradient(180deg, var(--brand-primary) 0%, rgba(26,58,143,0.6) 100%)",
                        borderRadius: "6px 6px 0 0",
                        transition: "height 0.3s ease",
                      }}
                      title={`${m.month}: ${m.count} sessions (${formatInr(m.revenue)})`}
                    />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                      {m.month.split("-")[1]}/{m.month.split("-")[0].substring(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Booked Services Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--brand-primary)" }}>
            🎯 {t("popularServices", lang)}
          </h3>
          {metrics.servicesBreakdown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              No service booking data recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {metrics.servicesBreakdown.slice(0, 5).map((s) => (
                <div key={s.title}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600 }}>{s.title}</span>
                    <span style={{ color: "var(--text-muted)" }}>{s.count} ({s.percentage}%)</span>
                  </div>
                  <div style={{ background: "var(--surface-2)", height: "8px", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${s.percentage}%`,
                        height: "100%",
                        background: "var(--brand-secondary, #c9a84c)",
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px dashed var(--border)", marginTop: "1rem", paddingTop: "0.75rem", fontSize: "0.825rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
            <span>🔁 {t("returningRate", lang)}:</span>
            <strong style={{ color: "var(--brand-primary)" }}>{metrics.returningClientRate}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
