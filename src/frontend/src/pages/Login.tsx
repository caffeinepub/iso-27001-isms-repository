import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function Login() {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    { icon: FileText, text: "All mandatory ISO 27001:2022 documents" },
    { icon: CheckCircle2, text: "Track compliance status per clause" },
    { icon: Lock, text: "Role-based access control" },
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
            ISO 27001 ISMS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Information Security Management System
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
              Secured with Internet Identity
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
