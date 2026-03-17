import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
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
import { RequestAccess } from "./pages/RequestAccess";
import { RiskRegister } from "./pages/RiskRegister";
import { TrustCenter } from "./pages/TrustCenter";
import {
  getSessionParameter,
  getUrlParameter,
  storeSessionParameter,
} from "./utils/urlParams";

export type Page =
  | "dashboard"
  | "documents"
  | "admin"
  | "riskRegister"
  | "governance"
  | "compliance"
  | "trustCenter";

/** Returns the admin token from URL or session storage, storing it if found in URL */
function getAdminToken(): string | null {
  const urlToken = getUrlParameter("caffeineAdminToken");
  if (urlToken) {
    storeSessionParameter("caffeineAdminToken", urlToken);
    return urlToken;
  }
  return getSessionParameter("caffeineAdminToken");
}

function AppShell() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const {
    data: isAdmin,
    isLoading: adminLoading,
    refetch: refetchAdmin,
  } = useIsAdmin();
  const { data: isAdminAssigned, refetch: refetchAdminAssigned } =
    useIsAdminAssigned();
  const { data: isApproved, isLoading: approvalLoading } = useIsApproved();
  const [page, setPage] = useState<Page>("dashboard");
  const initDone = useRef(false);
  const claimAttempted = useRef(false);
  const [claiming, setClaiming] = useState(false);
  const [claimFailed, setClaimFailed] = useState(false);

  const isAuthenticated = !!identity;
  const adminToken = getAdminToken();
  const tokenPresent = !!adminToken;

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

  // Auto-claim admin when token is present
  useEffect(() => {
    if (
      !actor ||
      actorLoading ||
      !isAuthenticated ||
      !tokenPresent ||
      claimAttempted.current ||
      isAdmin === true ||
      isAdminAssigned === undefined
    )
      return;

    if (isAdminAssigned === true && isAdmin === false) return; // admin claimed by someone else

    claimAttempted.current = true;
    setClaiming(true);
    setClaimFailed(false);

    const a = actor as any;
    const claimFn: ((token: string) => Promise<void>) | undefined =
      typeof a.claimAdmin === "function" ? a.claimAdmin.bind(a) : undefined;

    if (!claimFn) {
      setClaiming(false);
      return;
    }

    claimFn(adminToken!)
      .then(() => {
        setClaiming(false);
        return Promise.all([refetchAdmin(), refetchAdminAssigned()]);
      })
      .catch((err: unknown) => {
        console.warn("claimAdmin failed:", err);
        setClaiming(false);
        setClaimFailed(true);
      });
  }, [
    actor,
    actorLoading,
    isAuthenticated,
    tokenPresent,
    isAdmin,
    isAdminAssigned,
    adminToken,
    refetchAdmin,
    refetchAdminAssigned,
  ]);

  useEffect(() => {
    if (page === "admin" && isAdmin === false) {
      setPage("dashboard");
    }
  }, [page, isAdmin]);

  if (isInitializing) {
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
          <p className="text-xs text-muted-foreground">
            Loading GRC Platform...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // When token present, wait for claim process to complete
  if (tokenPresent && (actorLoading || adminLoading || claiming)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-2 w-48">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-3/4 mx-auto" />
          </div>
          <p className="text-xs text-muted-foreground">
            Activating admin access...
          </p>
        </div>
      </div>
    );
  }

  // Show claim failure screen
  if (tokenPresent && claimFailed && !isAdmin) {
    return <ClaimAdmin />;
  }

  // If no admin has been assigned yet and no token, show the admin claim/setup screen
  if (
    isAuthenticated &&
    isAdminAssigned === false &&
    isAdmin === false &&
    !tokenPresent
  ) {
    return <ClaimAdmin />;
  }

  // Admin always bypasses approval check
  if (!isAdmin && isAuthenticated) {
    // Still loading approval status
    if (approvalLoading || isApproved === undefined) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center animate-pulse">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Verifying access...</p>
          </div>
        </div>
      );
    }

    if (!isApproved) {
      return <RequestAccessGate />;
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

function RequestAccessGate() {
  const { actor } = useActor();
  const [requestState, setRequestState] = useState<
    "not_requested" | "pending" | "rejected"
  >("not_requested");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!actor || checkedRef.current) return;
    checkedRef.current = true;
    const stored = sessionStorage.getItem("access_requested");
    if (stored === "pending") {
      setRequestState("pending");
    } else if (stored === "rejected") {
      setRequestState("rejected");
    }
  }, [actor]);

  return (
    <RequestAccessWithState
      requestState={requestState}
      onRequested={() => {
        sessionStorage.setItem("access_requested", "pending");
        setRequestState("pending");
      }}
    />
  );
}

function RequestAccessWithState({
  requestState,
  onRequested,
}: {
  requestState: "not_requested" | "pending" | "rejected";
  onRequested: () => void;
}) {
  return (
    <RequestAccess requestState={requestState} onRequested={onRequested} />
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
