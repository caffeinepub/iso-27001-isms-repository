import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  FileText,
  Info,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { WordMark } from "../components/WordMark";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginProps {
  onNavigateTenantLogin: () => void;
}

export function Login({ onNavigateTenantLogin }: LoginProps) {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    {
      icon: FileText,
      text: "All mandatory ISMS documents",
      iconBg: "bg-cyan-500/15",
      iconColor: "text-cyan-400",
    },
    {
      icon: Lock,
      text: "Risk Evaluation Register with ISMS Risk Methodology",
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-400",
    },
    {
      icon: CheckCircle2,
      text: "Track compliance status per framework",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
    },
  ];

  const steps = [
    {
      step: "1",
      text: 'Click "Admin Sign In" below',
      color: "from-cyan-500 to-blue-500",
    },
    {
      step: "2",
      text: "A new window opens — choose to create or use an existing Internet Identity",
      color: "from-blue-500 to-violet-500",
    },
    {
      step: "3",
      text: "Authenticate using your device (fingerprint, Face ID, or security key)",
      color: "from-violet-500 to-fuchsia-500",
    },
    {
      step: "4",
      text: "You will be redirected back and logged in automatically",
      color: "from-fuchsia-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-cyan-500/20 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-violet-600/20 via-purple-700/10 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed top-[40%] right-[5%] w-[300px] h-[300px] rounded-full bg-gradient-radial from-fuchsia-500/10 via-pink-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed inset-0 sidebar-grid opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="mb-1">
            <WordMark size="lg" />
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-0.5">
            GRC Platform
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Governance, Risk &amp; Compliance
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="login-card rounded-2xl p-6 space-y-5"
        >
          {/* Features */}
          <div className="space-y-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${f.iconBg} flex items-center justify-center shrink-0 border border-white/5`}
                  >
                    <Icon className={`w-4 h-4 ${f.iconColor}`} />
                  </div>
                  <span className="text-sm text-slate-300">{f.text}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="login-divider" />

          {/* Login Instructions */}
          <div className="login-steps-box rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                Admin login
              </span>
            </div>
            <ol className="space-y-2.5">
              {steps.map((s, i) => (
                <motion.li
                  key={s.step}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.55 + i * 0.07 }}
                  className="flex items-start gap-2.5"
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-gradient-to-br ${s.color} text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}
                  >
                    {s.step}
                  </span>
                  <span className="text-xs text-slate-400 leading-relaxed">
                    {s.text}
                  </span>
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Admin CTA */}
          <div className="space-y-3 pt-1">
            <Button
              data-ocid="auth.login_button"
              className="w-full login-btn font-semibold h-11 text-sm rounded-xl"
              onClick={login}
              disabled={isLoggingIn}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {isLoggingIn ? "Connecting..." : "Admin Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full login-divider" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[11px] text-slate-500 bg-[oklch(0.14_0.02_240)]">
                  or
                </span>
              </div>
            </div>

            <Button
              data-ocid="auth.tenant_login_button"
              variant="outline"
              className="w-full h-11 text-sm rounded-xl border-slate-700/60 bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 hover:border-cyan-500/40 font-semibold transition-all"
              onClick={onNavigateTenantLogin}
            >
              <Users className="mr-2 h-4 w-4 text-cyan-400" />
              Tenant User Login
            </Button>
            <p className="text-center text-[11px] text-slate-500">
              Secured with Internet Identity — no password required for admin
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600 mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-400 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}

// Keep unused imports satisfied
const _unused = ShieldCheck;
void _unused;
