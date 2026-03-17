import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@icp-sdk/core/principal";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Globe,
  Loader2,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ApprovalStatus, UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAssignRole,
  useAssignUserToTenant,
  useCallerRole,
  useCreateTenant,
  useDeleteTenant,
  useInitializeGRCData,
  useListApprovals,
  useListTenants,
  useRisks,
  useSetApproval,
} from "../hooks/useQueries";

const roleColors: Record<UserRole, string> = {
  [UserRole.admin]: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  [UserRole.user]: "bg-cyan-950/60 text-cyan-300 border-cyan-800/60",
  [UserRole.guest]: "bg-slate-800 text-slate-300 border-slate-700",
};

const statusColors: Record<ApprovalStatus, string> = {
  [ApprovalStatus.pending]:
    "bg-amber-500/15 text-amber-300 border-amber-500/30",
  [ApprovalStatus.approved]:
    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  [ApprovalStatus.rejected]: "bg-red-500/15 text-red-300 border-red-500/30",
};

function formatDate(ts: bigint): string {
  // Backend timestamps are in nanoseconds
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function Admin() {
  const { identity } = useInternetIdentity();
  const { data: currentRole } = useCallerRole();
  const assignRole = useAssignRole();
  const initGRC = useInitializeGRCData();
  const { data: approvals, isLoading: approvalsLoading } = useListApprovals();
  const setApproval = useSetApproval();

  // Tenant state
  const { data: tenants, isLoading: tenantsLoading } = useListTenants();
  const { data: allRisks } = useRisks();
  const riskCountByTenant = (allRisks ?? []).reduce<Record<string, number>>(
    (acc, r) => {
      const key = r.tenantId.toString();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const createTenant = useCreateTenant();
  const deleteTenant = useDeleteTenant();
  const assignUserToTenant = useAssignUserToTenant();
  const [tenantName, setTenantName] = useState("");
  const [tenantDomain, setTenantDomain] = useState("");
  const [selectedTenantUser, setSelectedTenantUser] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");

  const [principalInput, setPrincipalInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);
  const [error, setError] = useState("");
  const [roleMap, setRoleMap] = useState<Record<string, UserRole>>({});
  const [assigningRoleFor, setAssigningRoleFor] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let principal: Principal;
    try {
      principal = Principal.fromText(principalInput.trim());
    } catch {
      setError("Invalid principal ID format");
      return;
    }

    try {
      await assignRole.mutateAsync({ user: principal, role: selectedRole });
      toast.success(
        `Role "${selectedRole}" assigned to ${principalInput.substring(0, 12)}...`,
      );
      setPrincipalInput("");
    } catch (err: any) {
      const msg = err?.message ?? "Failed to assign role";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleRoleChange = async (principalStr: string, newRole: UserRole) => {
    setAssigningRoleFor(principalStr);
    setRoleMap((prev) => ({ ...prev, [principalStr]: newRole }));
    try {
      const principal = Principal.fromText(principalStr);
      await assignRole.mutateAsync({ user: principal, role: newRole });
      toast.success(`Role updated to "${newRole}"`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update role");
      setRoleMap((prev) => {
        const copy = { ...prev };
        delete copy[principalStr];
        return copy;
      });
    } finally {
      setAssigningRoleFor(null);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim() || !tenantDomain.trim()) return;
    try {
      await createTenant.mutateAsync({
        name: tenantName.trim(),
        domain: tenantDomain.trim().toLowerCase(),
      });
      setTenantName("");
      setTenantDomain("");
    } catch {
      // toast handled in hook
    }
  };

  const handleAssignUserToTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantUser || !selectedTenantId) return;
    try {
      const principal = Principal.fromText(selectedTenantUser);
      await assignUserToTenant.mutateAsync({
        user: principal,
        tenantId: BigInt(selectedTenantId),
      });
      setSelectedTenantUser("");
      setSelectedTenantId("");
    } catch {
      // toast handled in hook
    }
  };

  const approvedUsers =
    approvals?.filter((a) => a.status === ApprovalStatus.approved) ?? [];
  const pendingApprovals =
    approvals?.filter((a) => a.status === ApprovalStatus.pending) ?? [];

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Admin Panel
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage user roles, tenant organizations, and data for the ISMS portal
        </p>
      </motion.div>

      {/* Current user info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5"
      >
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">
                  Current Session
                </p>
                <p className="text-sm font-mono text-foreground truncate">
                  {identity?.getPrincipal().toString() ?? "Not logged in"}
                </p>
              </div>
              <Badge
                className={`text-xs border shrink-0 ${roleColors[currentRole ?? UserRole.guest]}`}
              >
                {currentRole
                  ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1)
                  : "Guest"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Tabs defaultValue="users" className="w-full">
          <TabsList
            className="w-full grid grid-cols-3 bg-muted/30 border border-border mb-5"
            data-ocid="admin.tab"
          >
            <TabsTrigger
              value="users"
              data-ocid="admin.users.tab"
              className="text-xs gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Users className="w-3.5 h-3.5" />
              Users
              {pendingApprovals.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/25 text-amber-300 text-[10px] font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="tenants"
              data-ocid="admin.tenants.tab"
              className="text-xs gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Building2 className="w-3.5 h-3.5" />
              Tenants
            </TabsTrigger>
            <TabsTrigger
              value="data"
              data-ocid="admin.data.tab"
              className="text-xs gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Database className="w-3.5 h-3.5" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* ── USERS TAB ───────────────────────────────────────────── */}
          <TabsContent value="users" className="space-y-5 mt-0">
            {/* Access Requests */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold font-display">
                      User Access Requests
                    </CardTitle>
                  </div>
                  {pendingApprovals.length > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
                      {pendingApprovals.length} pending
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator className="bg-border" />
              <CardContent className="pt-4">
                {approvalsLoading ? (
                  <div
                    data-ocid="admin.approvals.loading_state"
                    className="space-y-2"
                  >
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : !approvals || approvals.length === 0 ? (
                  <div
                    data-ocid="admin.approvals.empty_state"
                    className="text-center py-6 text-muted-foreground"
                  >
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No access requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-2" data-ocid="admin.approvals.list">
                    {approvals.map((approval, idx) => {
                      const principalStr = approval.principal.toString();
                      const short = `${principalStr.slice(0, 10)}...${principalStr.slice(-6)}`;
                      const ocidIdx = idx + 1;
                      const userRole = roleMap[principalStr] ?? UserRole.user;
                      const isApproved =
                        approval.status === ApprovalStatus.approved;
                      const isAssigning = assigningRoleFor === principalStr;

                      return (
                        <div
                          key={principalStr}
                          data-ocid={`admin.approvals.item.${ocidIdx}`}
                          className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-foreground/80 truncate">
                              {short}
                            </p>
                          </div>

                          <Badge
                            className={`text-xs border shrink-0 ${statusColors[approval.status]}`}
                          >
                            {approval.status.charAt(0).toUpperCase() +
                              approval.status.slice(1)}
                          </Badge>

                          {isApproved && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Select
                                value={userRole}
                                onValueChange={(v) =>
                                  handleRoleChange(principalStr, v as UserRole)
                                }
                                disabled={isAssigning}
                              >
                                <SelectTrigger
                                  data-ocid={`admin.approvals.select.${ocidIdx}`}
                                  className="h-7 text-xs bg-muted/30 border-border w-28"
                                >
                                  {isAssigning ? (
                                    <span className="flex items-center gap-1">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Saving
                                    </span>
                                  ) : (
                                    <SelectValue />
                                  )}
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                  <SelectItem
                                    value={UserRole.admin}
                                    className="text-xs"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Shield className="w-3 h-3 text-orange-400" />
                                      Admin
                                    </span>
                                  </SelectItem>
                                  <SelectItem
                                    value={UserRole.user}
                                    className="text-xs"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <UserCog className="w-3 h-3 text-cyan-400" />
                                      User
                                    </span>
                                  </SelectItem>
                                  <SelectItem
                                    value={UserRole.guest}
                                    className="text-xs"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <UserCog className="w-3 h-3 text-slate-400" />
                                      Guest
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {approval.status === ApprovalStatus.pending && (
                            <div className="flex gap-1.5 shrink-0">
                              <Button
                                data-ocid={`admin.approvals.confirm_button.${ocidIdx}`}
                                size="sm"
                                className="h-7 px-2.5 text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                                disabled={setApproval.isPending}
                                onClick={() =>
                                  setApproval.mutate({
                                    user: approval.principal,
                                    status: ApprovalStatus.approved,
                                  })
                                }
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                data-ocid={`admin.approvals.delete_button.${ocidIdx}`}
                                size="sm"
                                className="h-7 px-2.5 text-xs bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
                                disabled={setApproval.isPending}
                                onClick={() =>
                                  setApproval.mutate({
                                    user: approval.principal,
                                    status: ApprovalStatus.rejected,
                                  })
                                }
                              >
                                <UserX className="w-3 h-3 mr-1" />
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved Users with Role Management */}
            {approvedUsers.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold font-display">
                      Approved Users — Role Management
                    </CardTitle>
                  </div>
                </CardHeader>
                <Separator className="bg-border" />
                <CardContent className="pt-4">
                  <div className="space-y-2" data-ocid="admin.users.list">
                    {approvedUsers.map((approval, idx) => {
                      const principalStr = approval.principal.toString();
                      const short = `${principalStr.slice(0, 10)}...${principalStr.slice(-6)}`;
                      const ocidIdx = idx + 1;
                      const userRole = roleMap[principalStr] ?? UserRole.user;
                      const isAssigning = assigningRoleFor === principalStr;

                      return (
                        <div
                          key={principalStr}
                          data-ocid={`admin.users.item.${ocidIdx}`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-foreground/80 truncate">
                              {short}
                            </p>
                          </div>
                          <Badge
                            className={`text-xs border shrink-0 ${roleColors[userRole]}`}
                          >
                            {userRole.charAt(0).toUpperCase() +
                              userRole.slice(1)}
                          </Badge>
                          <Select
                            value={userRole}
                            onValueChange={(v) =>
                              handleRoleChange(principalStr, v as UserRole)
                            }
                            disabled={isAssigning}
                          >
                            <SelectTrigger
                              data-ocid={`admin.users.select.${ocidIdx}`}
                              className="h-7 text-xs bg-muted/30 border-border w-28"
                            >
                              {isAssigning ? (
                                <span className="flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Saving
                                </span>
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem
                                value={UserRole.admin}
                                className="text-xs"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Shield className="w-3 h-3 text-orange-400" />
                                  Admin
                                </span>
                              </SelectItem>
                              <SelectItem
                                value={UserRole.user}
                                className="text-xs"
                              >
                                <span className="flex items-center gap-1.5">
                                  <UserCog className="w-3 h-3 text-cyan-400" />
                                  User
                                </span>
                              </SelectItem>
                              <SelectItem
                                value={UserRole.guest}
                                className="text-xs"
                              >
                                <span className="flex items-center gap-1.5">
                                  <UserCog className="w-3 h-3 text-slate-400" />
                                  Guest
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Role assignment form */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold font-display">
                    Assign Role by Principal ID
                  </CardTitle>
                </div>
              </CardHeader>
              <Separator className="bg-border" />
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="principal"
                      className="text-xs text-muted-foreground"
                    >
                      Principal ID
                    </Label>
                    <Input
                      id="principal"
                      data-ocid="admin.principal.input"
                      placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                      value={principalInput}
                      onChange={(e) => {
                        setPrincipalInput(e.target.value);
                        setError("");
                      }}
                      className="font-mono text-sm bg-muted/30 border-border"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Enter the principal ID of the user you want to assign a
                      role to
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="role"
                      className="text-xs text-muted-foreground"
                    >
                      Role
                    </Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(v) => setSelectedRole(v as UserRole)}
                    >
                      <SelectTrigger
                        id="role"
                        data-ocid="admin.role.select"
                        className="bg-muted/30 border-border text-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value={UserRole.admin} className="text-sm">
                          <span className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-orange-400" />
                            Admin
                          </span>
                        </SelectItem>
                        <SelectItem value={UserRole.user} className="text-sm">
                          <span className="flex items-center gap-2">
                            <UserCog className="w-3.5 h-3.5 text-cyan-400" />
                            User
                          </span>
                        </SelectItem>
                        <SelectItem value={UserRole.guest} className="text-sm">
                          <span className="flex items-center gap-2">
                            <UserCog className="w-3.5 h-3.5 text-slate-400" />
                            Guest
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <div
                      data-ocid="admin.role_assign.error_state"
                      className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      <p className="text-xs text-destructive">{error}</p>
                    </div>
                  )}

                  <Button
                    data-ocid="admin.role_assign.submit_button"
                    type="submit"
                    size="sm"
                    className="w-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                    disabled={!principalInput || assignRole.isPending}
                  >
                    {assignRole.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5 mr-2" />
                        Assign Role
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TENANTS TAB ─────────────────────────────────────────── */}
          <TabsContent value="tenants" className="space-y-5 mt-0">
            {/* Create Tenant */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold font-display">
                    Create Organization Tenant
                  </CardTitle>
                </div>
              </CardHeader>
              <Separator className="bg-border" />
              <CardContent className="pt-4">
                <form onSubmit={handleCreateTenant} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="tenant-name"
                        className="text-xs text-muted-foreground"
                      >
                        Organization Name
                      </Label>
                      <Input
                        id="tenant-name"
                        data-ocid="admin.tenant_name.input"
                        placeholder="Acme Corporation"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        className="text-sm bg-muted/30 border-border"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="tenant-domain"
                        className="text-xs text-muted-foreground"
                      >
                        Domain
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="tenant-domain"
                          data-ocid="admin.tenant_domain.input"
                          placeholder="acme.com"
                          value={tenantDomain}
                          onChange={(e) => setTenantDomain(e.target.value)}
                          className="text-sm bg-muted/30 border-border pl-8"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    data-ocid="admin.tenant.submit_button"
                    type="submit"
                    size="sm"
                    className="w-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                    disabled={
                      !tenantName.trim() ||
                      !tenantDomain.trim() ||
                      createTenant.isPending
                    }
                  >
                    {createTenant.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 mr-2" />
                        Create Tenant
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tenant List */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold font-display">
                      Registered Tenants
                    </CardTitle>
                  </div>
                  {tenants && tenants.length > 0 && (
                    <Badge className="bg-primary/15 text-primary border border-primary/30 text-xs">
                      {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator className="bg-border" />
              <CardContent className="pt-4">
                {tenantsLoading ? (
                  <div
                    data-ocid="admin.tenants.loading_state"
                    className="space-y-2"
                  >
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : !tenants || tenants.length === 0 ? (
                  <div
                    data-ocid="admin.tenants.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No tenants yet — create one above</p>
                  </div>
                ) : (
                  <div className="space-y-2" data-ocid="admin.tenants.list">
                    {tenants.map((tenant, idx) => (
                      <div
                        key={tenant.id.toString()}
                        data-ocid={`admin.tenants.item.${idx + 1}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {tenant.name}
                            </p>
                            {(riskCountByTenant[tenant.id.toString()] ?? 0) >
                              0 && (
                              <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30 shrink-0">
                                {riskCountByTenant[tenant.id.toString()]} risk
                                {riskCountByTenant[tenant.id.toString()] !== 1
                                  ? "s"
                                  : ""}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground truncate">
                              {tenant.domain}
                            </p>
                            <span className="text-muted-foreground/40 text-xs">
                              ·
                            </span>
                            <p className="text-xs text-muted-foreground truncate">
                              Created {formatDate(tenant.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          data-ocid={`admin.tenants.delete_button.${idx + 1}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0"
                          disabled={deleteTenant.isPending}
                          onClick={() => deleteTenant.mutate(tenant.id)}
                        >
                          {deleteTenant.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assign User to Tenant */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold font-display">
                    Assign User to Tenant
                  </CardTitle>
                </div>
              </CardHeader>
              <Separator className="bg-border" />
              <CardContent className="pt-4">
                {approvedUsers.length === 0 ||
                !tenants ||
                tenants.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <UserCog className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">
                      {approvedUsers.length === 0
                        ? "No approved users available"
                        : "Create a tenant first"}
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleAssignUserToTenant}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Select User
                      </Label>
                      <Select
                        value={selectedTenantUser}
                        onValueChange={setSelectedTenantUser}
                      >
                        <SelectTrigger
                          data-ocid="admin.tenant_assign_user.select"
                          className="bg-muted/30 border-border text-sm"
                        >
                          <SelectValue placeholder="Choose approved user..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {approvedUsers.map((u) => {
                            const pStr = u.principal.toString();
                            const short = `${pStr.slice(0, 12)}...${pStr.slice(-6)}`;
                            return (
                              <SelectItem
                                key={pStr}
                                value={pStr}
                                className="text-xs font-mono"
                              >
                                {short}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Select Tenant
                      </Label>
                      <Select
                        value={selectedTenantId}
                        onValueChange={setSelectedTenantId}
                      >
                        <SelectTrigger
                          data-ocid="admin.tenant_assign_tenant.select"
                          className="bg-muted/30 border-border text-sm"
                        >
                          <SelectValue placeholder="Choose tenant..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {tenants.map((t) => (
                            <SelectItem
                              key={t.id.toString()}
                              value={t.id.toString()}
                              className="text-sm"
                            >
                              <span className="flex items-center gap-2">
                                <Building2 className="w-3 h-3 text-primary" />
                                {t.name}
                                <span className="text-muted-foreground text-xs">
                                  ({t.domain})
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      data-ocid="admin.tenant_assign.submit_button"
                      type="submit"
                      size="sm"
                      className="w-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                      disabled={
                        !selectedTenantUser ||
                        !selectedTenantId ||
                        assignUserToTenant.isPending
                      }
                    >
                      {assignUserToTenant.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 mr-2" />
                          Assign to Tenant
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── DATA TAB ────────────────────────────────────────────── */}
          <TabsContent value="data" className="mt-0">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-semibold font-display">
                    Initialize Sample Data
                  </CardTitle>
                </div>
              </CardHeader>
              <Separator className="bg-border" />
              <CardContent className="pt-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Load all compliance frameworks, risk register entries, and
                  governance items. This populates ISO 27001, SOC 2, GDPR, PCI
                  DSS, NIST CSF, and ISO 9001 with sample controls and data.
                </p>
                {initGRC.isSuccess && (
                  <div
                    data-ocid="admin.init_grc.success_state"
                    className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-400">
                      GRC sample data initialized successfully
                    </p>
                  </div>
                )}
                <Button
                  data-ocid="admin.init_grc.primary_button"
                  type="button"
                  size="sm"
                  className="w-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                  onClick={() => initGRC.mutate()}
                  disabled={initGRC.isPending}
                >
                  {initGRC.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5 mr-2" />
                      Initialize GRC Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
