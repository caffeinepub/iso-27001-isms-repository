import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { GitMerge, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { ControlStatus, GovernanceStatus } from "../backend";
import type { GovernanceItem } from "../backend";
import { useTenantUser } from "../contexts/TenantUserContext";
import {
  useComplianceControls,
  useComplianceControlsAsTenantUser,
  useComplianceFrameworks,
  useComplianceScores,
  useGetGovernanceFrameworkMappings,
  useGovernanceItems,
  useGovernanceItemsAsTenantUser,
  useInitializeGRCData,
  useUpdateComplianceControl,
} from "../hooks/useQueries";

// ── Types ──────────────────────────────────────────────────────────────────

type CtrlGovMap = Record<string, string[]>; // controlId(str) -> govItemId(str)[]

// ── Helpers ────────────────────────────────────────────────────────────────

function getStorageKey(domainKey: string) {
  return `ctrlGovMap_${domainKey}`;
}

function loadMapping(domainKey: string): CtrlGovMap {
  try {
    const raw = localStorage.getItem(getStorageKey(domainKey));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMapping(domainKey: string, map: CtrlGovMap) {
  localStorage.setItem(getStorageKey(domainKey), JSON.stringify(map));
}

function deriveControlStatus(
  controlId: string,
  mapping: CtrlGovMap,
  govItems: GovernanceItem[],
  backendStatus: ControlStatus,
): { status: ControlStatus; derived: boolean } {
  const linked = mapping[controlId];
  if (!linked || linked.length === 0) {
    return { status: backendStatus, derived: false };
  }
  const linkedItems = linked
    .map((id) => govItems.find((g) => g.id.toString() === id))
    .filter(Boolean) as GovernanceItem[];

  if (linkedItems.length === 0) {
    return { status: backendStatus, derived: false };
  }

  const activeCount = linkedItems.filter(
    (g) => g.status === GovernanceStatus.active,
  ).length;

  if (activeCount === linkedItems.length) {
    return { status: ControlStatus.fullyImplemented, derived: true };
  }
  if (activeCount > 0) {
    return { status: ControlStatus.partiallyImplemented, derived: true };
  }
  return { status: ControlStatus.notImplemented, derived: true };
}

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

function govStatusColor(status: GovernanceStatus) {
  switch (status) {
    case GovernanceStatus.active:
      return "bg-green-500/15 text-green-400 border-green-500/30";
    case GovernanceStatus.underReview:
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case GovernanceStatus.draft:
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case GovernanceStatus.retired:
      return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
}

// ── LinkGovDialog ──────────────────────────────────────────────────────────

function LinkGovDialog({
  controlLabel,
  frameworkId,
  govItems,
  fwMappings,
  linkedIds,
  onSave,
  onClose,
}: {
  controlLabel: string;
  frameworkId: bigint;
  govItems: GovernanceItem[];
  fwMappings:
    | Map<string, { frameworkId: bigint; frameworkName: string }>
    | undefined;
  linkedIds: string[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(linkedIds));

  const frameworkItems = govItems.filter(
    (g) =>
      fwMappings?.get(g.id.toString())?.frameworkId?.toString() ===
      frameworkId.toString(),
  );
  const otherItems = govItems.filter(
    (g) =>
      fwMappings?.get(g.id.toString())?.frameworkId?.toString() !==
      frameworkId.toString(),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Link Governance Items to{" "}
            <span className="font-mono text-primary">{controlLabel}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-3">
          {frameworkItems.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Mapped to this framework
              </p>
              <div className="space-y-1.5">
                {frameworkItems.map((item) => (
                  <label
                    key={item.id.toString()}
                    htmlFor={`fw-gov-${item.id.toString()}`}
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/30 cursor-pointer"
                  >
                    <Checkbox
                      id={`fw-gov-${item.id.toString()}`}
                      checked={selected.has(item.id.toString())}
                      onCheckedChange={() => toggle(item.id.toString())}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">
                        {item.title}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${govStatusColor(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          {frameworkItems.length > 0 && otherItems.length > 0 && (
            <Separator className="my-3" />
          )}

          {otherItems.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Other governance items
              </p>
              <div className="space-y-1.5">
                {otherItems.map((item) => (
                  <label
                    key={item.id.toString()}
                    htmlFor={`oth-gov-${item.id.toString()}`}
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/30 cursor-pointer"
                  >
                    <Checkbox
                      id={`oth-gov-${item.id.toString()}`}
                      checked={selected.has(item.id.toString())}
                      onCheckedChange={() => toggle(item.id.toString())}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">
                        {item.title}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${govStatusColor(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          {govItems.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No governance items found. Add governance items first.
            </p>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(Array.from(selected));
              onClose();
            }}
          >
            Save ({selected.size} linked)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── FrameworkControls ──────────────────────────────────────────────────────

function FrameworkControls({
  frameworkId,
  tenantUserId,
  domainKey,
  govItems,
  fwMappings,
  onMappingChange,
}: {
  frameworkId: bigint;
  tenantUserId?: string | null;
  domainKey: string;
  govItems: GovernanceItem[];
  fwMappings:
    | Map<string, { frameworkId: bigint; frameworkName: string }>
    | undefined;
  onMappingChange: () => void;
}) {
  const { data: controlsII, isLoading: loadingII } =
    useComplianceControls(frameworkId);
  const { data: controlsTU, isLoading: loadingTU } =
    useComplianceControlsAsTenantUser(
      tenantUserId ?? null,
      tenantUserId ? frameworkId : null,
    );
  const controls = tenantUserId ? controlsTU : controlsII;
  const isLoading = tenantUserId ? loadingTU : loadingII;
  const updateControl = useUpdateComplianceControl();

  const [mapping, setMapping] = useState<CtrlGovMap>(() =>
    loadMapping(domainKey),
  );
  const [linkDialogControl, setLinkDialogControl] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const handleSaveLink = useCallback(
    (controlId: string, ids: string[]) => {
      setMapping((prev) => {
        const next = { ...prev };
        if (ids.length === 0) {
          delete next[controlId];
        } else {
          next[controlId] = ids;
        }
        saveMapping(domainKey, next);
        return next;
      });
      onMappingChange();
    },
    [domainKey, onMappingChange],
  );

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
    <>
      <div className="space-y-2" data-ocid="compliance.list">
        {controls.map((control, idx) => {
          const ctrlIdStr = control.id.toString();
          const { status: effectiveStatus, derived } = deriveControlStatus(
            ctrlIdStr,
            mapping,
            govItems,
            control.status,
          );
          const linkedIds = mapping[ctrlIdStr] ?? [];

          return (
            <div
              key={ctrlIdStr}
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
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
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
                  {derived && (
                    <span className="text-[10px] text-muted-foreground/60 italic">
                      Derived from governance
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1.5">
                {/* Status badge */}
                {derived ? (
                  <Badge
                    variant="outline"
                    className={`text-[11px] px-2 py-0.5 border ${controlStatusColor(effectiveStatus)}`}
                  >
                    {controlStatusLabel(effectiveStatus)}
                  </Badge>
                ) : (
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
                      <SelectItem value={ControlStatus.notApplicable}>
                        N/A
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Link governance button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                  data-ocid={`compliance.link.button.${idx + 1}`}
                  onClick={() =>
                    setLinkDialogControl({
                      id: ctrlIdStr,
                      label: control.controlId,
                    })
                  }
                >
                  <GitMerge className="w-3 h-3 mr-1" />
                  {linkedIds.length > 0
                    ? `Linked (${linkedIds.length})`
                    : "Link Governance"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {linkDialogControl && (
        <LinkGovDialog
          controlLabel={linkDialogControl.label}
          frameworkId={frameworkId}
          govItems={govItems}
          fwMappings={fwMappings}
          linkedIds={mapping[linkDialogControl.id] ?? []}
          onSave={(ids) => handleSaveLink(linkDialogControl.id, ids)}
          onClose={() => setLinkDialogControl(null)}
        />
      )}
    </>
  );
}

// ── Computed score for active framework ───────────────────────────────────

function useLocalScore(
  frameworkId: bigint | null,
  tenantUserId: string | null | undefined,
  domainKey: string,
  govItems: GovernanceItem[],
  mappingVersion: number,
) {
  const { data: controlsII } = useComplianceControls(frameworkId ?? BigInt(0));
  const { data: controlsTU } = useComplianceControlsAsTenantUser(
    tenantUserId ?? null,
    tenantUserId && frameworkId ? frameworkId : null,
  );
  const controls = tenantUserId ? controlsTU : controlsII;

  return useMemo(() => {
    void mappingVersion; // trigger recompute on mapping change
    if (!controls || controls.length === 0) return null;
    const mapping = loadMapping(domainKey);
    let implemented = 0;
    for (const ctrl of controls) {
      const { status } = deriveControlStatus(
        ctrl.id.toString(),
        mapping,
        govItems,
        ctrl.status,
      );
      if (status === ControlStatus.fullyImplemented) implemented++;
    }
    return { implemented, total: controls.length };
  }, [controls, govItems, domainKey, mappingVersion]);
}

// ── ComplianceStandards ────────────────────────────────────────────────────

export function ComplianceStandards() {
  const { tenantUser } = useTenantUser();
  const { data: frameworks, isLoading: fwLoading } = useComplianceFrameworks();
  const { data: scores } = useComplianceScores();
  const [selectedFwId, setSelectedFwId] = useState<bigint | null>(null);
  const [mappingVersion, setMappingVersion] = useState(0);
  const initGRC = useInitializeGRCData();

  const domainKey = tenantUser?.domain ?? "global";
  const activeFwId = selectedFwId ?? frameworks?.[0]?.id ?? null;

  // Load governance items
  const { data: govItemsAdmin } = useGovernanceItems();
  const { data: govItemsTenant } = useGovernanceItemsAsTenantUser(
    tenantUser ? tenantUser.id : null,
  );
  const govItems: GovernanceItem[] =
    (tenantUser ? govItemsTenant : govItemsAdmin) ?? [];

  // Framework mappings for governance items
  const { data: fwMappings } = useGetGovernanceFrameworkMappings();

  const handleMappingChange = useCallback(() => {
    setMappingVersion((v) => v + 1);
  }, []);

  // Local score for active framework
  const localScore = useLocalScore(
    activeFwId,
    tenantUser?.id,
    domainKey,
    govItems,
    mappingVersion,
  );

  const activePct =
    localScore && localScore.total > 0
      ? Math.round((localScore.implemented / localScore.total) * 100)
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
          Manage controls across major compliance frameworks. Link governance
          items to drive real compliance scores.
        </p>
      </motion.div>

      {/* Empty state */}
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
            {initGRC.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Initialize Sample GRC Data
          </Button>
        </motion.div>
      )}

      {fwLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <Skeleton key={k} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {!fwLoading && frameworks && frameworks.length > 0 && (
        <>
          {/* Framework tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {frameworks.map((fw) => {
              const isActive = fw.id === activeFwId;
              const backendScore = scores?.find(
                (s) => s.frameworkName === fw.name,
              );
              // For active framework use local computed score, others use backend
              let pct: number;
              if (isActive && localScore && localScore.total > 0) {
                pct = Math.round(
                  (localScore.implemented / localScore.total) * 100,
                );
              } else if (backendScore && Number(backendScore.total) > 0) {
                pct = Math.round(
                  (Number(backendScore.implemented) /
                    Number(backendScore.total)) *
                    100,
                );
              } else {
                pct = 0;
              }

              return (
                <motion.button
                  key={fw.id.toString()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-ocid="compliance.framework.tab"
                  onClick={() => setSelectedFwId(fw.id)}
                  className={`relative text-left p-3 rounded-xl border transition-all ${
                    isActive
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/50 bg-card hover:border-primary/30"
                  }`}
                >
                  <p className="text-xs font-semibold text-foreground mb-1 line-clamp-1">
                    {fw.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mb-2 line-clamp-1">
                    {fw.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-primary shrink-0">
                      {pct}%
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Active framework detail */}
          {activeFwId && (
            <motion.div
              key={activeFwId.toString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {frameworks.find((f) => f.id === activeFwId)?.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {
                          frameworks.find((f) => f.id === activeFwId)
                            ?.description
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">
                          Compliance Score
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-24 h-2 rounded-full bg-muted/40">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${activePct}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-primary">
                            {activePct}%
                          </span>
                        </div>
                        {localScore && (
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {localScore.implemented}/{localScore.total} controls
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mapping hint */}
                  <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/15">
                    <GitMerge className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground">
                      Controls marked <strong>Implemented</strong> only when
                      linked governance items are <strong>Active</strong>. Use
                      the "Link Governance" button on each control to map
                      governance items.
                    </p>
                  </div>
                </CardHeader>

                <CardContent>
                  <FrameworkControls
                    frameworkId={activeFwId}
                    tenantUserId={tenantUser?.id}
                    domainKey={domainKey}
                    govItems={govItems}
                    fwMappings={fwMappings}
                    onMappingChange={handleMappingChange}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
