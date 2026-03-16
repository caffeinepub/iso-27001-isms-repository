import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Layout } from "./components/layout/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin } from "./hooks/useQueries";
import { Admin } from "./pages/Admin";
import { Dashboard } from "./pages/Dashboard";
import { Documents } from "./pages/Documents";

type Page = "dashboard" | "documents" | "admin";

function AppShell() {
  const { isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorLoading } = useActor();
  const { data: isAdmin } = useIsAdmin();
  const [page, setPage] = useState<Page>("dashboard");
  const initDone = useRef(false);

  // Initialize ISMS repository once actor is ready (only if authenticated)
  useEffect(() => {
    if (!actor || actorLoading || initDone.current) return;
    initDone.current = true;
    actor.initializeISMSRepository().catch((err: unknown) => {
      console.warn("initializeISMSRepository:", err);
    });
  }, [actor, actorLoading]);

  // If admin tries to view admin page but isn't admin, redirect
  useEffect(() => {
    if (page === "admin" && isAdmin === false) {
      setPage("dashboard");
    }
  }, [page, isAdmin]);

  const handleViewDocument = (_id: bigint) => {
    setPage("documents");
  };

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
            Loading ISMS Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === "dashboard" && (
        <Dashboard onViewDocument={handleViewDocument} />
      )}
      {page === "documents" && <Documents />}
      {page === "admin" && isAdmin && <Admin />}
      {page === "admin" && !isAdmin && (
        <Dashboard onViewDocument={handleViewDocument} />
      )}
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
