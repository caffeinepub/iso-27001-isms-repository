import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { WordMark } from "../components/WordMark";
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
  { id: "nistcsf", name: "NIST CSF 2.0", desc: "NIST Cybersecurity Framework" },
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

interface TenantOnboardingProps {
  userId: string;
  companyName: string;
  onComplete: () => void;
}

export function TenantOnboarding({
  userId,
  companyName: initCompany,
  onComplete,
}: TenantOnboardingProps) {
  const { actor } = useActor();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState(initCompany);
  const [industry, setIndustry] = useState("Technology");
  const [description, setDescription] = useState("");
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([
    "iso27001",
  ]);
  const [loading, setLoading] = useState(false);

  const progress = (step / 3) * 100;

  const toggleFw = (id: string) => {
    setSelectedFrameworks((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const handleComplete = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const fn = (actor as any).completeTenantOnboarding;
      if (typeof fn === "function") {
        await fn.call(actor, userId, companyName, industry, selectedFrameworks);
      }
      toast.success("Welcome to CybXSan GRC Platform!");
      onComplete();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Setup failed: ${msg}`);
      // Still proceed even if backend call fails
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8 gap-3"
        >
          <WordMark size="lg" />
          <p className="text-xs text-muted-foreground">Organization Setup</p>
          <button
            type="button"
            onClick={onComplete}
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors mt-1"
          >
            Skip for now →
          </button>
        </motion.div>

        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress
            value={progress}
            className="h-1.5"
            data-ocid="onboarding.progress"
          />
          <div className="flex justify-between text-[11px]">
            {["Company Profile", "Compliance", "Welcome"].map((label, i) => (
              <span
                key={label}
                className={
                  step > i + 1
                    ? "text-primary"
                    : step === i + 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                }
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
          >
            {step === 1 && (
              <Card
                className="bg-card border-border"
                data-ocid="onboarding.step1.card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold font-display">
                      Company Profile
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tell us about your organization to personalize your GRC
                    experience.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company Name</Label>
                    <Input
                      data-ocid="onboarding.company_name.input"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corporation"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger
                        data-ocid="onboarding.industry.select"
                        className="text-sm"
                      >
                        <SelectValue />
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
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Brief Description{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      data-ocid="onboarding.description.input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What your organization does..."
                      className="text-sm"
                    />
                  </div>
                  <Button
                    data-ocid="onboarding.step1.primary_button"
                    className="w-full"
                    disabled={!companyName.trim()}
                    onClick={() => setStep(2)}
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card
                className="bg-card border-border"
                data-ocid="onboarding.step2.card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold font-display">
                      Compliance Frameworks
                    </CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Which compliance frameworks apply to your organization?
                    (Select at least one)
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    className="grid grid-cols-1 gap-2"
                    data-ocid="onboarding.frameworks.list"
                  >
                    {FRAMEWORKS.map((fw, idx) => {
                      const selected = selectedFrameworks.includes(fw.id);
                      return (
                        <label
                          key={fw.id}
                          htmlFor={`ob-fw-${fw.id}`}
                          data-ocid={`onboarding.frameworks.item.${idx + 1}`}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? "bg-primary/10 border-primary/30"
                              : "bg-muted/20 border-border hover:bg-muted/40"
                          }`}
                        >
                          <Checkbox
                            id={`ob-fw-${fw.id}`}
                            checked={selected}
                            onCheckedChange={() => toggleFw(fw.id)}
                          />
                          <div className="flex-1">
                            <p className="text-xs font-semibold">{fw.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {fw.desc}
                            </p>
                          </div>
                          {selected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      data-ocid="onboarding.step2.back_button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      data-ocid="onboarding.step2.primary_button"
                      className="flex-1"
                      disabled={selectedFrameworks.length === 0}
                      onClick={() => setStep(3)}
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card
                className="bg-card border-border"
                data-ocid="onboarding.step3.card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold font-display">
                      You're all set!
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Company</span>
                      <span className="font-semibold">{companyName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-semibold">{industry}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Active Frameworks
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFrameworks.map((id) => {
                          const fw = FRAMEWORKS.find((f) => f.id === id);
                          return (
                            <Badge
                              key={id}
                              className="text-[10px] bg-primary/15 text-primary border-primary/30"
                            >
                              {fw?.name ?? id}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    data-ocid="onboarding.complete.primary_button"
                    className="w-full"
                    onClick={handleComplete}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Setting up...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" /> Enter Dashboard
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
