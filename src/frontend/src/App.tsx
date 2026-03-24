import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Layout } from "./components/layout/Layout";
import { TenantUserProvider } from "./contexts/TenantUserContext";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import { GRCSettings } from "./pages/GRCSettings";
import { Governance } from "./pages/Governance";
import { Login } from "./pages/Login";
import { PlatformSetup } from "./pages/PlatformSetup";
import { RiskRegister } from "./pages/RiskRegister";
import { TenantLogin } from "./pages/TenantLogin";
import { TenantOnboarding } from "./pages/TenantOnboarding";
import { TenantSignUp } from "./pages/TenantSignUp";
import { TenantUserManagement } from "./pages/TenantUserManagement";
import { TrustCenter } from "./pages/TrustCenter";
// ── Admin token helpers ───────────────────────────────────────────────────
function getAdminTokenFromUrl(): string | null {
  const qs = new URLSearchParams(window.location.search);
  const qsToken = qs.get("caffeineAdminToken");
  if (qsToken) return qsToken;
  const hash = window.location.hash;
  if (hash) {
    const hashContent = hash.startsWith("#") ? hash.slice(1) : hash;
    const sep = hashContent.indexOf("?");
    const hashQs = sep >= 0 ? hashContent.slice(sep + 1) : hashContent;
    const hashParams = new URLSearchParams(hashQs);
    const hashToken = hashParams.get("caffeineAdminToken");
    if (hashToken) return hashToken;
  }
  return null;
}

function clearAdminTokenFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("caffeineAdminToken");
  const hash = url.hash;
  if (hash) {
    const hashContent = hash.startsWith("#") ? hash.slice(1) : hash;
    const sep = hashContent.indexOf("?");
    if (sep >= 0) {
      const routePath = hashContent.slice(0, sep);
      const hashParams = new URLSearchParams(hashContent.slice(sep + 1));
      hashParams.delete("caffeineAdminToken");
      const newQs = hashParams.toString();
      url.hash = `#${routePath}${newQs ? `?${newQs}` : ""}`;
    }
  }
  window.history.replaceState(null, "", url.toString());
}

export type Page =
  | "dashboard"
  | "documents"
  | "admin"
  | "riskRegister"
  | "governance"
  | "compliance"
  | "trustCenter"
  | "tenantUsers"
  | "grcSettings";

type AuthView = "main" | "tenantLogin" | "tenantSignUp";

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
  const { data: isAdminAssigned, isLoading: adminAssignedLoading } =
    useIsAdminAssigned();
  const { data: isApproved, isLoading: approvalLoading } = useIsApproved();
  const [page, setPage] = useState<Page>("dashboard");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");
  const [authView, setAuthView] = useState<AuthView>("main");
  const claimAttempted = useRef(false);
  const initDone = useRef(false);

  // Tenant onboarding check
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [tenantUser, setTenantUser] = useState<object | null>(() => {
    try {
      const stored = localStorage.getItem("tenantUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!identity;
  const isTenantAuthenticated = !!tenantUser;

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

  // Check tenant onboarding status once after login
  useEffect(() => {
    if (!actor || actorLoading || !isTenantAuthenticated || onboardingChecked)
      return;
    const tu = tenantUser as Record<string, string>;
    const userId = tu?.id;
    if (!userId) {
      setOnboardingChecked(true);
      return;
    }
    actor
      .isTenantOnboardingDone(userId)
      .then((done: boolean) => {
        setNeedsOnboarding(!done);
        setOnboardingChecked(true);
      })
      .catch(() => {
        setOnboardingChecked(true); // If backend doesn't support it, skip
      });
  }, [
    actor,
    actorLoading,
    isTenantAuthenticated,
    tenantUser,
    onboardingChecked,
  ]);

  // Admin token claim
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

  // Tenant user is logged in via email/password
  if (isTenantAuthenticated && !isAuthenticated) {
    const tu = tenantUser as Record<string, string>;

    // Show onboarding if not checked yet
    if (!onboardingChecked) {
      return <LoadingScreen message="Preparing your workspace..." />;
    }

    // Show onboarding wizard if needed
    if (needsOnboarding) {
      return (
        <TenantOnboarding
          userId={tu.id}
          companyName={tu.companyName ?? tu.domain ?? ""}
          onComplete={() => setNeedsOnboarding(false)}
        />
      );
    }

    return (
      <TenantUserProvider tenantUser={tenantUser as any}>
        <Layout
          currentPage={page}
          onNavigate={setPage}
          onTenantLogout={() => {
            localStorage.removeItem("tenantUser");
            setTenantUser(null);
            setOnboardingChecked(false);
            setNeedsOnboarding(false);
            setAuthView("main");
          }}
          tenantUser={tenantUser as Record<string, string>}
        >
          {page === "dashboard" && <Dashboard onNavigate={setPage} />}
          {page === "documents" && <Documents />}
          {page === "riskRegister" && <RiskRegister />}
          {page === "compliance" && <ComplianceStandards />}
          {page === "governance" && <Governance />}
          {page === "trustCenter" && <TrustCenter />}
          {page === "tenantUsers" && <TenantUserManagement />}
          {page === "grcSettings" && tu.role === "admin" && <GRCSettings />}
          {page === "grcSettings" && tu.role !== "admin" && (
            <Dashboard onNavigate={setPage} />
          )}
        </Layout>
      </TenantUserProvider>
    );
  }

  if (!isAuthenticated) {
    if (authView === "tenantLogin") {
      return (
        <TenantLogin
          onNavigateSignUp={() => setAuthView("tenantSignUp")}
          onNavigateBack={() => setAuthView("main")}
          onLoginSuccess={(user) => {
            setTenantUser(user);
            setOnboardingChecked(false);
            setAuthView("main");
          }}
        />
      );
    }
    if (authView === "tenantSignUp") {
      return (
        <TenantSignUp
          onNavigateLogin={() => setAuthView("tenantLogin")}
          onNavigateBack={() => setAuthView("main")}
        />
      );
    }
    return <Login onNavigateTenantLogin={() => setAuthView("tenantLogin")} />;
  }

  if (actorLoading || !actor) {
    return <LoadingScreen message="Connecting to platform..." />;
  }

  if (INITIAL_ADMIN_TOKEN && claimStatus === "claiming") {
    return <LoadingScreen message="Activating admin access..." />;
  }

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

  // Show Platform Setup wizard when no admin is assigned and user is authenticated
  if (isAdminAssigned === false && isAuthenticated) {
    return (
      <PlatformSetup
        onSetupComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
          queryClient.invalidateQueries({ queryKey: ["isAdminAssigned"] });
          queryClient.refetchQueries({ queryKey: ["isAdmin"] });
          queryClient.refetchQueries({ queryKey: ["isAdminAssigned"] });
        }}
      />
    );
  }

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
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
