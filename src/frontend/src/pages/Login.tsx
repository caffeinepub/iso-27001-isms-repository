import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Info, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function Login() {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    { icon: FileText, text: "All mandatory ISO 27001:2022 documents" },
    { icon: CheckCircle2, text: "Track compliance status per clause" },
    { icon: Lock, text: "Role-based access control" },
  ];

  const steps = [
    { step: "1", text: 'Click "Sign In to Continue" below' },
    {
      step: "2",
      text: "A new window opens — choose to create or use an existing Internet Identity",
    },
    {
      step: "3",
      text: "Authenticate using your device (fingerprint, Face ID, or security key)",
    },
    {
      step: "4",
      text: "You will be redirected back and logged in automatically",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 sidebar-grid opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            CybXSan GRC Platform
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Governance, Risk &amp; Compliance
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="space-y-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/80">{f.text}</span>
                </div>
              );
            })}
          </div>

          {/* Login Instructions */}
          <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                How to sign in
              </span>
            </div>
            <ol className="space-y-2">
              {steps.map((s) => (
                <li key={s.step} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {s.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-border pt-4">
            <Button
              data-ocid="auth.login_button"
              className="w-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-medium"
              onClick={login}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Connecting..." : "Sign In to Continue"}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-3">
              Secured with Internet Identity — no password required
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
