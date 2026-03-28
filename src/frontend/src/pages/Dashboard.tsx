import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  Shield,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Page } from "../App";
import { RiskLevel, RiskStatus } from "../backend";
import { useTenantUser } from "../contexts/TenantUserContext";
import {
  useComplianceScores,
  useDocuments,
  useGovernanceItems,
  useGovernanceItemsAsTenantUser,
  useRiskStats,
  useRisks,
  useRisksAsTenantUser,
} from "../hooks/useQueries";

function govStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/15 text-green-400";
    case "draft":
      return "bg-yellow-500/15 text-yellow-400";
    case "underReview":
      return "bg-blue-500/15 text-blue-400";
    case "retired":
      return "bg-slate-500/15 text-slate-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function govCategoryLabel(cat: string) {
  switch (cat) {
    case "policy":
      return "Policy";
    case "committee":
      return "Committee";
    case "meeting":
      return "Meeting";
    case "actionItem":
      return "Action Item";
    default:
      return cat;
  }
}

export function Dashboard({
  onNavigate,
}: { onNavigate: (page: Page) => void }) {
  const { tenantUser } = useTenantUser();
  const isTenantUser = !!tenantUser;

  // Risk data - tenant users get isolated risks; admin/II users get all risks
  const { data: risksII, isLoading: risksIILoading } = useRisks();
  const { data: risksTU, isLoading: risksTULoading } = useRisksAsTenantUser(
    isTenantUser ? tenantUser!.id : null,
  );
  const risks = isTenantUser ? risksTU : risksII;
  const risksLoading = isTenantUser ? risksTULoading : risksIILoading;

  const { data: riskStats } = useRiskStats();
  const { data: complianceScores, isLoading: scoresLoading } =
    useComplianceScores();

  // Governance data - tenant users get isolated items
  const { data: govItemsII, isLoading: govLoadingII } = useGovernanceItems();
  const { data: govItemsTU, isLoading: govLoadingTU } =
    useGovernanceItemsAsTenantUser(isTenantUser ? tenantUser!.id : null);
  const govItems = isTenantUser ? govItemsTU : govItemsII;
  const govLoading = isTenantUser ? govLoadingTU : govLoadingII;

  const { data: documents } = useDocuments();

  const criticalRisks = useMemo(() => {
    if (!risks) return 0;
    return risks.filter((r) => r.riskLevel === RiskLevel.critical).length;
  }, [risks]);

  const openRisks = useMemo(() => {
    if (!risks) return 0;
    return risks.filter((r) => r.status === RiskStatus.open).length;
  }, [risks]);

  const overallCompliance = useMemo(() => {
    if (!complianceScores || complianceScores.length === 0) return 0;
    const totals = complianceScores.reduce(
      (acc, f) => acc + Number(f.total),
      0,
    );
    const implemented = complianceScores.reduce(
      (acc, f) => acc + Number(f.implemented),
      0,
    );
    return totals === 0 ? 0 : Math.round((implemented / totals) * 100);
  }, [complianceScores]);

  const activePolicies = useMemo(() => {
    if (!govItems) return 0;
    return govItems.filter((g) => g.status === ("active" as any)).length;
  }, [govItems]);

  const recentGovItems = useMemo(() => {
    if (!govItems) return [];
    return [...govItems]
      .sort((a, b) => Number(b.updatedAt - a.updatedAt))
      .slice(0, 5);
  }, [govItems]);

  const riskLevelCounts = useMemo(() => {
    const order = [
      RiskLevel.critical,
      RiskLevel.high,
      RiskLevel.medium,
      RiskLevel.low,
    ];
    if (isTenantUser) {
      // Compute from tenant-filtered risks array
      return order.map((level) => ({
        level,
        count: (risks ?? []).filter((r) => r.riskLevel === level).length,
      }));
    }
    if (!riskStats) return [];
    return order.map((level) => {
      const entry = riskStats.byLevel.find(([l]) => l === level);
      return { level, count: entry ? Number(entry[1]) : 0 };
    });
  }, [riskStats, risks, isTenantUser]);

  const statCards = [
    {
      label: "Total Risks",
      value: isTenantUser
        ? (risks ?? []).length
        : riskStats
          ? Number(riskStats.total)
          : 0,
      icon: AlertTriangle,
      color: "text-primary",
      bg: "bg-primary/10",
      page: "riskRegister" as Page,
    },
    {
      label: "Critical Risks",
      value: criticalRisks,
      icon: Shield,
      color: "text-red-400",
      bg: "bg-red-500/10",
      page: "riskRegister" as Page,
    },
    {
      label: "Overall Compliance",
      value: `${overallCompliance}%`,
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      page: "compliance" as Page,
    },
    {
      label: "Active Policies",
      value: activePolicies,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      page: "governance" as Page,
    },
  ];

  return (
    <div data-ocid="dashboard.page" className="p-3 sm:p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            GRC Dashboard
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Governance, Risk &amp; Compliance — unified posture overview
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card
                data-ocid={`dashboard.${card.page}.card`}
                className="stat-card-glow bg-card border-border cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => onNavigate(card.page)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      {card.label}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-md ${card.bg} flex items-center justify-center`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                    </div>
                  </div>
                  {risksLoading || scoresLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p
                      className={`text-3xl font-display font-bold ${card.color}`}
                    >
                      {card.value}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Compliance Scores */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground font-display">
                  Framework Compliance Scores
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoresLoading
                ? [1, 2, 3, 4, 5, 6].map((k) => (
                    <div key={k} className="space-y-1.5">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))
                : (complianceScores ?? []).map((fw) => {
                    const pct =
                      Number(fw.total) === 0
                        ? 0
                        : Math.round(
                            (Number(fw.implemented) / Number(fw.total)) * 100,
                          );
                    return (
                      <div key={fw.frameworkName}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-foreground/80">
                            {fw.frameworkName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {Number(fw.implemented)}/{Number(fw.total)}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                pct >= 80
                                  ? "text-emerald-400"
                                  : pct >= 50
                                    ? "text-amber-400"
                                    : "text-red-400"
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                              pct >= 80
                                ? "bg-emerald-400"
                                : pct >= 50
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Level Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground font-display">
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {risksLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={riskLevelCounts.map(({ level, count }) => ({
                      name: level.charAt(0).toUpperCase() + level.slice(1),
                      count,
                      level,
                    }))}
                    margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(128,128,128,0.15)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: "6px",
                        padding: "6px 10px",
                      }}
                      cursor={{ fill: "rgba(100,200,255,0.06)" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {riskLevelCounts.map(({ level }) => (
                        <Cell
                          key={level}
                          fill={
                            level === RiskLevel.critical
                              ? "#ef4444"
                              : level === RiskLevel.high
                                ? "#f97316"
                                : level === RiskLevel.medium
                                  ? "#eab308"
                                  : "#22c55e"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {!risksLoading && (isTenantUser ? true : !!riskStats) && (
                <div className="pt-3 border-t border-border mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Open Risks
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {openRisks}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Avg Residual Score
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {isTenantUser
                        ? (risks ?? []).length === 0
                          ? 0
                          : Math.round(
                              (risks ?? []).reduce(
                                (sum, r) =>
                                  sum + Number(r.residualRiskScore ?? 0),
                                0,
                              ) / (risks ?? []).length,
                            )
                        : Number(riskStats?.avgResidualScore ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Governance + Documents */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground font-display">
                  Recent Governance
                </CardTitle>
                <button
                  type="button"
                  data-ocid="dashboard.governance.link"
                  onClick={() => onNavigate("governance")}
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {govLoading ? (
                [1, 2, 3].map((k) => (
                  <Skeleton key={k} className="h-14 w-full" />
                ))
              ) : recentGovItems.length === 0 ? (
                <div
                  data-ocid="governance.empty_state"
                  className="text-center py-8"
                >
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No governance items yet
                  </p>
                </div>
              ) : (
                recentGovItems.map((item) => (
                  <div
                    key={item.id.toString()}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {govCategoryLabel(item.category as string)} ·{" "}
                        {item.owner}
                      </p>
                    </div>
                    <Badge
                      className={`text-[10px] shrink-0 ${govStatusColor(item.status as string)}`}
                    >
                      {(item.status as string).replace(/([A-Z])/g, " $1")}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground font-display">
                  Document Compliance (ISO 27001)
                </CardTitle>
                <button
                  type="button"
                  data-ocid="dashboard.documents.link"
                  onClick={() => onNavigate("documents")}
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {!documents ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">
                      {
                        documents.filter(
                          (d) =>
                            d.status === "approved" || d.status === "completed",
                        ).length
                      }{" "}
                      / {documents.length} complete
                    </p>
                    <p className="text-lg font-display font-bold text-primary">
                      {documents.length === 0
                        ? 0
                        : Math.round(
                            (documents.filter(
                              (d) =>
                                d.status === "approved" ||
                                d.status === "completed",
                            ).length /
                              documents.length) *
                              100,
                          )}
                      %
                    </p>
                  </div>
                  <Progress
                    value={
                      documents.length === 0
                        ? 0
                        : Math.round(
                            (documents.filter(
                              (d) =>
                                d.status === "approved" ||
                                d.status === "completed",
                            ).length /
                              documents.length) *
                              100,
                          )
                    }
                    className="h-2 mb-4"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Total Docs",
                        value: documents.length,
                        icon: FileText,
                        color: "text-primary",
                      },
                      {
                        label: "Approved",
                        value: documents.filter((d) => d.status === "approved")
                          .length,
                        icon: CheckCircle2,
                        color: "text-emerald-400",
                      },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div
                          key={s.label}
                          className="p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                            <span className="text-[11px] text-muted-foreground">
                              {s.label}
                            </span>
                          </div>
                          <p
                            className={`text-xl font-display font-bold ${s.color}`}
                          >
                            {s.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="mt-8 py-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CybXSan. Enterprise GRC Platform.
        </p>
      </footer>
    </div>
  );
}
