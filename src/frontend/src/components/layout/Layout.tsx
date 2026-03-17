import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Shield,
  ShieldCheck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Page } from "../../App";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useCallerRole, useIsAdmin } from "../../hooks/useQueries";

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const { data: role } = useCallerRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = !!identity;
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.substring(0, 8)}...${principal.substring(principal.length - 4)}`
    : null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    setMobileOpen(false);
  };

  const navItems = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
    { id: "riskRegister" as Page, label: "Risk Register", icon: AlertTriangle },
    { id: "compliance" as Page, label: "Compliance", icon: ShieldCheck },
    { id: "governance" as Page, label: "Governance", icon: Building2 },
    { id: "documents" as Page, label: "Documents", icon: FileText },
    ...(isAdmin
      ? [{ id: "admin" as Page, label: "Admin Panel", icon: Settings }]
      : []),
  ];

  const SidebarContent = () => (
    <>
      <div className="px-5 py-4 border-b border-sidebar-border">
        <img
          src="/assets/uploads/Futuristic-CybXSan-Logo-with-Neon-X-1.jpg"
          alt="CybXSan Logo"
          className="h-12 w-auto object-contain"
        />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest px-2 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`nav.${item.id}.link`}
              onClick={() => {
                onNavigate(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
              {item.label}
              {item.id === "admin" && (
                <Badge className="ml-auto text-[10px] bg-primary/15 text-primary border-primary/20 py-0">
                  Admin
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
        {isAuthenticated ? (
          <div className="space-y-2">
            <div className="px-3 py-2.5 rounded-lg bg-sidebar-accent">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-sidebar-accent-foreground">
                  {role ? role.charAt(0).toUpperCase() + role.slice(1) : "User"}
                </span>
              </div>
              <p className="text-[11px] text-sidebar-foreground font-mono truncate">
                {shortPrincipal}
              </p>
            </div>
            <Button
              data-ocid="auth.logout_button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            data-ocid="auth.login_button"
            size="sm"
            className="w-full bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 text-xs"
            onClick={login}
            disabled={isLoggingIn}
          >
            <LogIn className="w-3.5 h-3.5 mr-2" />
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex md:w-56 lg:w-64 flex-col bg-sidebar sidebar-grid border-r border-sidebar-border shrink-0">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 flex flex-col bg-sidebar sidebar-grid border-r border-sidebar-border z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 border-b border-border bg-card/50 flex items-center px-4 gap-4">
          <button
            type="button"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1">
            <img
              src="/assets/uploads/Futuristic-CybXSan-Logo-with-Neon-X-1.jpg"
              alt="CybXSan Logo"
              className="h-9 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-md">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono">{shortPrincipal}</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
