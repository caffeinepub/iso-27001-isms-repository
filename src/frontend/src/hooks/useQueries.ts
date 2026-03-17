import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
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
  type UpdateComplianceControlInput,
  type UpdateGovernanceItemInput,
  type UpdateRiskInput,
  UserRole,
} from "../backend";
import type { Document, DocumentStatus } from "../types/document";
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
};
export { ControlStatus };
