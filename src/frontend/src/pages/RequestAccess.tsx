import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  ShieldX,
  UserCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { WordMark } from "../components/WordMark";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRequestApproval } from "../hooks/useQueries";

type RequestState = "not_requested" | "pending" | "rejected";

interface RequestAccessProps {
  requestState: RequestState;
  onRequested?: () => void;
}

export function RequestAccess({
  requestState,
  onRequested,
}: RequestAccessProps) {
  const { clear } = useInternetIdentity();
  const requestApproval = useRequestApproval();

  const handleRequest = async () => {
    await requestApproval.mutateAsync();
    onRequested?.();
  };

  const borderColor =
    requestState === "rejected"
      ? "oklch(0.55 0.22 25 / 0.5)"
      : requestState === "pending"
        ? "oklch(0.75 0.18 85 / 0.4)"
        : "oklch(0.6 0.22 230 / 0.4)";

  const glowColor =
    requestState === "rejected"
      ? "0 0 40px oklch(0.55 0.22 25 / 0.12)"
      : requestState === "pending"
        ? "0 0 40px oklch(0.75 0.18 85 / 0.1)"
        : "0 0 40px oklch(0.6 0.22 230 / 0.12)";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-violet-500/12 blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[25vw] h-[25vw] rounded-full bg-fuchsia-500/8 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Wordmark */}
        <div className="text-center mb-6">
          <WordMark size="lg" />
          <p className="text-xs text-muted-foreground mt-1">GRC Platform</p>
        </div>

        <Card
          className="bg-card/80 backdrop-blur-sm border-2"
          style={{ borderColor, boxShadow: glowColor }}
        >
          <CardContent className="p-8">
            {requestState === "not_requested" && (
              <NotRequestedState
                onRequest={handleRequest}
                isPending={requestApproval.isPending}
              />
            )}
            {requestState === "pending" && <PendingState />}
            {requestState === "rejected" && <RejectedState />}

            <div className="mt-6 pt-5 border-t border-border/50">
              <button
                type="button"
                data-ocid="access.sign_out.button"
                onClick={clear}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}

function NotRequestedState({
  onRequest,
  isPending,
}: {
  onRequest: () => void;
  isPending: boolean;
}) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto mb-5"
      >
        <UserCheck className="w-8 h-8 text-cyan-400" />
      </motion.div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">
        Request Access
      </h1>
      <p className="text-sm text-muted-foreground/70 mb-6">
        Your account needs administrator approval to access this platform.
        Submit a request and you&apos;ll be notified once approved.
      </p>
      <Button
        data-ocid="access.request.primary_button"
        onClick={onRequest}
        disabled={isPending}
        className="w-full h-11 font-semibold text-sm"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.6 0.22 230), oklch(0.55 0.28 295))",
          color: "white",
          border: "none",
        }}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting Request...
          </>
        ) : (
          <>
            <UserCheck className="w-4 h-4 mr-2" />
            Request Access to GRC Platform
          </>
        )}
      </Button>
    </div>
  );
}

function PendingState() {
  return (
    <div data-ocid="access.pending.panel" className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5"
      >
        <Clock className="w-8 h-8 text-amber-400" />
      </motion.div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">
        Access Request Submitted
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Your request is pending administrator approval.
      </p>
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-300/80">
        You will be notified once the administrator reviews your request. This
        page will update automatically once approved.
      </div>
    </div>
  );
}

function RejectedState() {
  return (
    <div data-ocid="access.rejected.panel" className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5"
      >
        <ShieldX className="w-8 h-8 text-red-400" />
      </motion.div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">
        Access Request Denied
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Your access request was denied.
      </p>
      <div className="bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3 text-xs text-red-300/80">
        Please contact the platform administrator at CybXSan to resolve this.
      </div>
    </div>
  );
}

// Keep CheckCircle2 import satisfied
const _unused = CheckCircle2;
void _unused;
