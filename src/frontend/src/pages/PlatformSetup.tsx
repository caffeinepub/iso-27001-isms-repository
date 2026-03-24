import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Key, Loader2, Shield, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { WordMark } from "../components/WordMark";
import { useActor } from "../hooks/useActor";

interface PlatformSetupProps {
  onSetupComplete: () => void;
}

export function PlatformSetup({ onSetupComplete }: PlatformSetupProps) {
  const { actor } = useActor();
  const [step, setStep] = useState(1);
  const [activationKey, setActivationKey] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClaim = async () => {
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      // Try claimPlatformAdminWithKey first
      const fn = (actor as any).claimPlatformAdminWithKey;
      if (typeof fn === "function") {
        const result = await fn.call(actor, activationKey);
        if (result && typeof result === "object" && "err" in result) {
          setError(result.err as string);
          setLoading(false);
          return;
        }
      } else {
        // Fallback: use _initializeAccessControlWithSecret if no key required
        const initFn = (actor as any)._initializeAccessControlWithSecret;
        if (typeof initFn === "function" && !activationKey) {
          await initFn.call(actor, "");
        }
      }
      setStep(2);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // If error mentions "already claimed" or "already admin", proceed
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("admin")
      ) {
        setStep(2);
      } else {
        setError(`Failed to claim admin: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const fn = (actor as any).setLicenseKey;
      if (typeof fn === "function") {
        await fn.call(actor, licenseKey);
      }
      onSetupComplete();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to save key: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8 gap-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <WordMark size="lg" />
          <p className="text-xs text-muted-foreground text-center">
            First-time platform setup
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          {step === 1 && (
            <Card
              className="bg-card border-border"
              data-ocid="platform_setup.dialog"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold font-display">
                    Claim Platform Administrator
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your activation key to become the Platform Super Admin.
                  This can only be done once.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Activation Key</Label>
                  <Input
                    data-ocid="platform_setup.input"
                    type="password"
                    placeholder="Enter activation key..."
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                    className="text-sm"
                  />
                </div>
                <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground">
                      <strong>Fresh deployment?</strong> If no activation key
                      has been set yet, you can proceed without a key. Contact
                      support if you need your activation key.
                    </p>
                  </div>
                </div>
                {error && (
                  <p
                    data-ocid="platform_setup.error_state"
                    className="text-xs text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg"
                  >
                    {error}
                  </p>
                )}
                <Button
                  data-ocid="platform_setup.primary_button"
                  className="w-full"
                  onClick={handleClaim}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Claiming...
                    </>
                  ) : (
                    <>Claim Platform Admin Access</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card
              className="bg-card border-border"
              data-ocid="platform_setup.step2.dialog"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <CardTitle className="text-sm font-semibold font-display">
                    You are now Platform Administrator
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Optionally set an activation key so future deployments require
                  authentication to claim admin access.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Activation Key (optional)</Label>
                  <Input
                    data-ocid="platform_setup.license_key.input"
                    type="password"
                    placeholder="Set activation key for future deployments..."
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="text-sm"
                  />
                </div>
                {error && (
                  <p
                    data-ocid="platform_setup.step2.error_state"
                    className="text-xs text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-lg"
                  >
                    {error}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    data-ocid="platform_setup.skip_button"
                    variant="outline"
                    className="flex-1"
                    onClick={onSetupComplete}
                    disabled={loading}
                  >
                    Skip for now
                  </Button>
                  <Button
                    data-ocid="platform_setup.save_button"
                    className="flex-1"
                    onClick={handleSaveKey}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>Save &amp; Enter Dashboard</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
