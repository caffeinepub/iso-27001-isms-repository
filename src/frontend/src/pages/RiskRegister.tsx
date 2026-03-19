import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  Info,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  type CreateRiskInput,
  MaturityLevel,
  type MitigationControl,
  type RiskItem,
  RiskLevel,
  RiskStatus,
  RiskTreatment,
  ThreatCategory,
  type UpdateRiskInput,
} from "../backend";
import { useTenantUser } from "../contexts/TenantUserContext";

type RiskFormState = Omit<CreateRiskInput, "status"> & { status: RiskStatus };
import {
  useCallerRole,
  useCallerTenant,
  useCreateRisk,
  useCreateRiskAsTenantUser,
  useDeleteRisk,
  useDeleteRiskAsTenantUser,
  useRiskStats,
  useRisks,
  useRisksAsTenantUser,
  useUpdateRisk,
  useUpdateRiskAsTenantUser,
} from "../hooks/useQueries";

// ── ISO 27001 Annex A Controls ──────────────────────────────────────────────
const ANNEX_A_CONTROLS: { id: string; name: string }[] = [
  { id: "A.5.1", name: "Policies for information security" },
  { id: "A.5.2", name: "Information security roles and responsibilities" },
  { id: "A.5.3", name: "Segregation of duties" },
  { id: "A.5.4", name: "Management responsibilities" },
  { id: "A.5.5", name: "Contact with authorities" },
  { id: "A.5.6", name: "Contact with special interest groups" },
  { id: "A.5.7", name: "Threat intelligence" },
  { id: "A.5.8", name: "Information security in project management" },
  { id: "A.5.9", name: "Inventory of information and other associated assets" },
  {
    id: "A.5.10",
    name: "Acceptable use of information and other associated assets",
  },
  { id: "A.6.1", name: "Screening" },
  { id: "A.6.2", name: "Terms and conditions of employment" },
  {
    id: "A.6.3",
    name: "Information security awareness, education and training",
  },
  { id: "A.6.4", name: "Disciplinary process" },
  {
    id: "A.6.5",
    name: "Responsibilities after termination or change of employment",
  },
  { id: "A.6.6", name: "Confidentiality or non-disclosure agreements" },
  { id: "A.6.7", name: "Remote working" },
  { id: "A.6.8", name: "Information security event reporting" },
  { id: "A.7.1", name: "Physical security perimeters" },
  { id: "A.7.2", name: "Physical entry" },
  { id: "A.7.3", name: "Securing offices, rooms and facilities" },
  { id: "A.7.4", name: "Physical security monitoring" },
  {
    id: "A.7.5",
    name: "Protecting against physical and environmental threats",
  },
  { id: "A.7.6", name: "Working in secure areas" },
  { id: "A.7.7", name: "Clear desk and clear screen" },
  { id: "A.7.8", name: "Equipment siting and protection" },
  { id: "A.7.9", name: "Security of assets off-premises" },
  { id: "A.7.10", name: "Storage media" },
  { id: "A.7.11", name: "Supporting utilities" },
  { id: "A.7.12", name: "Cabling security" },
  { id: "A.7.13", name: "Equipment maintenance" },
  { id: "A.7.14", name: "Secure disposal or re-use of equipment" },
  { id: "A.8.1", name: "User end point devices" },
  { id: "A.8.2", name: "Privileged access rights" },
  { id: "A.8.3", name: "Information access restriction" },
  { id: "A.8.4", name: "Access to source code" },
  { id: "A.8.5", name: "Secure authentication" },
  { id: "A.8.6", name: "Capacity management" },
  { id: "A.8.7", name: "Protection against malware" },
  { id: "A.8.8", name: "Management of technical vulnerabilities" },
  { id: "A.8.9", name: "Configuration management" },
  { id: "A.8.10", name: "Information deletion" },
  { id: "A.8.11", name: "Data masking" },
  { id: "A.8.12", name: "Data leakage prevention" },
  { id: "A.8.13", name: "Information backup" },
  { id: "A.8.14", name: "Redundancy of information processing facilities" },
  { id: "A.8.15", name: "Logging" },
  { id: "A.8.16", name: "Monitoring activities" },
  { id: "A.8.17", name: "Clock synchronization" },
  { id: "A.8.18", name: "Use of privileged utility programs" },
  { id: "A.8.19", name: "Installation of software on operational systems" },
  { id: "A.8.20", name: "Networks security" },
  { id: "A.8.21", name: "Security of network services" },
  { id: "A.8.22", name: "Segregation of networks" },
  { id: "A.8.23", name: "Web filtering" },
  { id: "A.8.24", name: "Use of cryptography" },
  { id: "A.8.25", name: "Secure development life cycle" },
  { id: "A.8.26", name: "Application security requirements" },
  {
    id: "A.8.27",
    name: "Secure system architecture and engineering principles",
  },
  { id: "A.8.28", name: "Secure coding" },
  { id: "A.8.29", name: "Security testing in development and acceptance" },
  { id: "A.8.30", name: "Outsourced development" },
  {
    id: "A.8.31",
    name: "Separation of development, test and production environments",
  },
  { id: "A.8.32", name: "Change management" },
  { id: "A.8.33", name: "Test information" },
  {
    id: "A.8.34",
    name: "Protection of information systems during audit testing",
  },
];

// ── Maturity Level options per Table 9 (Controls Assessment Criteria) ─────
// High=1, Medium=2, Low=3, Non-Existent=4
const CONTROL_MATURITY_OPTIONS: {
  value: string;
  label: string;
  numericValue: number;
  description: string;
}[] = [
  {
    value: "high",
    label: "High (1)",
    numericValue: 1,
    description:
      "Documented policy, procedures and/or technical controls exist and the control objective is achieved.",
  },
  {
    value: "medium",
    label: "Medium (2)",
    numericValue: 2,
    description:
      "No documented policy/procedures exist but the control objective is achieved.",
  },
  {
    value: "low",
    label: "Low (3)",
    numericValue: 3,
    description:
      "Documented policy/procedures exist but the control objective is NOT achieved.",
  },
  {
    value: "nonExistent",
    label: "Non-Existent (4)",
    numericValue: 4,
    description:
      "No documented policy/procedures exist and the control objective is NOT achieved.",
  },
];

// ── Inherent Risk options per Table 6/7 ───────────────────────────────────
// Score = Impact × Likelihood; 1-3 = Low, 4-6 = Medium, 7-9 = High
const INHERENT_RISK_OPTIONS: {
  value: string;
  label: string;
  scoreRange: string;
  numericValue: number;
}[] = [
  { value: "low", label: "Low", scoreRange: "Score 1–3", numericValue: 1 },
  {
    value: "medium",
    label: "Medium",
    scoreRange: "Score 4–6",
    numericValue: 2,
  },
  { value: "high", label: "High", scoreRange: "Score 7–9", numericValue: 3 },
];

// Derive inherent risk level from numeric score (per Table 7)
function inherentRiskLevel(score: number): string {
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

// Derive residual risk level from Table 10 matrix
// Maturity (rows): high=1, medium=2, low=3, nonExistent=4
// Inherent (cols): low=1, medium=2, high=3
function residualRiskLevel(
  inherentLevel: string,
  maturityValue: number,
): string {
  // Table 10 matrix:
  // maturity=high(1):       low → low,    medium → low,    high → low
  // maturity=medium(2):     low → low,    medium → low,    high → medium
  // maturity=low(3):        low → low,    medium → medium, high → high
  // maturity=nonExistent(4):low → low,    medium → high,   high → high
  if (maturityValue === 1) return "low";
  if (maturityValue === 2) return inherentLevel === "high" ? "medium" : "low";
  if (maturityValue === 3)
    return inherentLevel === "high"
      ? "high"
      : inherentLevel === "medium"
        ? "medium"
        : "low";
  // nonExistent = 4
  return inherentLevel === "low" ? "low" : "high";
}

// Residual risk numeric value: High=3, Medium=2, Low=1
function residualNumericValue(level: string): number {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

// Actual Risk Value = Maturity Value × Residual Value (Table 11)
// Actual Risk Rating: High=6-9, Medium=3-5, Low=1-2 (Table 12)
function actualRiskRating(actualScore: number): string {
  if (actualScore >= 6) return "high";
  if (actualScore >= 3) return "medium";
  return "low";
}

const MATURITY_OPTIONS: {
  value: MaturityLevel;
  label: string;
  numericValue: number;
}[] = [
  { value: MaturityLevel.critical, label: "Critical (1)", numericValue: 1 },
  { value: MaturityLevel.high, label: "High (2)", numericValue: 2 },
  { value: MaturityLevel.medium, label: "Medium (3)", numericValue: 3 },
  { value: MaturityLevel.low, label: "Low (4)", numericValue: 4 },
  { value: MaturityLevel.veryLow, label: "Very Low (5)", numericValue: 5 },
];

const THREAT_OPTIONS: { value: ThreatCategory; label: string }[] = [
  { value: ThreatCategory.hostileInsiders, label: "Hostile Insiders" },
  { value: ThreatCategory.nonHostileInsiders, label: "Non-hostile Insiders" },
  { value: ThreatCategory.hostileOutsiders, label: "Hostile Outsiders" },
  { value: ThreatCategory.nonHostileOutsiders, label: "Non-hostile Outsiders" },
  { value: ThreatCategory.technicalProblems, label: "Technical Problems" },
  {
    value: ThreatCategory.dependencyProblems,
    label: "Dependency Problems/Outages",
  },
  { value: ThreatCategory.legal, label: "Legal" },
  { value: ThreatCategory.environmental, label: "Environmental" },
];

function threatLabel(cat: ThreatCategory): string {
  return THREAT_OPTIONS.find((t) => t.value === cat)?.label ?? cat;
}

function riskScoreColor(score: number) {
  if (score >= 20) return "bg-red-500/15 text-red-400 border-red-500/30";
  if (score >= 13)
    return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  if (score >= 7)
    return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function levelBadgeColor(level: string) {
  if (level === "high") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (level === "medium")
    return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-green-500/15 text-green-400 border-green-500/30";
}

function riskLevelColor(level: RiskLevel) {
  switch (level) {
    case RiskLevel.critical:
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case RiskLevel.high:
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case RiskLevel.medium:
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case RiskLevel.low:
      return "bg-green-500/15 text-green-400 border-green-500/30";
  }
}

function statusColor(status: RiskStatus) {
  switch (status) {
    case RiskStatus.open:
      return "bg-red-500/15 text-red-400";
    case RiskStatus.inTreatment:
      return "bg-yellow-500/15 text-yellow-400";
    case RiskStatus.closed:
      return "bg-green-500/15 text-green-400";
  }
}

function InherentRiskMatrix({ risks }: { risks: RiskItem[] }) {
  // 3x3 heat map per methodology (Likelihood 1-3, Impact 1-3)
  const cellCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of risks) {
      const key = `${Number(r.likelihood)}-${Number(r.impact)}`;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [risks]);

  // Per methodology: Low=1-3, Medium=4-6, High=7-9
  function cellColor(l: number, i: number) {
    const score = l * i;
    if (score >= 7)
      return "bg-red-700/70 hover:bg-red-700/90 border border-red-600/50";
    if (score >= 4)
      return "bg-yellow-600/70 hover:bg-yellow-600/90 border border-yellow-500/50";
    return "bg-green-700/70 hover:bg-green-700/90 border border-green-600/50";
  }

  function cellScore(l: number, i: number) {
    return l * i;
  }

  const IMPACT_LABELS: Record<number, string> = {
    3: "High (3)",
    2: "Medium (2)",
    1: "Low (1)",
  };
  const LIKELIHOOD_LABELS: Record<number, string> = {
    1: "Low (1)",
    2: "Medium (2)",
    3: "High (3)",
  };

  return (
    <div>
      <div className="flex gap-2 items-end">
        {/* Y-axis label */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            minWidth: 16,
          }}
        >
          <span className="text-[9px] text-muted-foreground tracking-widest uppercase">
            Impact
          </span>
        </div>
        <div className="flex-1">
          {/* Y-axis tick labels + grid */}
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 justify-around pr-1">
              {[3, 2, 1].map((imp) => (
                <div key={imp} className="h-14 flex items-center justify-end">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {IMPACT_LABELS[imp]}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="grid gap-1 flex-1"
              style={{
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
              }}
            >
              {[3, 2, 1].map((imp) =>
                [1, 2, 3].map((lik) => {
                  const count = cellCounts[`${lik}-${imp}`] ?? 0;
                  const score = cellScore(lik, imp);
                  return (
                    <div
                      key={`${lik}-${imp}`}
                      className={`relative rounded flex flex-col items-center justify-center h-14 text-[10px] font-bold transition-colors ${cellColor(lik, imp)}`}
                    >
                      <span className="text-white/50 text-[9px]">{score}</span>
                      {count > 0 && (
                        <span className="text-white font-bold text-sm leading-none">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
          {/* X-axis tick labels */}
          <div className="flex gap-1 mt-1 ml-[calc(2.5rem+4px)]">
            {[1, 2, 3].map((l) => (
              <div key={l} className="flex-1 text-center">
                <span className="text-[10px] text-muted-foreground">
                  {LIKELIHOOD_LABELS[l]}
                </span>
              </div>
            ))}
          </div>
          {/* X-axis label */}
          <p className="text-[9px] text-muted-foreground text-center mt-0.5 uppercase tracking-widest">
            Likelihood
          </p>
        </div>
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {[
          { label: "Low (1–3)", cls: "bg-green-700/70" },
          { label: "Medium (4–6)", cls: "bg-yellow-600/70" },
          { label: "High (7–9)", cls: "bg-red-700/70" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${l.cls}`} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Residual Risk Table 10 (Reference) ─────────────────────────────────────
function ResidualRiskTable10() {
  const TABLE10 = [
    { maturity: "High (1)", cells: ["Low", "Low", "Low"] },
    { maturity: "Medium (2)", cells: ["Low", "Low", "Medium"] },
    { maturity: "Low (3)", cells: ["Low", "Medium", "High"] },
    { maturity: "Non-Existent (4)", cells: ["Low", "High", "High"] },
  ];
  const cellClass = (v: string) =>
    v === "Low"
      ? "bg-green-700/70 text-white"
      : v === "Medium"
        ? "bg-yellow-600/70 text-white"
        : "bg-red-700/70 text-white";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="border border-border bg-muted text-muted-foreground p-2 text-left font-medium">
              Controls Maturity ↓ / Inherent Risk →
            </th>
            <th className="border border-border bg-muted text-muted-foreground p-2 text-center font-medium">
              Low
            </th>
            <th className="border border-border bg-muted text-muted-foreground p-2 text-center font-medium">
              Medium
            </th>
            <th className="border border-border bg-muted text-muted-foreground p-2 text-center font-medium">
              High
            </th>
          </tr>
        </thead>
        <tbody>
          {TABLE10.map((row) => (
            <tr key={row.maturity}>
              <td className="border border-border bg-muted text-muted-foreground p-2 font-medium whitespace-nowrap">
                {row.maturity}
              </td>
              {row.cells.map((v, i) => (
                <td
                  key={`${row.maturity}-${i}`}
                  className={`border border-border p-2 text-center font-semibold ${cellClass(v)}`}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Actual Risk Matrix (3×3) ──────────────────────────────────────────────
function ActualRiskMatrix({ risks }: { risks: RiskItem[] }) {
  const cellCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of risks) {
      const inherentScore = Number(r.likelihood) * Number(r.impact);
      const iLevel = inherentRiskLevel(inherentScore);
      // Compute average maturity from mitigationControls
      let maturityForMatrix = 3; // default = Low (3)
      if (r.mitigationControls && r.mitigationControls.length > 0) {
        const avg =
          r.mitigationControls.reduce((sum, ctrl) => {
            const opt = MATURITY_OPTIONS.find(
              (m) => m.value === ctrl.maturityLevel,
            );
            return sum + (opt ? opt.numericValue : 3);
          }, 0) / r.mitigationControls.length;
        maturityForMatrix = Math.min(3, Math.max(1, Math.round(avg)));
      }
      const residualLevel = residualRiskLevel(iLevel, maturityForMatrix);
      const residualNumeric = residualNumericValue(residualLevel);
      const key = `${residualNumeric}-${maturityForMatrix}`;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [risks]);

  function cellColor(residual: number, maturity: number) {
    const score = residual * maturity;
    if (score >= 6)
      return "bg-red-700/70 hover:bg-red-700/90 border border-red-600/50";
    if (score >= 3)
      return "bg-yellow-600/70 hover:bg-yellow-600/90 border border-yellow-500/50";
    return "bg-green-700/70 hover:bg-green-700/90 border border-green-600/50";
  }

  const MATURITY_LABELS: Record<number, string> = {
    1: "High (1)",
    2: "Medium (2)",
    3: "Low (3)",
  };
  const RESIDUAL_LABELS: Record<number, string> = {
    1: "Low (1)",
    2: "Medium (2)",
    3: "High (3)",
  };

  return (
    <div>
      <div className="flex gap-2 items-end">
        <div
          className="flex flex-col items-center justify-center"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            minWidth: 16,
          }}
        >
          <span className="text-[9px] text-muted-foreground tracking-widest uppercase">
            Controls Maturity
          </span>
        </div>
        <div className="flex-1">
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 justify-around pr-1">
              {[1, 2, 3].map((mat) => (
                <div key={mat} className="h-14 flex items-center justify-end">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {MATURITY_LABELS[mat]}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="grid gap-1 flex-1"
              style={{
                gridTemplateColumns: "repeat(3, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
              }}
            >
              {[1, 2, 3].map((mat) =>
                [1, 2, 3].map((res) => {
                  const count = cellCounts[`${res}-${mat}`] ?? 0;
                  const score = res * mat;
                  return (
                    <div
                      key={`${res}-${mat}`}
                      className={`relative rounded flex flex-col items-center justify-center h-14 text-[10px] font-bold transition-colors ${cellColor(res, mat)}`}
                    >
                      <span className="text-white/50 text-[9px]">{score}</span>
                      {count > 0 && (
                        <span className="text-white font-bold text-sm leading-none">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
          <div className="flex gap-1 mt-1 ml-[calc(2.5rem+4px)]">
            {[1, 2, 3].map((r) => (
              <div key={r} className="flex-1 text-center">
                <span className="text-[10px] text-muted-foreground">
                  {RESIDUAL_LABELS[r]}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground text-center mt-0.5 uppercase tracking-widest">
            Residual Risk Value
          </p>
        </div>
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {[
          { label: "Low (1–2)", cls: "bg-green-700/70" },
          { label: "Medium (3–5)", cls: "bg-yellow-600/70" },
          { label: "High (6–9)", cls: "bg-red-700/70" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${l.cls}`} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mitigation Controls Selector ──────────────────────────────────────────
function MitigationControlsSelector({
  value,
  onChange,
}: {
  value: MitigationControl[];
  onChange: (controls: MitigationControl[]) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return ANNEX_A_CONTROLS;
    const q = search.toLowerCase();
    return ANNEX_A_CONTROLS.filter(
      (c) => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [search]);

  function isSelected(id: string) {
    return value.some((c) => c.controlId === id);
  }

  function toggleControl(ctrl: { id: string; name: string }) {
    if (isSelected(ctrl.id)) {
      onChange(value.filter((c) => c.controlId !== ctrl.id));
    } else {
      onChange([
        ...value,
        {
          controlId: ctrl.id,
          controlName: ctrl.name,
          maturityLevel: MaturityLevel.medium,
        },
      ]);
    }
  }

  function updateMaturity(controlId: string, level: MaturityLevel) {
    onChange(
      value.map((c) =>
        c.controlId === controlId ? { ...c, maturityLevel: level } : c,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          data-ocid="risk.search_input"
          className="pl-8 h-8 text-xs"
          placeholder="Search controls..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ScrollArea className="h-44 rounded-md border border-border">
        <div className="p-2 space-y-1">
          {filtered.map((ctrl) => (
            <div
              key={ctrl.id}
              className="flex items-start gap-2.5 p-1.5 rounded hover:bg-muted/30 cursor-pointer"
              onClick={() => toggleControl(ctrl)}
              onKeyDown={(e) => e.key === "Enter" && toggleControl(ctrl)}
            >
              <Checkbox
                checked={isSelected(ctrl.id)}
                onCheckedChange={() => toggleControl(ctrl)}
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-mono text-primary">
                  {ctrl.id}
                </span>
                <span className="text-xs text-foreground ml-2 leading-tight">
                  {ctrl.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">
            Selected Controls — Set Maturity Level
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {value.map((ctrl) => (
              <div
                key={ctrl.controlId}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-primary">
                    {ctrl.controlId}
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {ctrl.controlName}
                  </p>
                </div>
                <Select
                  value={ctrl.maturityLevel}
                  onValueChange={(v) =>
                    updateMaturity(ctrl.controlId, v as MaturityLevel)
                  }
                >
                  <SelectTrigger
                    data-ocid="risk.select"
                    className="h-7 w-36 text-[11px] shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATURITY_OPTIONS.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="text-xs"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Risk Score Display (per ISMS India Risk Methodology) ──────────────────
function RiskScoreDisplay({
  likelihood,
  impact,
  controlMaturity,
}: {
  likelihood: bigint;
  impact: bigint;
  controlMaturity: string;
}) {
  const inherentScore = Number(likelihood) * Number(impact);
  const iLevel = inherentRiskLevel(inherentScore);
  const maturityOpt =
    CONTROL_MATURITY_OPTIONS.find((m) => m.value === controlMaturity) ??
    CONTROL_MATURITY_OPTIONS[2];
  const residualLevel = residualRiskLevel(iLevel, maturityOpt.numericValue);
  const residualValue = residualNumericValue(residualLevel);
  const actualScore = maturityOpt.numericValue * residualValue;
  const actualRating = actualRiskRating(actualScore);

  const iLabel =
    INHERENT_RISK_OPTIONS.find((r) => r.value === iLevel)?.label ?? iLevel;

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        Live Score Calculation (ISMS Methodology)
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Inherent Risk */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Inherent Risk</p>
          <p className="text-[10px] text-muted-foreground">
            (L × I = {inherentScore})
          </p>
          <Badge
            className={`text-[11px] font-semibold w-full justify-center ${levelBadgeColor(iLevel)}`}
          >
            {iLabel}
          </Badge>
        </div>
        {/* Residual Risk */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Residual Risk</p>
          <p className="text-[10px] text-muted-foreground">(Table 10 matrix)</p>
          <Badge
            className={`text-[11px] font-semibold w-full justify-center ${levelBadgeColor(residualLevel)}`}
          >
            {residualLevel.charAt(0).toUpperCase() + residualLevel.slice(1)}
          </Badge>
        </div>
        {/* Actual Risk */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Actual Risk</p>
          <p className="text-[10px] text-muted-foreground">
            (Mat × Res = {actualScore})
          </p>
          <Badge
            className={`text-[11px] font-semibold w-full justify-center ${
              actualRating === "high"
                ? "bg-red-500/15 text-red-400 border-red-500/30"
                : actualRating === "medium"
                  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                  : "bg-green-500/15 text-green-400 border-green-500/30"
            }`}
          >
            {actualRating.charAt(0).toUpperCase() + actualRating.slice(1)} (
            {actualScore})
          </Badge>
        </div>
      </div>
      {actualScore > 5 && (
        <p className="text-[10px] text-red-400 text-center">
          ⚠ Score {actualScore} exceeds acceptable threshold (1–5) — Risk
          Treatment Plan required
        </p>
      )}
    </div>
  );
}

// ── EMPTY FORM ─────────────────────────────────────────────────────────────
const EMPTY_FORM: RiskFormState = {
  title: "",
  description: "",
  threatCategory: ThreatCategory.technicalProblems,
  vulnerability: "",
  likelihood: 3n,
  impact: 3n,
  mitigationControls: [],
  treatment: RiskTreatment.mitigate,
  treatmentOwner: "",
  treatmentNotes: "",
  treatmentPlanDescription: "",
  treatmentPlanOwner: "",
  treatmentPlanTargetDate: "",
  treatmentPlanReviewDate: "",
  dueDate: "",
  status: RiskStatus.open,
};

// ── Export Functions ──────────────────────────────────────────────────────
function exportToPDF(risks: RiskItem[]) {
  const headers = [
    "#",
    "Title",
    "Threat Category",
    "Likelihood",
    "Impact",
    "Inherent Score",
    "Inherent Level",
    "Residual Level",
    "Status",
    "Treatment",
    "Owner",
    "Due Date",
  ];
  const rows = risks.map((r, idx) => {
    const iScore = Number(r.likelihood) * Number(r.impact);
    const iLevel = inherentRiskLevel(iScore);
    let maturityForMatrix = 3;
    if (r.mitigationControls && r.mitigationControls.length > 0) {
      const avg =
        r.mitigationControls.reduce((sum, ctrl) => {
          const opt = MATURITY_OPTIONS.find(
            (m) => m.value === ctrl.maturityLevel,
          );
          return sum + (opt ? opt.numericValue : 3);
        }, 0) / r.mitigationControls.length;
      maturityForMatrix = Math.min(3, Math.max(1, Math.round(avg)));
    }
    const rLevel = residualRiskLevel(iLevel, maturityForMatrix);
    return [
      idx + 1,
      r.title,
      r.threatCategory,
      Number(r.likelihood),
      Number(r.impact),
      iScore,
      iLevel.charAt(0).toUpperCase() + iLevel.slice(1),
      rLevel.charAt(0).toUpperCase() + rLevel.slice(1),
      r.status,
      r.treatment,
      r.treatmentOwner || "-",
      r.dueDate || "-",
    ];
  });
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td style="border:1px solid #ccc;padding:4px 8px;font-size:11px">${cell}`).join("")}</tr>`,
    )
    .join("");
  const html = `<html><head><title>Risk Register</title><style>body{font-family:sans-serif}table{border-collapse:collapse;width:100%}th{background:#1e293b;color:#fff;padding:6px 8px;font-size:11px;border:1px solid #ccc}</style></head><body><h2 style="font-size:16px">Risk Register Export</h2><p style="font-size:11px">Generated: ${new Date().toLocaleDateString()}</p><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "risk-register-export.html";
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(risks: RiskItem[]) {
  const headers = [
    "#",
    "Title",
    "Threat Category",
    "Likelihood",
    "Impact",
    "Inherent Score",
    "Inherent Level",
    "Residual Level",
    "Status",
    "Treatment",
    "Owner",
    "Due Date",
  ];
  const rows = risks.map((r, idx) => {
    const iScore = Number(r.likelihood) * Number(r.impact);
    const iLevel = inherentRiskLevel(iScore);
    let maturityForMatrix = 3;
    if (r.mitigationControls && r.mitigationControls.length > 0) {
      const avg =
        r.mitigationControls.reduce((sum, ctrl) => {
          const opt = MATURITY_OPTIONS.find(
            (m) => m.value === ctrl.maturityLevel,
          );
          return sum + (opt ? opt.numericValue : 3);
        }, 0) / r.mitigationControls.length;
      maturityForMatrix = Math.min(3, Math.max(1, Math.round(avg)));
    }
    const rLevel = residualRiskLevel(iLevel, maturityForMatrix);
    return [
      idx + 1,
      r.title,
      r.threatCategory,
      Number(r.likelihood),
      Number(r.impact),
      iScore,
      iLevel.charAt(0).toUpperCase() + iLevel.slice(1),
      rLevel.charAt(0).toUpperCase() + rLevel.slice(1),
      r.status,
      r.treatment,
      r.treatmentOwner || "-",
      r.dueDate || "-",
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "risk-register-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ─────────────────────────────────────────────────────────
export function RiskRegister() {
  const { tenantUser } = useTenantUser();
  const isTenantUser = !!tenantUser;

  // Standard II-based hooks (used for admin/II users)
  const { data: risksII, isLoading: risksIILoading } = useRisks();
  const { data: riskStats } = useRiskStats();
  const createRiskII = useCreateRisk();
  const updateRisk = useUpdateRisk();
  const updateRiskTU = useUpdateRiskAsTenantUser();
  const deleteRiskII = useDeleteRisk();
  const { data: callerRole } = useCallerRole();
  const { data: callerTenant, isLoading: tenantLoading } = useCallerTenant();

  // Tenant-user hooks (used for email/password tenant users)
  const { data: risksTU, isLoading: risksTULoading } = useRisksAsTenantUser(
    isTenantUser ? tenantUser!.id : null,
  );
  const createRiskTU = useCreateRiskAsTenantUser();
  const deleteRiskTU = useDeleteRiskAsTenantUser();

  // Unified values
  const risks = isTenantUser ? risksTU : risksII;
  const isLoading = isTenantUser ? risksTULoading : risksIILoading;
  const createRisk = {
    mutateAsync: async (input: any) =>
      isTenantUser
        ? createRiskTU.mutateAsync({ userId: tenantUser!.id, input })
        : createRiskII.mutateAsync(input),
    isPending: isTenantUser ? createRiskTU.isPending : createRiskII.isPending,
  };
  const deleteRisk = {
    mutateAsync: async (id: bigint) =>
      isTenantUser
        ? deleteRiskTU.mutateAsync({ userId: tenantUser!.id, riskId: id })
        : deleteRiskII.mutateAsync(id),
    isPending: isTenantUser ? deleteRiskTU.isPending : deleteRiskII.isPending,
  };

  const isAdmin = !isTenantUser && callerRole === "admin";
  // Tenant users always have a tenant (their org)
  const hasTenant = isTenantUser || isAdmin || !!callerTenant;

  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [form, setForm] = useState<RiskFormState>(EMPTY_FORM);
  const [controlMaturity, setControlMaturity] = useState<string>("low");
  const [treatmentPlanOpen, setTreatmentPlanOpen] = useState(false);

  const filteredRisks = useMemo(() => {
    let list = risks ?? [];
    if (filterLevel !== "all")
      list = list.filter((r) => r.riskLevel === filterLevel);
    if (filterStatus !== "all")
      list = list.filter((r) => r.status === filterStatus);
    return list;
  }, [risks, filterLevel, filterStatus]);

  // Auto-derive Inherent Risk level string from likelihood × impact
  const computedInherentLevel = inherentRiskLevel(
    Number(form.likelihood) * Number(form.impact),
  );
  const computedInherentScore = Number(form.likelihood) * Number(form.impact);

  function openAdd() {
    setEditingRisk(null);
    setForm(EMPTY_FORM);
    setControlMaturity("low");
    setTreatmentPlanOpen(false);
    setDialogOpen(true);
  }

  function openEdit(risk: RiskItem) {
    setEditingRisk(risk);
    setForm({
      title: risk.title,
      description: risk.description,
      threatCategory: risk.threatCategory,
      vulnerability: risk.vulnerability,
      likelihood: risk.likelihood,
      impact: risk.impact,
      mitigationControls: risk.mitigationControls,
      treatment: risk.treatment,
      treatmentOwner: risk.treatmentOwner,
      treatmentNotes: risk.treatmentNotes,
      treatmentPlanDescription: risk.treatmentPlanDescription,
      treatmentPlanOwner: risk.treatmentPlanOwner,
      treatmentPlanTargetDate: risk.treatmentPlanTargetDate,
      treatmentPlanReviewDate: risk.treatmentPlanReviewDate,
      dueDate: risk.dueDate,
      status: risk.status,
    });
    setControlMaturity("low");
    setTreatmentPlanOpen(!!risk.treatmentPlanDescription);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;
    if (editingRisk) {
      const input: UpdateRiskInput = {
        id: editingRisk.id,
        title: form.title,
        description: form.description,
        threatCategory: form.threatCategory,
        vulnerability: form.vulnerability,
        likelihood: form.likelihood,
        impact: form.impact,
        mitigationControls: form.mitigationControls,
        treatment: form.treatment,
        treatmentOwner: form.treatmentOwner,
        treatmentNotes: form.treatmentNotes,
        treatmentPlanDescription: form.treatmentPlanDescription,
        treatmentPlanOwner: form.treatmentPlanOwner,
        treatmentPlanTargetDate: form.treatmentPlanTargetDate,
        treatmentPlanReviewDate: form.treatmentPlanReviewDate,
        dueDate: form.dueDate,
        status: form.status,
      };
      if (isTenantUser && tenantUser) {
        await updateRiskTU.mutateAsync({ userId: tenantUser.id, input });
      } else {
        await updateRisk.mutateAsync(input);
      }
    } else {
      await createRisk.mutateAsync({ ...form });
    }
    setDialogOpen(false);
  }

  const isPending = createRisk.isPending || updateRisk.isPending;

  return (
    <div data-ocid="risk.page" className="p-3 sm:p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Risk Register
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Identify, assess, and manage organizational risks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-ocid="risk.export_pdf.button"
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              disabled={!risks || risks.length === 0 || isLoading}
              onClick={() => exportToPDF(filteredRisks)}
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Export PDF
            </Button>
            <Button
              data-ocid="risk.export_excel.button"
              variant="outline"
              size="sm"
              className="shrink-0 text-xs"
              disabled={!risks || risks.length === 0 || isLoading}
              onClick={() => exportToExcel(filteredRisks)}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Export Excel
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      data-ocid="risk.open_modal_button"
                      onClick={openAdd}
                      className="shrink-0"
                      disabled={!hasTenant}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Risk
                    </Button>
                  </span>
                </TooltipTrigger>
                {!hasTenant && (
                  <TooltipContent>
                    You need to be assigned to an organization before adding
                    risks.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </motion.div>

      {/* No-tenant notice */}
      {!tenantLoading && !hasTenant && (
        <div
          data-ocid="risk.no_tenant.error_state"
          className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-6"
        >
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            You have not been assigned to an organization yet. Contact your
            administrator to be assigned to a tenant before adding risks.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Risks",
            value: riskStats ? Number(riskStats.total) : 0,
            color: "text-foreground",
          },
          {
            label: "Critical",
            value: riskStats?.byLevel.find(
              ([l]) => l === RiskLevel.critical,
            )?.[1]
              ? Number(
                  riskStats!.byLevel.find(
                    ([l]) => l === RiskLevel.critical,
                  )![1],
                )
              : 0,
            color: "text-red-400",
          },
          {
            label: "Avg Inherent",
            value: riskStats ? Number(riskStats.avgInherentScore) : 0,
            color: "text-orange-400",
          },
          {
            label: "Avg Residual",
            value: riskStats ? Number(riskStats.avgResidualScore) : 0,
            color: "text-primary",
          },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground mb-1">
                {s.label}
              </p>
              <p className={`text-2xl font-display font-bold ${s.color}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-display">
              Inherent Risk Matrix (3×3)
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Likelihood × Impact
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <InherentRiskMatrix risks={risks ?? []} />
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold font-display">
              Actual Risk Matrix (3×3)
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Residual Risk × Controls Maturity
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ActualRiskMatrix risks={risks ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold font-display">
            Table 10 &ndash; Residual Risk Matrix (Reference)
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Residual Risk Level = Controls Maturity × Inherent Risk Level
          </p>
        </CardHeader>
        <CardContent>
          <ResidualRiskTable10 />
        </CardContent>
      </Card>

      <Card className="bg-card border-border mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold font-display">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block">Risk Level</Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger
                  data-ocid="risk.level.select"
                  className="h-8 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value={RiskLevel.critical}>Critical</SelectItem>
                  <SelectItem value={RiskLevel.high}>High</SelectItem>
                  <SelectItem value={RiskLevel.medium}>Medium</SelectItem>
                  <SelectItem value={RiskLevel.low}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger
                  data-ocid="risk.status.select"
                  className="h-8 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={RiskStatus.open}>Open</SelectItem>
                  <SelectItem value={RiskStatus.inTreatment}>
                    In Treatment
                  </SelectItem>
                  <SelectItem value={RiskStatus.closed}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              RiskLevel.critical,
              RiskLevel.high,
              RiskLevel.medium,
              RiskLevel.low,
            ].map((level) => {
              const count = (risks ?? []).filter(
                (r) => r.riskLevel === level,
              ).length;
              return (
                <button
                  type="button"
                  key={level}
                  onClick={() =>
                    setFilterLevel(filterLevel === level ? "all" : level)
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${riskLevelColor(level)} ${filterLevel === level ? "ring-2 ring-primary/50" : ""}`}
                >
                  {level} ({count})
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Risk Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold font-display">
            Risk Items ({filteredRisks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div data-ocid="risk.loading_state" className="p-6 space-y-3">
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredRisks.length === 0 ? (
            <div data-ocid="risk.empty_state" className="text-center py-16">
              <AlertTriangle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No risks found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try adjusting filters or add a new risk
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="risk.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs w-12">#</TableHead>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Threat Category</TableHead>
                    <TableHead className="text-xs text-center">L</TableHead>
                    <TableHead className="text-xs text-center">I</TableHead>
                    <TableHead className="text-xs text-center">
                      Inherent Risk
                    </TableHead>
                    <TableHead className="text-xs text-center">
                      Residual
                    </TableHead>
                    <TableHead className="text-xs">Level</TableHead>
                    <TableHead className="text-xs">Treatment</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Org</TableHead>
                    <TableHead className="text-xs w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRisks.map((risk, idx) => {
                    const iScore =
                      Number(risk.likelihood) * Number(risk.impact);
                    const iLvl = inherentRiskLevel(iScore);
                    return (
                      <TableRow
                        key={risk.id.toString()}
                        data-ocid={`risk.item.${idx + 1}`}
                        className="border-border hover:bg-muted/20"
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          R-{String(Number(risk.id)).padStart(3, "0")}
                        </TableCell>
                        <TableCell className="text-xs font-medium max-w-[140px] truncate">
                          {risk.title}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {threatLabel(risk.threatCategory)}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {Number(risk.likelihood)}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {Number(risk.impact)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`text-[11px] ${levelBadgeColor(iLvl)}`}
                          >
                            {iLvl.charAt(0).toUpperCase() + iLvl.slice(1)} (
                            {iScore})
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`text-[11px] ${riskScoreColor(Number(risk.residualRiskScore))}`}
                          >
                            {Number(risk.residualRiskScore)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[11px] capitalize ${riskLevelColor(risk.riskLevel)}`}
                          >
                            {risk.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs capitalize text-muted-foreground">
                          {risk.treatment}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[11px] ${statusColor(risk.status)}`}
                          >
                            {risk.status === RiskStatus.inTreatment
                              ? "In Treatment"
                              : risk.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="text-[10px] bg-slate-800/80 text-slate-400 border-slate-700/60 font-mono">
                            {risk.tenantId === 0n
                              ? "Global"
                              : `Org #${Number(risk.tenantId)}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              data-ocid={`risk.edit_button.${idx + 1}`}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEdit(risk)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              data-ocid={`risk.delete_button.${idx + 1}`}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:text-destructive"
                              onClick={() => deleteRisk.mutateAsync(risk.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="risk.dialog"
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingRisk ? "Edit Risk" : "Add New Risk"}
            </DialogTitle>
            <DialogDescription>
              {editingRisk
                ? "Update risk details and assessment"
                : "Define a new risk for the register"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Title */}
            <div>
              <Label className="text-xs">Title *</Label>
              <Input
                data-ocid="risk.input"
                className="mt-1.5 h-8 text-sm"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Unauthorized Data Access"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                data-ocid="risk.textarea"
                className="mt-1.5 text-sm resize-none"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Threat Category */}
              <div>
                <Label className="text-xs">Threat Category</Label>
                <Select
                  value={form.threatCategory}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      threatCategory: v as ThreatCategory,
                    }))
                  }
                >
                  <SelectTrigger
                    data-ocid="risk.select"
                    className="mt-1.5 h-8 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THREAT_OPTIONS.map((t) => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                        className="text-xs"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vulnerability */}
              <div>
                <Label className="text-xs">Vulnerability</Label>
                <Input
                  className="mt-1.5 h-8 text-sm"
                  value={form.vulnerability}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, vulnerability: e.target.value }))
                  }
                />
              </div>

              {/* Likelihood */}
              <div>
                <Label className="text-xs">Likelihood</Label>
                <Select
                  value={String(form.likelihood)}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, likelihood: BigInt(v) }))
                  }
                >
                  <SelectTrigger
                    data-ocid="risk.likelihood.select"
                    className="mt-1.5 h-8 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 – Low Probability</SelectItem>
                    <SelectItem value="2">2 – Medium Probability</SelectItem>
                    <SelectItem value="3">3 – High Probability</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Impact */}
              <div>
                <Label className="text-xs">Impact</Label>
                <Select
                  value={String(form.impact)}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, impact: BigInt(v) }))
                  }
                >
                  <SelectTrigger
                    data-ocid="risk.impact.select"
                    className="mt-1.5 h-8 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 – Low Impact</SelectItem>
                    <SelectItem value="2">2 – Medium Impact</SelectItem>
                    <SelectItem value="3">3 – High Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Inherent Risk (auto-calculated, read-only display as dropdown style) */}
              <div>
                <Label className="text-xs">Inherent Risk Value</Label>
                <Select value={computedInherentLevel} disabled>
                  <SelectTrigger
                    data-ocid="risk.inherent_risk.select"
                    className="mt-1.5 h-8 text-xs opacity-100 cursor-default"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INHERENT_RISK_OPTIONS.map((r) => (
                      <SelectItem
                        key={r.value}
                        value={r.value}
                        className="text-xs"
                      >
                        {r.label} ({r.scoreRange})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Auto-calculated: {Number(form.likelihood)} ×{" "}
                  {Number(form.impact)} = {computedInherentScore}
                </p>
              </div>

              {/* Maturity Level (per Table 9 Controls Assessment) */}
              <div>
                <Label className="text-xs">Controls Maturity Level</Label>
                <Select
                  value={controlMaturity}
                  onValueChange={setControlMaturity}
                >
                  <SelectTrigger
                    data-ocid="risk.maturity.select"
                    className="mt-1.5 h-8 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTROL_MATURITY_OPTIONS.map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="text-xs"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  {
                    CONTROL_MATURITY_OPTIONS.find(
                      (m) => m.value === controlMaturity,
                    )?.description
                  }
                </p>
              </div>

              {/* Treatment */}
              <div>
                <Label className="text-xs">Treatment</Label>
                <Select
                  value={form.treatment}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, treatment: v as RiskTreatment }))
                  }
                >
                  <SelectTrigger
                    data-ocid="risk.treatment.select"
                    className="mt-1.5 h-8 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(RiskTreatment).map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Treatment Owner */}
              <div>
                <Label className="text-xs">Treatment Owner</Label>
                <Input
                  className="mt-1.5 h-8 text-sm"
                  value={form.treatmentOwner}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, treatmentOwner: e.target.value }))
                  }
                />
              </div>

              {/* Due Date */}
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  className="mt-1.5 h-8 text-sm"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status ?? RiskStatus.open}
                  onValueChange={(v) => {
                    setForm((p) => ({ ...p, status: v as RiskStatus }));
                  }}
                >
                  <SelectTrigger
                    data-ocid="risk.status.select"
                    className="mt-1.5 h-8 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="inTreatment">In Treatment</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Treatment Notes */}
            <div>
              <Label className="text-xs">Treatment Notes</Label>
              <Textarea
                className="mt-1.5 text-sm resize-none"
                rows={2}
                value={form.treatmentNotes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, treatmentNotes: e.target.value }))
                }
              />
            </div>

            {/* Live Risk Score Display */}
            <div>
              <Label className="text-xs mb-2 block">
                Risk Score Calculation
              </Label>
              <RiskScoreDisplay
                likelihood={form.likelihood}
                impact={form.impact}
                controlMaturity={controlMaturity}
              />
            </div>

            {/* Mitigation Controls */}
            <div>
              <Label className="text-xs mb-2 block">
                ISO 27001 Annex A Mitigation Controls
                {form.mitigationControls.length > 0 && (
                  <Badge className="ml-2 text-[10px] bg-primary/15 text-primary border-primary/30">
                    {form.mitigationControls.length} selected
                  </Badge>
                )}
              </Label>
              <MitigationControlsSelector
                value={form.mitigationControls}
                onChange={(controls) =>
                  setForm((p) => ({ ...p, mitigationControls: controls }))
                }
              />
            </div>

            {/* Risk Treatment Plan (collapsible) */}
            <Collapsible
              open={treatmentPlanOpen}
              onOpenChange={setTreatmentPlanOpen}
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  data-ocid="risk.toggle"
                  className="flex items-center gap-2 w-full text-left p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  {treatmentPlanOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs font-medium text-foreground">
                    Risk Treatment Plan
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {treatmentPlanOpen
                      ? "Collapse"
                      : "Expand to add treatment plan"}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 grid sm:grid-cols-2 gap-4 p-3 rounded-lg bg-muted/20 border border-border">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">
                      Treatment Plan Description
                    </Label>
                    <Textarea
                      data-ocid="risk.textarea"
                      className="mt-1.5 text-sm resize-none"
                      rows={3}
                      placeholder="Describe the risk treatment approach and actions..."
                      value={form.treatmentPlanDescription}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          treatmentPlanDescription: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Treatment Plan Owner</Label>
                    <Input
                      data-ocid="risk.input"
                      className="mt-1.5 h-8 text-sm"
                      placeholder="Owner name or team"
                      value={form.treatmentPlanOwner}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          treatmentPlanOwner: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div />
                  <div>
                    <Label className="text-xs">Target Date</Label>
                    <Input
                      type="date"
                      className="mt-1.5 h-8 text-sm"
                      value={form.treatmentPlanTargetDate}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          treatmentPlanTargetDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Review Date</Label>
                    <Input
                      type="date"
                      className="mt-1.5 h-8 text-sm"
                      value={form.treatmentPlanReviewDate}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          treatmentPlanReviewDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button
              data-ocid="risk.cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="risk.submit_button"
              onClick={handleSubmit}
              disabled={isPending || !form.title.trim()}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingRisk ? "Update Risk" : "Add Risk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
