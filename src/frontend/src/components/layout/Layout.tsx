import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Page } from "../../App";
import { UserRole } from "../../backend";
import { useTheme } from "../../contexts/ThemeContext";
import { useActor } from "../../hooks/useActor";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useCallerRole, useIsAdmin } from "../../hooks/useQueries";
import { WordMark } from "../WordMark";

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
  /** Present when a tenant user (email/password) is logged in instead of Internet Identity */
  tenantUser?: Record<string, string> | null;
  /** Called when the tenant user signs out */
  onTenantLogout?: () => void;
}

const roleBadgeStyles: Record<UserRole, string> = {
  [UserRole.admin]: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  [UserRole.user]: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  [UserRole.guest]: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};

const roleBadgeStylesLight: Record<UserRole, string> = {
  [UserRole.admin]: "bg-orange-100 text-orange-700 border-orange-300",
  [UserRole.user]: "bg-cyan-100 text-cyan-700 border-cyan-300",
  [UserRole.guest]: "bg-slate-100 text-slate-600 border-slate-300",
};

function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<{ name: string; email: string; department: string } | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function Layout({
  currentPage,
  onNavigate,
  children,
  tenantUser,
  onTenantLogout,
}: LayoutProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const { data: role } = useCallerRole();
  const { data: callerProfile } = useCallerProfile();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const isAuthenticated = !!identity;
  const isTenantMode = !!tenantUser;
  const isDark = theme === "dark";
  const displayEmail = isTenantMode
    ? (tenantUser?.email ?? null)
    : (callerProfile?.email ?? null);

  const handleLogout = async () => {
    setMobileOpen(false);
    if (isTenantMode) {
      // Clear tenant session from storage first, then reload for a clean login page
      localStorage.removeItem("tenantUser");
      if (onTenantLogout) onTenantLogout();
      window.location.reload();
    } else {
      // II logout: clear auth then reload to avoid useEffect race conditions
      try {
        await clear();
      } catch {
        /* ignore */
      }
      queryClient.clear();
      window.location.reload();
    }
  };

  const allNavItems = [
    {
      id: "dashboard" as Page,
      label: "Dashboard",
      icon: LayoutDashboard,
      minRole: "guest",
    },
    {
      id: "documents" as Page,
      label: "Documents",
      icon: FileText,
      minRole: "guest",
    },
    {
      id: "riskRegister" as Page,
      label: "Risk Register",
      icon: AlertTriangle,
      minRole: "user",
    },
    {
      id: "compliance" as Page,
      label: "Compliance",
      icon: ShieldCheck,
      minRole: "user",
    },
    {
      id: "governance" as Page,
      label: "Governance",
      icon: Building2,
      minRole: "user",
    },
    {
      id: "trustCenter" as Page,
      label: "Trust Center",
      icon: Shield,
      minRole: "guest",
    },
    {
      id: "admin" as Page,
      label: "Admin Panel",
      icon: Settings,
      minRole: "admin",
    },
  ];

  const getNavItems = () => {
    if (isTenantMode) {
      // Tenant users get access to most pages but not admin
      const base = allNavItems.filter((item) => item.minRole !== "admin");
      return [
        ...base,
        {
          id: "tenantUsers" as Page,
          label: "User Management",
          icon: Users,
          minRole: "tenant",
        },
      ];
    }
    const currentRole = role ?? UserRole.guest;
    return allNavItems.filter((item) => {
      if (item.minRole === "guest") return true;
      if (item.minRole === "user")
        return currentRole === UserRole.user || currentRole === UserRole.admin;
      if (item.minRole === "admin")
        return currentRole === UserRole.admin || isAdmin;
      return false;
    });
  };

  const navItems = getNavItems();

  const tenantRoleLabel = tenantUser?.role
    ? tenantUser.role.charAt(0).toUpperCase() + tenantUser.role.slice(1)
    : "User";

  const roleLabel = isTenantMode
    ? tenantRoleLabel
    : role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "Guest";

  const roleBadgeClass = isTenantMode
    ? isDark
      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
      : "bg-cyan-100 text-cyan-700 border-cyan-300"
    : role
      ? isDark
        ? roleBadgeStyles[role]
        : roleBadgeStylesLight[role]
      : isDark
        ? roleBadgeStyles[UserRole.guest]
        : roleBadgeStylesLight[UserRole.guest];

  const SidebarContent = () => (
    <>
      {/* Sidebar header wordmark */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <WordMark size="sm" />
        {isTenantMode && tenantUser?.companyName && (
          <p className="text-[10px] text-cyan-400/70 mt-0.5 truncate">
            {tenantUser.companyName}
          </p>
        )}
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
        {isAuthenticated || isTenantMode ? (
          <div className="space-y-2">
            <div className="px-3 py-2.5 rounded-lg bg-sidebar-accent">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-sidebar-accent-foreground truncate max-w-[120px]">
                  {displayEmail ?? (isTenantMode ? "Tenant User" : "Signed In")}
                </span>
                <Badge
                  className={`ml-auto text-[10px] border py-0 px-1.5 shrink-0 ${roleBadgeClass}`}
                >
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-[11px] text-sidebar-foreground/60 truncate">
                {isTenantMode
                  ? `${tenantUser?.companyName ?? "Tenant"} organization`
                  : role === UserRole.admin
                    ? "Full platform access"
                    : role === UserRole.user
                      ? "Standard access"
                      : "Limited access"}
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
      {/* Desktop sidebar — collapsible */}
      <aside
        className={`hidden md:flex flex-col bg-sidebar sidebar-grid border-r border-sidebar-border shrink-0 transition-all duration-300 overflow-hidden ${
          desktopSidebarOpen ? "md:w-56 lg:w-64" : "md:w-0"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay drawer */}
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
        <header className="h-14 shrink-0 border-b border-border bg-card/50 flex items-center px-4 gap-3">
          {/* Hamburger — visible on ALL screen sizes */}
          <button
            type="button"
            data-ocid="nav.sidebar.toggle"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(!mobileOpen);
              } else {
                setDesktopSidebarOpen(!desktopSidebarOpen);
              }
            }}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Wordmark in topbar (visible when sidebar is collapsed) */}
          {!desktopSidebarOpen && (
            <div className="hidden md:block">
              <WordMark size="sm" />
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {(isAuthenticated || isTenantMode) && (
              <div className="hidden sm:flex items-center gap-2">
                <Badge
                  data-ocid="nav.role.toggle"
                  className={`text-xs border ${roleBadgeClass}`}
                >
                  {roleLabel}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-md">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="max-w-[160px] truncate">
                    {displayEmail ??
                      (isTenantMode ? "Tenant User" : "Signed In")}
                  </span>
                </div>
              </div>
            )}

            {/* Theme toggle */}
            <div className="flex items-center gap-1.5" data-ocid="theme.toggle">
              <Sun
                className={`w-4 h-4 transition-colors ${
                  !isDark ? "text-amber-500" : "text-muted-foreground/50"
                }`}
              />
              <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
                aria-label="Toggle dark/light theme"
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-amber-400/60"
              />
              <Moon
                className={`w-4 h-4 transition-colors ${
                  isDark ? "text-primary" : "text-muted-foreground/50"
                }`}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
