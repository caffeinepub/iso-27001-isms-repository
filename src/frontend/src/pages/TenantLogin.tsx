import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { WordMark } from "../components/WordMark";
import { useActor } from "../hooks/useActor";

interface TenantLoginProps {
  onNavigateSignUp: () => void;
  onNavigateBack: () => void;
  onLoginSuccess: (user: object) => void;
}

export function TenantLogin({
  onNavigateSignUp,
  onNavigateBack,
  onLoginSuccess,
}: TenantLoginProps) {
  const { actor } = useActor();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setError("");
    setLoading(true);
    try {
      const result = await actor.tenantLogin(email.trim(), password);
      if (result.__kind__ === "ok") {
        localStorage.setItem("tenantUser", JSON.stringify(result.ok));
        onLoginSuccess(result.ok);
      } else if (
        result.__kind__ === "userNotFound" ||
        result.__kind__ === "invalidEmail"
      ) {
        setError("No account found with that email address.");
      } else if (result.__kind__ === "invalidPassword") {
        setError("Incorrect password. Please try again.");
      } else if (result.__kind__ === "notApproved") {
        setError("Your account is pending admin approval. Please wait.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (err) {
      console.error("Tenant login error:", err);
      setError("Failed to connect to the platform. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-cyan-500/20 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-violet-600/20 via-purple-700/10 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed inset-0 sidebar-grid opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        {/* Wordmark */}
        <div className="text-center mb-8">
          <div className="mb-1">
            <WordMark size="lg" />
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-0.5">
            GRC Platform
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Tenant Sign In</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="login-card rounded-2xl p-6 space-y-5"
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-100">
              Welcome back
            </h2>
            <p className="text-xs text-slate-400">
              Sign in with your organization credentials
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-ocid="tenant_login.form"
          >
            <div className="space-y-1.5">
              <Label htmlFor="tenant-email" className="text-xs text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="tenant-email"
                  data-ocid="tenant_login.input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 h-10 text-sm"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="tenant-password"
                className="text-xs text-slate-300"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="tenant-password"
                  data-ocid="tenant_login.input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 h-10 text-sm"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <motion.p
                data-ocid="tenant_login.error_state"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button
              data-ocid="tenant_login.submit_button"
              type="submit"
              disabled={loading || !actor}
              className="w-full login-btn font-semibold h-11 text-sm rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="login-divider" />

          <div className="space-y-2 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <button
                data-ocid="tenant_login.link"
                type="button"
                onClick={onNavigateSignUp}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                Sign Up
              </button>
            </p>
            <p className="text-xs text-slate-600">
              <button
                data-ocid="tenant_login.link"
                type="button"
                onClick={onNavigateBack}
                className="text-slate-500 hover:text-slate-400 transition-colors"
              >
                ← Back to main login
              </button>
            </p>
          </div>
        </motion.div>

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
