import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UpdateRiskInput {
    id: bigint;
    treatmentNotes?: string;
    impact?: bigint;
    title?: string;
    treatment?: RiskTreatment;
    dueDate?: string;
    description?: string;
    mitigationControls?: Array<MitigationControl>;
    vulnerability?: string;
    treatmentOwner?: string;
    treatmentPlanOwner?: string;
    threatCategory?: ThreatCategory;
    treatmentPlanReviewDate?: string;
    treatmentPlanDescription?: string;
    likelihood?: bigint;
    treatmentPlanTargetDate?: string;
}
export interface RiskItem {
    id: bigint;
    treatmentNotes: string;
    status: RiskStatus;
    impact: bigint;
    title: string;
    createdAt: bigint;
    treatment: RiskTreatment;
    dueDate: string;
    description: string;
    mitigationControls: Array<MitigationControl>;
    residualRiskScore: bigint;
    updatedAt: bigint;
    vulnerability: string;
    treatmentOwner: string;
    treatmentPlanOwner: string;
    threatCategory: ThreatCategory;
    treatmentPlanReviewDate: string;
    inherentRiskScore: bigint;
    treatmentPlanDescription: string;
    likelihood: bigint;
    riskLevel: RiskLevel;
    treatmentPlanTargetDate: string;
}
export interface GovernanceItem {
    id: bigint;
    status: GovernanceStatus;
    title: string;
    owner: string;
    approvedBy: string;
    createdAt: bigint;
    reviewDate: string;
    description: string;
    updatedAt: bigint;
    category: GovernanceCategory;
}
export interface MitigationControl {
    controlName: string;
    maturityLevel: MaturityLevel;
    controlId: string;
}
export interface ComplianceScores {
    frameworkName: string;
    total: bigint;
    score: bigint;
    implemented: bigint;
}
export interface CreateComplianceControlInput {
    status: ControlStatus;
    controlName: string;
    owner: string;
    description: string;
    frameworkId: bigint;
    controlId: string;
    evidence: string;
}
export interface UpdateComplianceControlInput {
    id: bigint;
    status?: ControlStatus;
    owner?: string;
    evidence?: string;
}
export interface UpdateGovernanceItemInput {
    id: bigint;
    status?: GovernanceStatus;
    title?: string;
    owner?: string;
    approvedBy?: string;
    reviewDate?: string;
    description?: string;
    category?: GovernanceCategory;
}
export interface GovernanceSummary {
    total: bigint;
    byStatus: Array<[GovernanceStatus, bigint]>;
    byCategory: Array<[GovernanceCategory, bigint]>;
}
export interface CreateGovernanceItemInput {
    title: string;
    owner: string;
    approvedBy: string;
    reviewDate: string;
    description: string;
    category: GovernanceCategory;
}
export interface ComplianceControl {
    id: bigint;
    status: ControlStatus;
    controlName: string;
    owner: string;
    description: string;
    frameworkId: bigint;
    updatedAt: bigint;
    controlId: string;
    evidence: string;
}
export interface RiskStats {
    avgResidualScore: bigint;
    total: bigint;
    byLevel: Array<[RiskLevel, bigint]>;
    avgInherentScore: bigint;
    byStatus: Array<[RiskStatus, bigint]>;
}
export interface CreateRiskInput {
    treatmentNotes: string;
    impact: bigint;
    title: string;
    treatment: RiskTreatment;
    dueDate: string;
    description: string;
    mitigationControls: Array<MitigationControl>;
    vulnerability: string;
    treatmentOwner: string;
    treatmentPlanOwner: string;
    threatCategory: ThreatCategory;
    treatmentPlanReviewDate: string;
    treatmentPlanDescription: string;
    likelihood: bigint;
    treatmentPlanTargetDate: string;
}
export interface ComplianceFramework {
    id: bigint;
    name: string;
    description: string;
    version: string;
}
export interface UserProfile {
    name: string;
    email: string;
    department: string;
}
export enum ControlStatus {
    notImplemented = "notImplemented",
    partiallyImplemented = "partiallyImplemented",
    fullyImplemented = "fullyImplemented",
    notApplicable = "notApplicable"
}
export enum GovernanceCategory {
    actionItem = "actionItem",
    committee = "committee",
    meeting = "meeting",
    policy = "policy"
}
export enum GovernanceStatus {
    active = "active",
    underReview = "underReview",
    draft = "draft",
    retired = "retired"
}
export enum MaturityLevel {
    low = "low",
    high = "high",
    veryLow = "veryLow",
    critical = "critical",
    medium = "medium"
}
export enum RiskLevel {
    low = "low",
    high = "high",
    critical = "critical",
    medium = "medium"
}
export enum RiskStatus {
    closed = "closed",
    open = "open",
    inTreatment = "inTreatment"
}
export enum RiskTreatment {
    accept = "accept",
    avoid = "avoid",
    mitigate = "mitigate",
    transfer = "transfer"
}
export enum ThreatCategory {
    nonHostileOutsiders = "nonHostileOutsiders",
    hostileInsiders = "hostileInsiders",
    legal = "legal",
    dependencyProblems = "dependencyProblems",
    hostileOutsiders = "hostileOutsiders",
    environmental = "environmental",
    technicalProblems = "technicalProblems",
    nonHostileInsiders = "nonHostileInsiders"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createComplianceControl(input: CreateComplianceControlInput): Promise<bigint>;
    createGovernanceItem(input: CreateGovernanceItemInput): Promise<bigint>;
    createRisk(input: CreateRiskInput): Promise<bigint>;
    deleteGovernanceItem(id: bigint): Promise<void>;
    deleteRisk(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComplianceControls(frameworkId: bigint): Promise<Array<ComplianceControl>>;
    getComplianceFrameworks(): Promise<Array<ComplianceFramework>>;
    getComplianceScores(): Promise<Array<ComplianceScores>>;
    getGovernanceItems(): Promise<Array<GovernanceItem>>;
    getGovernanceSummary(): Promise<GovernanceSummary>;
    getRiskById(id: bigint): Promise<RiskItem | null>;
    getRiskStats(): Promise<RiskStats>;
    getRisks(): Promise<Array<RiskItem>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeGRCData(): Promise<void>;
    initializeISMSRepository(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateComplianceControl(input: UpdateComplianceControlInput): Promise<ComplianceControl>;
    updateGovernanceItem(input: UpdateGovernanceItemInput): Promise<GovernanceItem>;
    updateRisk(input: UpdateRiskInput): Promise<RiskItem>;
}
