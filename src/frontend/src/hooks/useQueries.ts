import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ApprovalStatus,
  type ComplianceControl,
  type ComplianceFramework,
  type ComplianceScores,
  ControlStatus,
  type CreateGovernanceItemInput,
  type CreateRiskInput,
  type GovernanceItem,
  type GovernanceSummary,
  type RiskItem,
  type RiskStats,
  type Tenant,
  type UpdateComplianceControlInput,
  type UpdateGovernanceItemInput,
  type UpdateRiskInput,
  type UserApprovalInfo,
  UserRole,
} from "../backend";
import type {
  GovAttachmentMeta,
  GovFrameworkMapping,
  UploadedDocumentMeta,
} from "../types/blobStorage";
import type { Document, DocumentStatus } from "../types/document";
import { uploadFileToStorage } from "../utils/uploadToStorage";
import { useActor } from "./useActor";

// ── Documents ──────────────────────────────────────────────────────────────

export function useDocuments() {
  const { actor, isFetching } = useActor();
  return useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as any;
      if (typeof a.getDocuments !== "function") return [];
      return a.getDocuments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDocumentById(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Document | null>({
    queryKey: ["document", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      const a = actor as any;
      if (typeof a.getDocumentById !== "function") return null;
      return a.getDocumentById(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsApproved() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useIsAdminAssigned() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdminAssigned"],
    queryFn: async () => {
      if (!actor) return true; // assume assigned to avoid flicker
      const a = actor as any;
      if (typeof a.isAdminAssigned !== "function") return true;
      return a.isAdminAssigned();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery<UserApprovalInfo[]>({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      status,
    }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error("No actor");
      await actor.setApproval(user, status);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      const label =
        variables.status === ApprovalStatus.approved ? "approved" : "denied";
      toast.success(`User access ${label} successfully`);
    },
    onError: () => toast.error("Failed to update approval status"),
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.requestApproval();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isApproved"] });
      toast.success("Access request submitted");
    },
    onError: () => toast.error("Failed to submit access request"),
  });
}

export function useInitializeRepository() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.initializeISMSRepository();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("No actor");
      await actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerRole"] });
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}

// ── Tenants ────────────────────────────────────────────────────────────────

export function useListTenants() {
  const { actor, isFetching } = useActor();
  return useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTenants();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTenant() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, domain }: { name: string; domain: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createTenant({ name, domain });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant created successfully");
    },
    onError: () => toast.error("Failed to create tenant"),
  });
}

export function useDeleteTenant() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteTenant(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["userTenants"] });
      toast.success("Tenant deleted");
    },
    onError: () => toast.error("Failed to delete tenant"),
  });
}

export function useAssignUserToTenant() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      tenantId,
    }: { user: Principal; tenantId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.assignUserToTenant(user, tenantId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userTenants"] });
      toast.success("User assigned to tenant");
    },
    onError: () => toast.error("Failed to assign user to tenant"),
  });
}

export function useGetUserTenant(user: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Tenant | null>({
    queryKey: ["userTenants", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return actor.getUserTenant(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useCallerTenant() {
  const { actor, isFetching } = useActor();
  return useQuery<Tenant | null>({
    queryKey: ["callerTenant"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerTenant();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRisksByTenant(tenantId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<import("../backend").RiskItem[]>({
    queryKey: ["risksByTenant", tenantId?.toString()],
    queryFn: async () => {
      if (!actor || tenantId === null) return [];
      return actor.getRisksByTenant(tenantId);
    },
    enabled: !!actor && !isFetching && tenantId !== null,
  });
}
// ── Risks ──────────────────────────────────────────────────────────────────

export function useRisks() {
  const { actor, isFetching } = useActor();
  return useQuery<RiskItem[]>({
    queryKey: ["risks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRisks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRiskStats() {
  const { actor, isFetching } = useActor();
  return useQuery<RiskStats>({
    queryKey: ["riskStats"],
    queryFn: async () => {
      if (!actor)
        return {
          avgInherentScore: 0n,
          avgResidualScore: 0n,
          total: 0n,
          byLevel: [],
          byStatus: [],
        } as RiskStats;
      return actor.getRiskStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRisk() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRiskInput) => {
      if (!actor) throw new Error("No actor");
      return actor.createRisk(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risks"] });
      qc.invalidateQueries({ queryKey: ["riskStats"] });
      toast.success("Risk created successfully");
    },
    onError: () => toast.error("Failed to create risk"),
  });
}

export function useUpdateRisk() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateRiskInput) => {
      if (!actor) throw new Error("No actor");
      return actor.updateRisk(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risks"] });
      qc.invalidateQueries({ queryKey: ["riskStats"] });
      toast.success("Risk updated successfully");
    },
    onError: () => toast.error("Failed to update risk"),
  });
}

export function useDeleteRisk() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteRisk(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risks"] });
      qc.invalidateQueries({ queryKey: ["riskStats"] });
      toast.success("Risk deleted");
    },
    onError: () => toast.error("Failed to delete risk"),
  });
}

// ── Governance ─────────────────────────────────────────────────────────────

export function useGovernanceItems() {
  const { actor, isFetching } = useActor();
  return useQuery<GovernanceItem[]>({
    queryKey: ["governanceItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGovernanceItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGovernanceSummary() {
  const { actor, isFetching } = useActor();
  return useQuery<GovernanceSummary>({
    queryKey: ["governanceSummary"],
    queryFn: async () => {
      if (!actor)
        return { total: 0n, byStatus: [], byCategory: [] } as GovernanceSummary;
      return actor.getGovernanceSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGovernanceItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGovernanceItemInput) => {
      if (!actor) throw new Error("No actor");
      return actor.createGovernanceItem(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["governanceItems"] });
      qc.invalidateQueries({ queryKey: ["governanceSummary"] });
      toast.success("Governance item created");
    },
    onError: () => toast.error("Failed to create governance item"),
  });
}

export function useUpdateGovernanceItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateGovernanceItemInput) => {
      if (!actor) throw new Error("No actor");
      return actor.updateGovernanceItem(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["governanceItems"] });
      qc.invalidateQueries({ queryKey: ["governanceSummary"] });
      toast.success("Governance item updated");
    },
    onError: () => toast.error("Failed to update governance item"),
  });
}

export function useDeleteGovernanceItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteGovernanceItem(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["governanceItems"] });
      qc.invalidateQueries({ queryKey: ["governanceSummary"] });
      toast.success("Governance item deleted");
    },
    onError: () => toast.error("Failed to delete governance item"),
  });
}

// ── Compliance ─────────────────────────────────────────────────────────────

export function useComplianceFrameworks() {
  const { actor, isFetching } = useActor();
  return useQuery<ComplianceFramework[]>({
    queryKey: ["complianceFrameworks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComplianceFrameworks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useComplianceControls(frameworkId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ComplianceControl[]>({
    queryKey: ["complianceControls", frameworkId?.toString()],
    queryFn: async () => {
      if (!actor || frameworkId === null) return [];
      return actor.getComplianceControls(frameworkId);
    },
    enabled: !!actor && !isFetching && frameworkId !== null,
  });
}

export function useComplianceScores() {
  const { actor, isFetching } = useActor();
  return useQuery<ComplianceScores[]>({
    queryKey: ["complianceScores"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getComplianceScores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateComplianceControl() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateComplianceControlInput) => {
      if (!actor) throw new Error("No actor");
      return actor.updateComplianceControl(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complianceControls"] });
      qc.invalidateQueries({ queryKey: ["complianceScores"] });
      toast.success("Control status updated");
    },
    onError: () => toast.error("Failed to update control"),
  });
}

export function useInitializeGRCData() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.initializeGRCData();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["complianceFrameworks"] });
      qc.invalidateQueries({ queryKey: ["complianceScores"] });
      qc.invalidateQueries({ queryKey: ["complianceControls"] });
      qc.invalidateQueries({ queryKey: ["risks"] });
      qc.invalidateQueries({ queryKey: ["riskStats"] });
      qc.invalidateQueries({ queryKey: ["governanceItems"] });
      qc.invalidateQueries({ queryKey: ["governanceSummary"] });
      toast.success("GRC sample data initialized successfully");
    },
    onError: () => toast.error("Failed to initialize GRC data"),
  });
}

export type {
  ComplianceControl,
  ComplianceFramework,
  ComplianceScores,
  Document,
  DocumentStatus,
  GovernanceItem,
  GovernanceSummary,
  RiskItem,
  RiskStats,
  Tenant,
  UserApprovalInfo,
};
export type {
  GovAttachmentMeta,
  GovFrameworkMapping,
  UploadedDocumentMeta,
} from "../types/blobStorage";
export { ApprovalStatus, ControlStatus };

// ── SSO Config ─────────────────────────────────────────────────────────────

export function useGetSSOConfig() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["ssoConfig"],
    queryFn: async () => {
      if (!actor) return null;
      const a = actor as any;
      if (typeof a.getSSOConfig !== "function") return null;
      return a.getSSOConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetSSOConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: any) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      await a.setSSOConfig(config);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ssoConfig"] });
      toast.success("SSO settings saved successfully");
    },
    onError: () => toast.error("Failed to save SSO settings"),
  });
}

// ── Uploaded Documents (Backend Blob Storage) ──────────────────────────────

export function useGetUploadedDocuments() {
  const { actor, isFetching } = useActor();
  return useQuery<UploadedDocumentMeta[]>({
    queryKey: ["uploadedDocuments"],
    queryFn: async () => {
      if (!actor) return [];
      const a = actor as any;
      if (typeof a.getUploadedDocuments !== "function") return [];
      return a.getUploadedDocuments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUploadedDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      title,
      clauseNumber,
      onProgress,
    }: {
      file: File;
      title: string;
      clauseNumber: string;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      if (typeof a.addUploadedDocument !== "function") {
        throw new Error("addUploadedDocument not available");
      }
      const blobUrl = await uploadFileToStorage(file, onProgress);
      return a.addUploadedDocument(
        title,
        clauseNumber,
        file.name,
        BigInt(file.size),
        blobUrl,
      ) as Promise<bigint>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uploadedDocuments"] });
      toast.success("Document uploaded successfully");
    },
    onError: () => toast.error("Failed to upload document"),
  });
}

export function useDeleteUploadedDocument() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      if (typeof a.deleteUploadedDocument !== "function") {
        throw new Error("deleteUploadedDocument not available");
      }
      await a.deleteUploadedDocument(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uploadedDocuments"] });
      toast.success("Document deleted");
    },
    onError: () => toast.error("Failed to delete document"),
  });
}

// ── Governance Attachments & Framework Mappings (Backend) ──────────────────

export function useGetGovernanceAttachments() {
  const { actor, isFetching } = useActor();
  return useQuery<Map<string, GovAttachmentMeta>>({
    queryKey: ["govAttachments"],
    queryFn: async () => {
      if (!actor) return new Map();
      const a = actor as any;
      if (typeof a.getGovernanceAttachments !== "function") return new Map();
      const pairs: Array<[bigint, GovAttachmentMeta]> =
        await a.getGovernanceAttachments();
      return new Map(pairs.map(([id, meta]) => [id.toString(), meta]));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetGovernanceAttachment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      governanceItemId,
      file,
      onProgress,
    }: {
      governanceItemId: bigint;
      file: File;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      if (typeof a.setGovernanceAttachment !== "function") {
        throw new Error("setGovernanceAttachment not available");
      }
      const blobUrl = await uploadFileToStorage(file, onProgress);
      await a.setGovernanceAttachment(
        governanceItemId,
        file.name,
        BigInt(file.size),
        blobUrl,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["govAttachments"] });
    },
    onError: () => toast.error("Failed to upload attachment"),
  });
}

export function useDeleteGovernanceAttachment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (governanceItemId: bigint) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      if (typeof a.deleteGovernanceAttachment !== "function") return;
      await a.deleteGovernanceAttachment(governanceItemId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["govAttachments"] });
    },
    onError: () => toast.error("Failed to delete attachment"),
  });
}

export function useGetGovernanceFrameworkMappings() {
  const { actor, isFetching } = useActor();
  return useQuery<Map<string, GovFrameworkMapping>>({
    queryKey: ["govFrameworkMappings"],
    queryFn: async () => {
      if (!actor) return new Map();
      const a = actor as any;
      if (typeof a.getGovernanceFrameworkMappings !== "function")
        return new Map();
      const pairs: Array<[bigint, GovFrameworkMapping]> =
        await a.getGovernanceFrameworkMappings();
      return new Map(pairs.map(([id, fw]) => [id.toString(), fw]));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetGovernanceFrameworkMapping() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      governanceItemId,
      frameworkId,
      frameworkName,
    }: {
      governanceItemId: bigint;
      frameworkId: bigint;
      frameworkName: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      if (typeof a.setGovernanceFrameworkMapping !== "function") return;
      await a.setGovernanceFrameworkMapping(
        governanceItemId,
        frameworkId,
        frameworkName,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["govFrameworkMappings"] });
    },
    onError: () => toast.error("Failed to save framework mapping"),
  });
}

export function useDeleteGovernanceFrameworkMapping() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (governanceItemId: bigint) => {
      if (!actor) throw new Error("No actor");
      const a = actor as any;
      if (typeof a.deleteGovernanceFrameworkMapping !== "function") return;
      await a.deleteGovernanceFrameworkMapping(governanceItemId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["govFrameworkMappings"] });
    },
    onError: () => toast.error("Failed to delete framework mapping"),
  });
}
