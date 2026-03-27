import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Key, LogOut, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { WordMark } from "../components/WordMark";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type ClaimState = "idle" | "loading" | "success" | "error";

export function ClaimAdmin() {
  const { clear } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [activationKey, setActivationKey] = useState("");
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClaim() {
    if (!activationKey.trim() || !actor) return;
    setClaimState("loading");
    setErrorMsg("");
    try {
      const result = await (actor as any).claimPlatformAdminWithKey(
        activationKey.trim(),
      );
      if (result && "err" in result) {
        setErrorMsg(result.err as string);
        setClaimState("error");
        return;
      }
      // Invalidate all role queries so the app re-checks admin status
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["isAdmin"] }),
        queryClient.invalidateQueries({ queryKey: ["isAdminAssigned"] }),
        queryClient.invalidateQueries({ queryKey: ["isApproved"] }),
        queryClient.invalidateQueries({ queryKey: ["callerRole"] }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["isAdmin"] }),
        queryClient.refetchQueries({ queryKey: ["isAdminAssigned"] }),
        queryClient.refetchQueries({ queryKey: ["isApproved"] }),
      ]);
      setClaimState("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already assigned")) {
        setErrorMsg(
          "Platform admin already assigned. Contact your system administrator.",
        );
      } else if (msg.includes("Invalid") || msg.includes("license")) {
        setErrorMsg("Invalid activation key. Please check and try again.");
      } else {
        setErrorMsg("Activation failed. Please try again.");
      }
      setClaimState("error");
    }
  }

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-amber-500/15 via-orange-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-violet-600/20 via-purple-700/10 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed inset-0 sidebar-grid opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10"
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
          <h2 className="text-base font-semibold text-slate-300 mt-1">
            Platform Admin Activation
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Enter your activation key to claim platform administrator access
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="login-card rounded-2xl p-6 space-y-5"
        >
          {claimState === "success" ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-sm font-semibold text-slate-200 text-center">
                Platform Admin access granted!
              </p>
              <p className="text-xs text-slate-400 text-center">
                Loading your administrator dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* Icon + explanation */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200 leading-snug">
                    Enter your platform activation key to claim administrator
                    access.
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    The activation key is provided by your platform provider.
                    This can only be claimed once -- the first user to enter the
                    correct key becomes the Platform Admin.
                  </p>
                </div>
              </div>

              <div className="login-divider" />

              {/* Activation key form */}
              <div className="space-y-3">
                <label
                  htmlFor="activation-key"
                  className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Activation Key
                </label>
                <Input
                  id="activation-key"
                  type="text"
                  placeholder="Enter your activation key"
                  value={activationKey}
                  onChange={(e) => {
                    setActivationKey(e.target.value);
                    setClaimState("idle");
                    setErrorMsg("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                  className="bg-slate-800/60 border-slate-600/50 text-slate-200 placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20"
                />
                {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
                <Button
                  onClick={handleClaim}
                  disabled={claimState === "loading" || !activationKey.trim()}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold"
                >
                  {claimState === "loading"
                    ? "Verifying..."
                    : "Activate Admin Access"}
                </Button>
              </div>
            </>
          )}
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-4"
        >
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
