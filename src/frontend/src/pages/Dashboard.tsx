import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  FileText,
  Shield,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { DocumentStatus } from "../backend";
import { StatusBadge } from "../components/StatusBadge";
import { useDocuments } from "../hooks/useQueries";

const CLAUSES = [
  { number: "4", name: "Context of the Organization" },
  { number: "5", name: "Leadership" },
  { number: "6", name: "Planning" },
  { number: "7", name: "Support" },
  { number: "8", name: "Operation" },
  { number: "9", name: "Performance Evaluation" },
  { number: "10", name: "Improvement" },
  { number: "A", name: "Annex A Controls" },
];

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function Dashboard({
  onViewDocument,
}: {
  onViewDocument: (id: bigint) => void;
}) {
  const { data: documents, isLoading } = useDocuments();

  const stats = useMemo(() => {
    if (!documents) return null;
    const total = documents.length;
    const approved = documents.filter(
      (d) => d.status === DocumentStatus.approved,
    ).length;
    const inProgress = documents.filter(
      (d) => d.status === DocumentStatus.inProgress,
    ).length;
    const notStarted = documents.filter(
      (d) => d.status === DocumentStatus.notStarted,
    ).length;
    const completed = documents.filter(
      (d) => d.status === DocumentStatus.completed,
    ).length;
    return { total, approved, inProgress, notStarted, completed };
  }, [documents]);

  const clauseProgress = useMemo(() => {
    if (!documents) return [];
    return CLAUSES.map((clause) => {
      const clauseDocs = documents.filter((d) =>
        clause.number === "A"
          ? d.isAnnexA
          : d.clauseNumber.startsWith(`${clause.number}.`) ||
            d.clauseNumber === clause.number,
      );
      const done = clauseDocs.filter(
        (d) =>
          d.status === DocumentStatus.approved ||
          d.status === DocumentStatus.completed,
      ).length;
      const pct =
        clauseDocs.length === 0
          ? 0
          : Math.round((done / clauseDocs.length) * 100);
      return { ...clause, total: clauseDocs.length, done, pct };
    });
  }, [documents]);

  const recentDocs = useMemo(() => {
    if (!documents) return [];
    return [...documents]
      .sort((a, b) => Number(b.updatedAt - a.updatedAt))
      .slice(0, 5);
  }, [documents]);

  const statCards = [
    {
      label: "Total Documents",
      value: stats?.total ?? 0,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Approved",
      value: stats?.approved ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "In Progress",
      value: stats?.inProgress ?? 0,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Not Started",
      value: stats?.notStarted ?? 0,
      icon: CircleDashed,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
    },
  ];

  return (
    <div data-ocid="dashboard.page" className="p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            ISMS Dashboard
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          ISO 27001:2022 compliance overview and document status
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
              <Card className="stat-card-glow bg-card border-border">
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
                  {isLoading ? (
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

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Clause Progress */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground font-display">
                  Clause Completion
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading
                ? ["c1", "c2", "c3", "c4", "c5", "c6"].map((k) => (
                    <div key={k} className="space-y-1.5">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))
                : clauseProgress.map((clause) => (
                    <div key={clause.number}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-mono text-primary/70 w-5 shrink-0">
                            {clause.number === "A" ? "A" : clause.number}
                          </span>
                          <span className="text-xs text-foreground/80 truncate max-w-[120px] sm:max-w-[180px]">
                            {clause.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {clause.done}/{clause.total}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              clause.pct === 100
                                ? "text-emerald-400"
                                : clause.pct > 50
                                  ? "text-amber-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {clause.pct}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                            clause.pct === 100
                              ? "bg-emerald-400"
                              : clause.pct > 50
                                ? "bg-amber-400"
                                : "bg-primary/50"
                          }`}
                          style={{ width: `${clause.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Documents */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground font-display">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {isLoading ? (
                ["r1", "r2", "r3", "r4", "r5"].map((k) => (
                  <Skeleton key={k} className="h-14 w-full" />
                ))
              ) : recentDocs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No documents yet
                  </p>
                </div>
              ) : (
                recentDocs.map((doc) => (
                  <button
                    type="button"
                    key={doc.id.toString()}
                    onClick={() => onViewDocument(doc.id)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {doc.clauseNumber} · {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Overall compliance meter */}
      {!isLoading && stats && stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6"
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground font-display">
                    Overall Compliance
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Documents approved or completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-primary">
                    {Math.round(
                      ((stats.approved + stats.completed) / stats.total) * 100,
                    )}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.approved + stats.completed} / {stats.total}
                  </p>
                </div>
              </div>
              <Progress
                value={Math.round(
                  ((stats.approved + stats.completed) / stats.total) * 100,
                )}
                className="h-2"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
