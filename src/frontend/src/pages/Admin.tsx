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
import { Principal } from "@icp-sdk/core/principal";
import {
  AlertTriangle,
  Loader2,
  Settings,
  Shield,
  UserCog,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAssignRole, useCallerRole } from "../hooks/useQueries";

export function Admin() {
  const { identity } = useInternetIdentity();
  const { data: currentRole } = useCallerRole();
  const assignRole = useAssignRole();

  const [principalInput, setPrincipalInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);
  const [error, setError] = useState("");

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

  const roleColors: Record<UserRole, string> = {
    [UserRole.admin]: "bg-primary/15 text-primary border-primary/30",
    [UserRole.user]: "bg-cyan-950/60 text-cyan-300 border-cyan-800/60",
    [UserRole.guest]: "bg-slate-800 text-slate-300 border-slate-700",
  };

  return (
    <div className="p-3 sm:p-6 max-w-2xl mx-auto">
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
          Manage user roles and access control for the ISMS portal
        </p>
      </motion.div>

      {/* Current user info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card border-border mb-5">
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

      {/* Role assignment form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold font-display">
                Assign User Role
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
                  Enter the principal ID of the user you want to assign a role
                  to
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs text-muted-foreground">
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
                        <Shield className="w-3.5 h-3.5 text-primary" />
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
      </motion.div>
    </div>
  );
}
