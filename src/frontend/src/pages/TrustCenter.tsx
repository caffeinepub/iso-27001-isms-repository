import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import type { GovernanceSummary, RiskStats } from "../backend";
import { GovernanceStatus, RiskLevel } from "../backend";
import {
  useComplianceScores,
  useGovernanceSummary,
  useRiskStats,
} from "../hooks/useQueries";

function getComplianceColor(pct: number) {
  if (pct >= 80) return "text-emerald-400";
  if (pct >= 50) return "text-amber-400";
  return "text-rose-400";
}

function getComplianceBarColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-rose-500";
}

function getPostureBadge(avgPct: number) {
  if (avgPct >= 75)
    return {
      label: "Compliant",
      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      icon: CheckCircle2,
    };
  if (avgPct >= 40)
    return {
      label: "Partial",
      cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: Clock,
    };
  return {
    label: "Needs Attention",
    cls: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: XCircle,
  };
}

const RISK_LEVEL_STYLES: Record<
  string,
  { label: string; cls: string; dot: string }
> = {
  [RiskLevel.low]: {
    label: "Low",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  [RiskLevel.medium]: {
    label: "Medium",
    cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  [RiskLevel.high]: {
    label: "High",
    cls: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
  },
  [RiskLevel.critical]: {
    label: "Critical",
    cls: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  delay,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  delay?: number;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: delay ?? 0 }}
    >
      <Card className="bg-card border-border hover:border-primary/30 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold font-display text-foreground leading-none">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
              {sub && (
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {sub}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ComplianceSkeletons() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="bg-card border-border">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function GovernanceSummarySection({
  summary,
}: { summary: GovernanceSummary | undefined }) {
  const total = Number(summary?.total ?? 0);
  const byStatus = summary?.byStatus ?? [];
  const activeCount = Number(
    byStatus.find(([s]) => s === GovernanceStatus.active)?.[1] ?? 0,
  );
  const reviewCount = Number(
    byStatus.find(([s]) => s === GovernanceStatus.underReview)?.[1] ?? 0,
  );
  const byCategory = summary?.byCategory ?? [];
  const policyCount = Number(
    byCategory.find(([c]) => c === "policy")?.[1] ?? 0,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Total Governance Items"
        value={total}
        icon={Building2}
        delay={0.3}
      />
      <StatCard
        label="Active Policies"
        value={policyCount}
        icon={FileText}
        delay={0.35}
      />
      <StatCard
        label="Under Review"
        value={reviewCount}
        icon={Clock}
        delay={0.4}
        sub={activeCount > 0 ? `${activeCount} active items` : undefined}
      />
    </div>
  );
}

function RiskOverviewSection({ stats }: { stats: RiskStats | undefined }) {
  const total = Number(stats?.total ?? 0);
  const byLevel = stats?.byLevel ?? [];

  const levels = [
    RiskLevel.low,
    RiskLevel.medium,
    RiskLevel.high,
    RiskLevel.critical,
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {levels.map((level, idx) => {
          const count = Number(byLevel.find(([l]) => l === level)?.[1] ?? 0);
          const style = RISK_LEVEL_STYLES[level];
          return (
            <motion.div
              key={level}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.2 + idx * 0.07 }}
              data-ocid={`trust.risk.item.${idx + 1}`}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <div
                    className={`w-2 h-2 rounded-full ${style.dot} mx-auto mb-2`}
                  />
                  <p className="text-2xl font-bold font-display text-foreground">
                    {count}
                  </p>
                  <Badge className={`text-[10px] border mt-1 ${style.cls}`}>
                    {style.label}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Total Risks"
          value={total}
          icon={AlertTriangle}
          delay={0.45}
        />
        <StatCard
          label="Avg Residual Score"
          value={Number(stats?.avgResidualScore ?? 0)}
          icon={TrendingUp}
          delay={0.5}
          sub="Lower is better"
        />
      </div>
    </div>
  );
}

export function TrustCenter() {
  const { data: scores, isLoading: scoresLoading } = useComplianceScores();
  const { data: riskStats } = useRiskStats();
  const { data: govSummary } = useGovernanceSummary();

  const avgPct =
    scores && scores.length > 0
      ? scores.reduce((acc, s) => {
          const pct =
            Number(s.total) > 0 ? (Number(s.score) / Number(s.total)) * 100 : 0;
          return acc + pct;
        }, 0) / scores.length
      : 0;

  const posture = getPostureBadge(avgPct);
  const PostureIcon = posture.icon;

  return (
    <div data-ocid="trust.page" className="min-h-full bg-background">
      {/* Hero */}
      <section
        data-ocid="trust.section"
        className="relative overflow-hidden border-b border-border"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-primary/8 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-[-40%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-radial from-emerald-600/6 via-transparent to-transparent blur-3xl" />
          <div className="absolute inset-0 sidebar-grid opacity-10" />
        </div>

        <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-px bg-border" />
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Trust Center
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
                CybXSan{" "}
                <span className="trust-gradient-text">Trust Center</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Our commitment to security, compliance, and data protection.
                This page reflects our live GRC posture across all active
                compliance frameworks.
              </p>
            </div>

            <div className="shrink-0">
              <div className="trust-posture-card rounded-2xl p-5 text-center min-w-[160px]">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <PostureIcon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Security Posture
                </p>
                <Badge
                  data-ocid="trust.posture.toggle"
                  className={`text-xs border font-semibold px-3 py-1 ${posture.cls}`}
                >
                  {posture.label}
                </Badge>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {Math.round(avgPct)}% avg compliance
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 space-y-12">
        {/* Compliance Posture */}
        <section data-ocid="trust.compliance.section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Compliance Posture
              </h2>
              <p className="text-xs text-muted-foreground">
                Status across all active compliance frameworks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoresLoading ? (
              <ComplianceSkeletons />
            ) : scores && scores.length > 0 ? (
              scores.map((s, idx) => {
                const total = Number(s.total);
                const score = Number(s.score);
                const pct = total > 0 ? Math.round((score / total) * 100) : 0;
                const colorClass = getComplianceColor(pct);
                const barColor = getComplianceBarColor(pct);

                return (
                  <motion.div
                    key={s.frameworkName}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                    data-ocid={`trust.compliance.item.${idx + 1}`}
                  >
                    <Card className="bg-card border-border hover:border-primary/25 transition-colors h-full">
                      <CardHeader className="pb-3 pt-4 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold text-foreground leading-tight">
                            {s.frameworkName}
                          </CardTitle>
                          <span
                            className={`text-lg font-bold font-display ${colorClass} shrink-0`}
                          >
                            {pct}%
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-2">
                        <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            {score} / {total} controls
                          </span>
                          <span>{Number(s.implemented)} implemented</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div
                data-ocid="trust.compliance.empty_state"
                className="col-span-3 text-center py-12 text-muted-foreground"
              >
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No compliance data available yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Risk Overview */}
        <section data-ocid="trust.risk.section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Risk Overview
              </h2>
              <p className="text-xs text-muted-foreground">
                Current risk landscape across all registered risks
              </p>
            </div>
          </div>
          <RiskOverviewSection stats={riskStats} />
        </section>

        {/* Governance Summary */}
        <section data-ocid="trust.governance.section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Governance Summary
              </h2>
              <p className="text-xs text-muted-foreground">
                Policies, committees, and governance activities
              </p>
            </div>
          </div>
          <GovernanceSummarySection summary={govSummary} />
        </section>

        {/* Footer note */}
        <div className="border-t border-border pt-8 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            This trust center is updated in real-time from the CybXSan GRC
            platform.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
