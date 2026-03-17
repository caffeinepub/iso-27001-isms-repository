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

export type Page =
  | "dashboard"
  | "documents"
  | "admin"
  | "riskRegister"
  | "governance"
  | "compliance";

function AppShell() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const { data: isAdmin } = useIsAdmin();
  const { data: isAdminAssigned } = useIsAdminAssigned();
  const { data: isApproved, isLoading: approvalLoading } = useIsApproved();
  const [page, setPage] = useState<Page>("dashboard");
  const initDone = useRef(false);

  const isAuthenticated = !!identity;

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

  // If no admin has been assigned yet, show the admin claim/setup screen
  if (isAuthenticated && isAdminAssigned === false && isAdmin === false) {
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
