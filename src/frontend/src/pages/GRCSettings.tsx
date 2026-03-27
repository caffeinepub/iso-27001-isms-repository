import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Loader2,
  Settings,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTenantUser } from "../contexts/TenantUserContext";
import { useActor } from "../hooks/useActor";

const FRAMEWORKS = [
  {
    id: "iso27001",
    name: "ISO 27001:2022",
    desc: "Information Security Management",
  },
  { id: "soc2", name: "SOC 2 Type II", desc: "Service Organization Controls" },
  { id: "gdpr", name: "GDPR", desc: "General Data Protection Regulation" },
  {
    id: "pcidss",
    name: "PCI DSS v4.0",
    desc: "Payment Card Industry Data Security",
  },
  { id: "nistcsf", name: "NIST CSF 2.0", desc: "Cybersecurity Framework" },
  { id: "iso9001", name: "ISO 9001:2015", desc: "Quality Management Systems" },
];

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Government",
  "Education",
  "Other",
];

interface TenantSettings {
  domain: string;
  companyName: string;
  industry: string;
  activeFrameworks: string[];
  riskAppetite: {
    lowThreshold: number;
    mediumThreshold: number;
    highThreshold: number;
  };
  onboardingDone: boolean;
}

export function GRCSettings() {
  const { actor } = useActor();
  const { tenantUser } = useTenantUser();
  const domain = tenantUser?.domain ?? "global";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TenantSettings>({
    domain,
    companyName: tenantUser?.companyName ?? "",
    industry: "Technology",
    activeFrameworks: ["iso27001"],
    riskAppetite: { lowThreshold: 3, mediumThreshold: 6, highThreshold: 9 },
    onboardingDone: true,
  });

  useEffect(() => {
    if (!actor || !domain) return;
    setLoading(true);
    const fn = (actor as any).getTenantSettings;
    if (typeof fn === "function") {
      fn.call(actor, domain)
        .then((result: TenantSettings | null) => {
          if (result) {
            setSettings({
              ...result,
              riskAppetite: result.riskAppetite ?? {
                lowThreshold: 3,
                mediumThreshold: 6,
                highThreshold: 9,
              },
              activeFrameworks: result.activeFrameworks ?? ["iso27001"],
            });
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [actor, domain]);

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      if (tenantUser) {
        // Tenant user: use domain-verified save
        const fn = (actor as any).saveTenantSettingsAsTenantUser;
        if (typeof fn === "function") {
          await fn.call(actor, tenantUser.id, { ...settings, domain });
        }
      } else {
        // Platform admin: use admin override
        const fn = (actor as any).saveTenantSettingsByAdmin;
        const fallback = (actor as any).saveTenantSettings;
        if (typeof fn === "function") {
          await fn.call(actor, { ...settings, domain });
        } else if (typeof fallback === "function") {
          await fallback.call(actor, { ...settings, domain });
        }
      }
      toast.success("GRC settings saved successfully");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Failed to save settings: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleFramework = (fwId: string) => {
    setSettings((prev) => ({
      ...prev,
      activeFrameworks: prev.activeFrameworks.includes(fwId)
        ? prev.activeFrameworks.filter((f) => f !== fwId)
        : [...prev.activeFrameworks, fwId],
    }));
  };

  const { lowThreshold, mediumThreshold } = settings.riskAppetite;

  const getRiskBand = (score: number) => {
    if (score <= lowThreshold) return { label: "Low", color: "bg-emerald-500" };
    if (score <= mediumThreshold)
      return { label: "Medium", color: "bg-amber-500" };
    return { label: "High / Critical", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((k) => (
          <Skeleton key={k} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div data-ocid="grc_settings.page" className="p-3 sm:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Settings className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">
              GRC Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Customize compliance, risk, and governance for{" "}
              {settings.companyName || domain}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-5">
        {/* Section 1: Organization Profile */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold font-display">
                  Organization Profile
                </CardTitle>
              </div>
            </CardHeader>
            <Separator className="bg-border" />
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Name</Label>
                  <Input
                    data-ocid="grc_settings.company_name.input"
                    value={settings.companyName}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        companyName: e.target.value,
                      }))
                    }
                    placeholder="Your company name"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Industry</Label>
                  <Select
                    value={settings.industry}
                    onValueChange={(v) =>
                      setSettings((p) => ({ ...p, industry: v }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="grc_settings.industry.select"
                      className="text-sm"
                    >
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 2: Active Compliance Frameworks */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold font-display">
                  Active Compliance Frameworks
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Select the compliance frameworks relevant to your organization.
              </p>
            </CardHeader>
            <Separator className="bg-border" />
            <CardContent className="pt-4">
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                data-ocid="grc_settings.frameworks.list"
              >
                {FRAMEWORKS.map((fw, idx) => {
                  const active = settings.activeFrameworks.includes(fw.id);
                  return (
                    <label
                      key={fw.id}
                      htmlFor={`fw-${fw.id}`}
                      data-ocid={`grc_settings.frameworks.item.${idx + 1}`}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        active
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted/20 border-border hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        id={`fw-${fw.id}`}
                        data-ocid={`grc_settings.frameworks.checkbox.${idx + 1}`}
                        checked={active}
                        onCheckedChange={() => toggleFramework(fw.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {fw.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {fw.desc}
                        </p>
                      </div>
                      {active && (
                        <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30">
                          Active
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 3: Risk Appetite Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold font-display">
                  Risk Appetite Configuration
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Define your organization's risk score thresholds (1–9 scale).
              </p>
            </CardHeader>
            <Separator className="bg-border" />
            <CardContent className="pt-4 space-y-5">
              {/* Visual band */}
              <div className="rounded-lg overflow-hidden h-6 flex">
                <div
                  className="bg-emerald-500/80 flex items-center justify-center"
                  style={{
                    width: `${(settings.riskAppetite.lowThreshold / 9) * 100}%`,
                  }}
                >
                  <span className="text-[10px] font-bold text-white">Low</span>
                </div>
                <div
                  className="bg-amber-500/80 flex items-center justify-center"
                  style={{
                    width: `${((settings.riskAppetite.mediumThreshold - settings.riskAppetite.lowThreshold) / 9) * 100}%`,
                  }}
                >
                  <span className="text-[10px] font-bold text-white">Med</span>
                </div>
                <div className="bg-red-500/80 flex items-center justify-center flex-1">
                  <span className="text-[10px] font-bold text-white">
                    High/Critical
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Low Risk Threshold</Label>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ≤ {settings.riskAppetite.lowThreshold}
                    </span>
                  </div>
                  <Slider
                    data-ocid="grc_settings.low_threshold.input"
                    min={1}
                    max={8}
                    step={1}
                    value={[settings.riskAppetite.lowThreshold]}
                    onValueChange={([v]) =>
                      setSettings((p) => ({
                        ...p,
                        riskAppetite: {
                          ...p.riskAppetite,
                          lowThreshold: v,
                          mediumThreshold: Math.max(
                            v + 1,
                            p.riskAppetite.mediumThreshold,
                          ),
                        },
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs">Medium Risk Threshold</Label>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ≤ {settings.riskAppetite.mediumThreshold}
                    </span>
                  </div>
                  <Slider
                    data-ocid="grc_settings.medium_threshold.input"
                    min={settings.riskAppetite.lowThreshold + 1}
                    max={9}
                    step={1}
                    value={[settings.riskAppetite.mediumThreshold]}
                    onValueChange={([v]) =>
                      setSettings((p) => ({
                        ...p,
                        riskAppetite: {
                          ...p.riskAppetite,
                          mediumThreshold: v,
                          highThreshold: 9,
                        },
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((score) => {
                  const band = getRiskBand(score);
                  return (
                    <div
                      key={score}
                      className="flex items-center gap-1.5 p-2 rounded bg-muted/20 border border-border"
                    >
                      <span className={`w-2 h-2 rounded-full ${band.color}`} />
                      <span className="text-[11px] font-mono">{score}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {band.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            data-ocid="grc_settings.save_button"
            className="w-full sm:w-auto"
            onClick={handleSave}
            disabled={saving || settings.activeFrameworks.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Save GRC Settings
              </>
            )}
          </Button>
          {settings.activeFrameworks.length === 0 && (
            <p className="text-xs text-destructive mt-2">
              Please select at least one compliance framework.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
