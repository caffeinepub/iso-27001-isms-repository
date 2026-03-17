import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Layout } from "./components/layout/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useIsAdmin,
  useIsAdminAssigned,
  useIsApproved,
} from "./hooks/useQueries";
import { Admin } from "./pages/Admin";
import { ClaimAdmin } from "./pages/ClaimAdmin";
import { ComplianceStandards } from "./pages/ComplianceStandards";
import { Dashboard } from "./pages/Dashboard";
import { Documents } from "./pages/Documents";
import { Governance } from "./pages/Governance";
import { Login } from "./pages/Login";
import { RiskRegister } from "./pages/RiskRegister";
import { TrustCenter } from "./pages/TrustCenter";
import {
  clearAdminTokenFromUrl,
  getAdminTokenFromUrl,
} from "./utils/urlParams";

export type Page =
  | "dashboard"
  | "documents"
  | "admin"
  | "riskRegister"
  | "governance"
  | "compliance"
  | "trustCenter";

// Capture the admin token once at module load time so URL changes don't affect it.
const INITIAL_ADMIN_TOKEN = getAdminTokenFromUrl();

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-2 w-48">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-3/4 mx-auto" />
        </div>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

type ClaimStatus = "idle" | "claiming" | "claimed" | "error";

function AppShell() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const { isLoading: adminAssignedLoading } = useIsAdminAssigned();
  const { data: isApproved, isLoading: approvalLoading } = useIsApproved();
  const [page, setPage] = useState<Page>("dashboard");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");
  const claimAttempted = useRef(false);
  const initDone = useRef(false);

  const isAuthenticated = !!identity;

  // One-time data initialization
  useEffect(() => {
    if (!actor || actorLoading || initDone.current) return;
    initDone.current = true;
    Promise.all([
      actor
        .initializeISMSRepository()
        .catch((err: unknown) =>
          console.warn("initializeISMSRepository:", err),
        ),
      actor
        .initializeGRCData()
        .catch((err: unknown) => console.warn("initializeGRCData:", err)),
    ]);
  }, [actor, actorLoading]);

  // Admin token claim -- runs ONCE, only when token is present in URL
  useEffect(() => {
    if (!INITIAL_ADMIN_TOKEN) return;
    if (!actor || actorLoading) return;
    if (!isAuthenticated) return;
    if (claimAttempted.current) return;

    claimAttempted.current = true;
    setClaimStatus("claiming");

    const a = actor as unknown as Record<string, unknown>;
    const fn = a._initializeAccessControlWithSecret;

    if (typeof fn !== "function") {
      setClaimStatus("claimed");
      clearAdminTokenFromUrl();
      // Refresh role queries even if method wasn't found
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["isAdminAssigned"] });
      queryClient.invalidateQueries({ queryKey: ["isApproved"] });
      queryClient.invalidateQueries({ queryKey: ["callerRole"] });
      return;
    }

    (fn as (token: string) => Promise<void>)
      .call(actor, INITIAL_ADMIN_TOKEN)
      .then(() => {
        clearAdminTokenFromUrl();
        // Invalidate ALL role/auth queries so they re-fetch with updated admin status
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: ["isAdmin"] }),
          queryClient.invalidateQueries({ queryKey: ["isAdminAssigned"] }),
          queryClient.invalidateQueries({ queryKey: ["isApproved"] }),
          queryClient.invalidateQueries({ queryKey: ["callerRole"] }),
          queryClient.refetchQueries({ queryKey: ["isAdmin"] }),
          queryClient.refetchQueries({ queryKey: ["isAdminAssigned"] }),
        ]);
      })
      .then(() => {
        setClaimStatus("claimed");
      })
      .catch((err: unknown) => {
        console.error("Admin claim failed:", err);
        setClaimStatus("error");
        clearAdminTokenFromUrl();
      });
  }, [actor, actorLoading, isAuthenticated, queryClient]);

  // Redirect away from admin page if not admin
  useEffect(() => {
    if (page === "admin" && isAdmin === false) {
      setPage("dashboard");
    }
  }, [page, isAdmin]);

  // --- Render state machine ---

  if (isInitializing) {
    return <LoadingScreen message="Loading GRC Platform..." />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (actorLoading || !actor) {
    return <LoadingScreen message="Connecting to platform..." />;
  }

  // Admin claim in progress
  if (INITIAL_ADMIN_TOKEN && claimStatus === "claiming") {
    return <LoadingScreen message="Activating admin access..." />;
  }

  // Admin claim errored
  if (INITIAL_ADMIN_TOKEN && claimStatus === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <ShieldCheck className="w-10 h-10 text-destructive" />
          <p className="text-sm text-foreground font-semibold">
            Admin claim failed
          </p>
          <p className="text-xs text-muted-foreground">
            The admin token was invalid or has already been used. Please check
            your Caffeine project settings for the correct token and try again.
          </p>
          <button
            type="button"
            className="text-xs text-primary underline mt-2"
            onClick={() => window.location.reload()}
          >
            Reload and try again
          </button>
        </div>
      </div>
    );
  }

  if (adminAssignedLoading) {
    return <LoadingScreen message="Verifying platform status..." />;
  }

  // Any non-admin unapproved user sees the ClaimAdmin screen (handles both admin claim and access request)
  if (!isAdmin) {
    if (approvalLoading || isApproved === undefined) {
      return <LoadingScreen message="Verifying access..." />;
    }
    if (!isApproved) {
      return <ClaimAdmin />;
    }
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === "dashboard" && <Dashboard onNavigate={setPage} />}
      {page === "documents" && <Documents />}
      {page === "riskRegister" && <RiskRegister />}
      {page === "compliance" && <ComplianceStandards />}
      {page === "governance" && <Governance />}
      {page === "trustCenter" && <TrustCenter />}
      {page === "admin" && isAdmin && <Admin />}
      {page === "admin" && !isAdmin && <Dashboard onNavigate={setPage} />}
    </Layout>
  );
}

export default function App() {
  return (
    <>
      <AppShell />
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground",
            description: "text-muted-foreground",
          },
        }}
      />
    </>
  );
}
