import { Button } from "@/components/ui/button";
import { KeyRound, LogOut, Settings } from "lucide-react";
import { motion } from "motion/react";
import cybxsanLogo from "../assets/cybxsan-logo.png";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function ClaimAdmin() {
  const { clear } = useInternetIdentity();
  const currentUrl = window.location.href.split("?")[0];
  const exampleUrl = `${currentUrl}?caffeineAdminToken=YOUR_TOKEN`;

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-amber-500/15 via-orange-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-violet-600/20 via-purple-700/10 to-transparent blur-3xl pointer-events-none" />

      {/* Background grid */}
      <div className="fixed inset-0 sidebar-grid opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mx-auto mb-4">
            <div className="p-1 rounded-2xl login-logo-ring">
              <img
                src={cybxsanLogo}
                alt="CybXSan Logo"
                className="h-16 w-auto object-contain rounded-xl"
              />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold login-title-gradient">
            Admin Setup Required
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            One-time administrator configuration
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="login-card rounded-2xl p-6 space-y-5"
        >
          {/* Icon + explanation */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 leading-snug">
                Your account needs to be configured as the platform
                administrator.
              </p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                To complete setup, you need to visit this application with your
                Caffeine Admin Token added to the URL.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="login-divider" />

          {/* Instructions */}
          <div className="login-steps-box rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                How to claim admin access
              </span>
            </div>
            <ol className="space-y-3">
              <motion.li
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.4 }}
                className="flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Open your{" "}
                  <a
                    href="https://caffeine.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    Caffeine project settings
                  </a>{" "}
                  and copy your Admin Token.
                </span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.47 }}
                className="flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Add{" "}
                  <code className="text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded text-[11px]">
                    ?caffeineAdminToken=YOUR_TOKEN
                  </code>{" "}
                  to the end of the URL below and open it in your browser.
                </span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.54 }}
                className="flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-xs text-slate-400 leading-relaxed">
                  Sign in again — your account will be automatically promoted to
                  administrator.
                </span>
              </motion.li>
            </ol>
          </div>

          {/* Current URL reference */}
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">
              Your current URL (for reference):
            </p>
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2">
              <p className="text-[11px] text-slate-400 font-mono break-all leading-relaxed">
                {currentUrl}
              </p>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">
              Example with token appended:
            </p>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              <p className="text-[11px] text-amber-400/80 font-mono break-all leading-relaxed">
                {exampleUrl}
              </p>
            </div>
          </div>

          {/* Sign out */}
          <div className="pt-1">
            <Button
              data-ocid="claim-admin.button"
              variant="outline"
              className="w-full h-10 text-sm rounded-xl border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-600 bg-transparent"
              onClick={clear}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out &amp; Try Different Account
            </Button>
            <p className="text-center text-[11px] text-slate-600 mt-3">
              This screen only appears before the first admin is set up.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
