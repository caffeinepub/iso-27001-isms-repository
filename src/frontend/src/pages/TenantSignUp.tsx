import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { WordMark } from "../components/WordMark";
import { useActor } from "../hooks/useActor";

interface TenantSignUpProps {
  onNavigateLogin: () => void;
  onNavigateBack: () => void;
}

export function TenantSignUp({
  onNavigateLogin,
  onNavigateBack,
}: TenantSignUpProps) {
  const { actor } = useActor();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const domainTrimmed = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    if (!domainTrimmed || !domainTrimmed.includes(".")) {
      setError("Please enter a valid domain (e.g. company.com).");
      return;
    }

    setLoading(true);
    try {
      const result = await actor.registerTenantUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        companyName: companyName.trim(),
        domain: domainTrimmed,
      });

      // RegistrationResult enum values
      if (result === "ok") {
        setSuccess(true);
      } else if (result === "userAlreadyExists") {
        setError("An account with this email already exists. Please sign in.");
      } else if (result === "domainAlreadyRegistered") {
        setError(
          "This domain is already registered with another organization.",
        );
      } else {
        setError(
          "Invalid information. Please check your details and try again.",
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to connect to the platform. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-cyan-500/20 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-violet-600/20 via-purple-700/10 to-transparent blur-3xl pointer-events-none" />
        <div className="fixed inset-0 sidebar-grid opacity-20 pointer-events-none" />

        <motion.div
          data-ocid="tenant_signup.success_state"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm z-10 text-center"
        >
          <div className="login-card rounded-2xl p-8 space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-100">
                Account Created!
              </h2>
              <p className="text-sm text-slate-400">
                Your organization has been registered. An admin will review and
                approve your account shortly.
              </p>
            </div>
            <Button
              data-ocid="tenant_signup.link"
              onClick={onNavigateLogin}
              className="w-full login-btn font-semibold h-11 text-sm rounded-xl"
            >
              Go to Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">
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
          <WordMark size="lg" />
          <p className="text-sm font-semibold text-slate-300 mt-0.5">
            GRC Platform
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Create Tenant Account</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="login-card rounded-2xl p-6 space-y-4"
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-100">
              Register your organization
            </h2>
            <p className="text-xs text-slate-400">
              Create a tenant account for your company
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            data-ocid="tenant_signup.form"
          >
            {/* Full Name */}
            <div className="space-y-1">
              <Label htmlFor="su-name" className="text-xs text-slate-300">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="su-name"
                  data-ocid="tenant_signup.input"
                  type="text"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 h-10 text-sm"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="su-email" className="text-xs text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="su-email"
                  data-ocid="tenant_signup.input"
                  type="email"
                  placeholder="jane@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 h-10 text-sm"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-1">
              <Label htmlFor="su-company" className="text-xs text-slate-300">
                Company Name
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="su-company"
                  data-ocid="tenant_signup.input"
                  type="text"
                  placeholder="Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="pl-9 bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 h-10 text-sm"
                  required
                />
              </div>
            </div>

            {/* Domain */}
            <div className="space-y-1">
              <Label htmlFor="su-domain" className="text-xs text-slate-300">
                Company Domain
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="su-domain"
                  data-ocid="tenant_signup.input"
                  type="text"
                  placeholder="acme.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="pl-9 bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 h-10 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="su-password" className="text-xs text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="su-password"
                  data-ocid="tenant_signup.input"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 h-10 text-sm"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="su-confirm" className="text-xs text-slate-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="su-confirm"
                  data-ocid="tenant_signup.input"
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 h-10 text-sm"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <motion.p
                data-ocid="tenant_signup.error_state"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button
              data-ocid="tenant_signup.submit_button"
              type="submit"
              disabled={loading || !actor}
              className="w-full login-btn font-semibold h-11 text-sm rounded-xl mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                  account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="login-divider" />

          <div className="space-y-2 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <button
                data-ocid="tenant_signup.link"
                type="button"
                onClick={onNavigateLogin}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                Sign In
              </button>
            </p>
            <p className="text-xs text-slate-600">
              <button
                data-ocid="tenant_signup.link"
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
          © {new Date().getFullYear()} CybXSan. Enterprise GRC Platform.
        </p>
      </motion.div>
    </div>
  );
}
