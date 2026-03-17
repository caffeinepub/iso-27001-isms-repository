import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ControlStatus } from "../backend";
import {
  useComplianceControls,
  useComplianceFrameworks,
  useComplianceScores,
  useInitializeGRCData,
  useUpdateComplianceControl,
} from "../hooks/useQueries";

function controlStatusColor(status: ControlStatus) {
  switch (status) {
    case ControlStatus.fullyImplemented:
      return "bg-green-500/15 text-green-400 border-green-500/30";
    case ControlStatus.partiallyImplemented:
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case ControlStatus.notImplemented:
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case ControlStatus.notApplicable:
      return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
}

function controlStatusLabel(status: ControlStatus) {
  switch (status) {
    case ControlStatus.fullyImplemented:
      return "Implemented";
    case ControlStatus.partiallyImplemented:
      return "Partial";
    case ControlStatus.notImplemented:
      return "Not Implemented";
    case ControlStatus.notApplicable:
      return "N/A";
  }
}

function FrameworkControls({ frameworkId }: { frameworkId: bigint }) {
  const { data: controls, isLoading } = useComplianceControls(frameworkId);
  const updateControl = useUpdateComplianceControl();

  if (isLoading) {
    return (
      <div data-ocid="compliance.loading_state" className="space-y-2">
        {[1, 2, 3, 4, 5].map((k) => (
          <Skeleton key={k} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!controls || controls.length === 0) {
    return (
      <div
        data-ocid="compliance.controls.empty_state"
        className="text-center py-10"
      >
        <ShieldCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No controls found for this framework
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-ocid="compliance.list">
      {controls.map((control, idx) => (
        <div
          key={control.id.toString()}
          data-ocid={`compliance.item.${idx + 1}`}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
        >
          <div className="shrink-0 mt-0.5">
            <span className="text-[11px] font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
              {control.controlId}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">
              {control.controlName}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
              {control.description}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {control.owner && (
                <span className="text-[11px] text-muted-foreground/70">
                  Owner: {control.owner}
                </span>
              )}
              {control.evidence && (
                <span className="text-[11px] text-muted-foreground/70 truncate max-w-[200px]">
                  Evidence: {control.evidence}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <Select
              value={control.status}
              onValueChange={(v) =>
                updateControl.mutate({
                  id: control.id,
                  status: v as ControlStatus,
                })
              }
            >
              <SelectTrigger
                data-ocid={`compliance.status.select.${idx + 1}`}
                className={`h-7 text-[11px] w-36 border ${controlStatusColor(control.status)}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ControlStatus.fullyImplemented}>
                  Implemented
                </SelectItem>
                <SelectItem value={ControlStatus.partiallyImplemented}>
                  Partial
                </SelectItem>
                <SelectItem value={ControlStatus.notImplemented}>
                  Not Implemented
                </SelectItem>
                <SelectItem value={ControlStatus.notApplicable}>N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComplianceStandards() {
  const { data: frameworks, isLoading: fwLoading } = useComplianceFrameworks();
  const { data: scores, isLoading: scoresLoading } = useComplianceScores();
  const [selectedFwId, setSelectedFwId] = useState<bigint | null>(null);
  const initGRC = useInitializeGRCData();

  const activeFwId = selectedFwId ?? frameworks?.[0]?.id ?? null;

  const activeScore = scores?.find(
    (s) =>
      s.frameworkName === frameworks?.find((f) => f.id === activeFwId)?.name,
  );
  const activePct =
    activeScore && Number(activeScore.total) > 0
      ? Math.round(
          (Number(activeScore.implemented) / Number(activeScore.total)) * 100,
        )
      : 0;

  return (
    <div data-ocid="compliance.page" className="p-3 sm:p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Compliance Standards
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage controls across major compliance frameworks
        </p>
      </motion.div>

      {/* Empty state when no frameworks loaded */}
      {!fwLoading && (!frameworks || frameworks.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid="compliance.empty_state"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">
            No compliance frameworks yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Initialize sample GRC data to load ISO 27001, SOC 2, GDPR, PCI DSS,
            NIST CSF, and more.
          </p>
          <Button
            data-ocid="compliance.init.primary_button"
            onClick={() => initGRC.mutate()}
            disabled={initGRC.isPending}
            className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
          >
            {initGRC.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Initialize Sample Data
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Overview cards */}
      {(fwLoading || (frameworks && frameworks.length > 0)) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {scoresLoading
            ? [1, 2, 3, 4, 5, 6].map((k) => (
                <Skeleton key={k} className="h-20" />
              ))
            : (scores ?? []).map((fw) => {
                const pct =
                  Number(fw.total) === 0
                    ? 0
                    : Math.round(
                        (Number(fw.implemented) / Number(fw.total)) * 100,
                      );
                const fwObj = frameworks?.find(
                  (f) => f.name === fw.frameworkName,
                );
                return (
                  <button
                    type="button"
                    key={fw.frameworkName}
                    data-ocid="compliance.framework.tab"
                    onClick={() => fwObj && setSelectedFwId(fwObj.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      fwObj?.id === activeFwId
                        ? "bg-primary/15 border-primary/30 ring-1 ring-primary/20"
                        : "bg-card border-border hover:border-primary/20"
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-foreground truncate">
                      {fw.frameworkName}
                    </p>
                    <p
                      className={`text-lg font-display font-bold mt-1 ${
                        pct >= 80
                          ? "text-emerald-400"
                          : pct >= 50
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {pct}%
                    </p>
                    <div className="h-1 bg-muted rounded-full mt-1.5">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 80
                            ? "bg-emerald-400"
                            : pct >= 50
                              ? "bg-amber-400"
                              : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {Number(fw.implemented)}/{Number(fw.total)}
                    </p>
                  </button>
                );
              })}
        </div>
      )}

      {/* Active Framework Controls */}
      {fwLoading ? (
        <Skeleton className="h-60 w-full" />
      ) : frameworks && frameworks.length > 0 && activeFwId !== null ? (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-semibold font-display">
                  {frameworks.find((f) => f.id === activeFwId)?.name} — Controls
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {frameworks.find((f) => f.id === activeFwId)?.description}
                </p>
              </div>
              {activeScore && (
                <div className="shrink-0 text-right">
                  <p
                    className={`text-2xl font-display font-bold ${
                      activePct >= 80
                        ? "text-emerald-400"
                        : activePct >= 50
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {activePct}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {Number(activeScore.implemented)} /{" "}
                    {Number(activeScore.total)} implemented
                  </p>
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              {[
                { status: ControlStatus.fullyImplemented },
                { status: ControlStatus.partiallyImplemented },
                { status: ControlStatus.notImplemented },
                { status: ControlStatus.notApplicable },
              ].map(({ status }) => (
                <div key={status} className="flex items-center gap-1.5">
                  <Badge
                    className={`text-[10px] ${controlStatusColor(status)}`}
                  >
                    {controlStatusLabel(status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <FrameworkControls frameworkId={activeFwId} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
