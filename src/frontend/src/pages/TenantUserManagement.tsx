import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import { motion } from "motion/react";
import { useTenantUser } from "../contexts/TenantUserContext";
import { useGetTenantUsersForDomain } from "../hooks/useQueries";

function statusBadge(status: string) {
  if (status === "approved") {
    return (
      <Badge
        variant="outline"
        className="bg-green-500/15 text-green-400 border-green-500/30 text-xs"
        data-ocid="user.success_state"
      >
        Approved
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-xs"
      data-ocid="user.loading_state"
    >
      Pending
    </Badge>
  );
}

function roleBadge(role: string) {
  const r = role.toLowerCase();
  if (r === "admin") {
    return (
      <Badge
        variant="outline"
        className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-xs"
      >
        Admin
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-xs"
    >
      {role.charAt(0).toUpperCase() + role.slice(1) || "User"}
    </Badge>
  );
}

export function TenantUserManagement() {
  const { tenantUser } = useTenantUser();
  const domain = tenantUser?.domain ?? "";
  const { data: users, isLoading } = useGetTenantUsersForDomain(domain || null);

  return (
    <div data-ocid="tenant_users.page" className="p-3 sm:p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            User Management
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          View all users in your organization ({domain})
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Organization Members
              {users && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {users.length} user{users.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div data-ocid="tenant_users.loading_state" className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !users || users.length === 0 ? (
              <div
                data-ocid="tenant_users.empty_state"
                className="py-12 text-center text-muted-foreground text-sm"
              >
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>
                  No users found for domain{" "}
                  <span className="font-mono text-xs">{domain}</span>
                </p>
                <p className="mt-1 text-xs">
                  Contact your admin to add users to this organization.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="tenant_users.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, idx) => (
                      <TableRow
                        key={user.id}
                        data-ocid={`tenant_users.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium">
                          {user.fullName || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>{roleBadge(user.role || "user")}</TableCell>
                        <TableCell>
                          {statusBadge(
                            user.isApproved ? "approved" : "pending",
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        To add or modify users, contact your platform administrator.
      </p>
    </div>
  );
}
