import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Tenant {
    id: bigint;
    domain: string;
    ownerPrincipal: Principal;
    name: string;
    createdAt: bigint;
}
export interface MitigationControl {
    controlName: string;
    maturityLevel: MaturityLevel;
    controlId: string;
}
export interface TenantOrg {
    id: string;
    domain: string;
    createdAt: bigint;
    companyName: string;
}
export interface GovFrameworkMapping {
    frameworkName: string;
    frameworkId: bigint;
}
export interface GovernanceSummary {
    total: bigint;
    byStatus: Array<[GovernanceStatus, bigint]>;
    byCategory: Array<[GovernanceCategory, bigint]>;
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
export interface CreateGovernanceItemInput {
    title: string;
    owner: string;
    approvedBy: string;
    reviewDate: string;
    description: string;
    category: GovernanceCategory;
}
export interface RiskStats {
    avgResidualScore: bigint;
    total: bigint;
    byLevel: Array<[RiskLevel, bigint]>;
    avgInherentScore: bigint;
    byStatus: Array<[RiskStatus, bigint]>;
}
export interface TenantUserLoginResponse {
    id: string;
    domain: string;
    role: string;
    fullName: string;
    email: string;
    companyName: string;
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
export interface TenantCreateInput {
    domain: string;
    name: string;
}
export interface ComplianceFramework {
    id: bigint;
    name: string;
    description: string;
    version: string;
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
    tenantId: bigint;
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
export interface UploadedDocumentMeta {
    id: bigint;
    title: string;
    blobUrl: string;
    fileName: string;
    fileSize: bigint;
    uploadedAt: bigint;
    clauseNumber: string;
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
export interface UpdateComplianceControlInput {
    id: bigint;
    status?: ControlStatus;
    owner?: string;
    evidence?: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface TenantUser {
    id: string;
    domain: string;
    createdAt: bigint;
    role: string;
    fullName: string;
    email: string;
    approved: boolean;
    companyName: string;
    passwordHash: string;
}
export type TenantLoginResult = {
    __kind__: "ok";
    ok: TenantUserLoginResponse;
} | {
    __kind__: "invalidEmail";
    invalidEmail: null;
} | {
    __kind__: "userNotFound";
    userNotFound: null;
} | {
    __kind__: "invalidPassword";
    invalidPassword: null;
} | {
    __kind__: "internalError";
    internalError: null;
} | {
    __kind__: "notApproved";
    notApproved: null;
};
export interface GovAttachmentMeta {
    blobUrl: string;
    fileName: string;
    fileSize: bigint;
    uploadedAt: bigint;
}
export interface SSOConfig {
    idpIssuerUrl: string;
    idpClientId: string;
    allowedDomains: Array<string>;
    enabled: boolean;
    notes: string;
    idpName: string;
    requireDomainWhitelist: boolean;
}
export interface UserRegistrationInput {
    domain: string;
    password: string;
    fullName: string;
    email: string;
    companyName: string;
}
export interface UserProfile {
    name: string;
    email: string;
    department: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
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
export enum RegistrationResult {
    ok = "ok",
    userAlreadyExists = "userAlreadyExists",
    invalidInput = "invalidInput",
    domainAlreadyRegistered = "domainAlreadyRegistered"
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
    addUploadedDocument(title: string, clauseNumber: string, fileName: string, fileSize: bigint, blobUrl: string): Promise<bigint>;
    approveTenantUser(userId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignUserToTenant(user: Principal, tenantId: bigint): Promise<void>;
    createComplianceControl(input: CreateComplianceControlInput): Promise<bigint>;
    createGovernanceItem(input: CreateGovernanceItemInput): Promise<bigint>;
    createRisk(input: CreateRiskInput): Promise<bigint>;
    createTenant(input: TenantCreateInput): Promise<bigint>;
    deleteGovernanceAttachment(governanceItemId: bigint): Promise<void>;
    deleteGovernanceFrameworkMapping(governanceItemId: bigint): Promise<void>;
    deleteGovernanceItem(id: bigint): Promise<void>;
    deleteRisk(id: bigint): Promise<void>;
    deleteTenant(id: bigint): Promise<void>;
    deleteUploadedDocument(id: bigint): Promise<void>;
    getCallerTenant(): Promise<Tenant | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComplianceControls(frameworkId: bigint): Promise<Array<ComplianceControl>>;
    getComplianceFrameworks(): Promise<Array<ComplianceFramework>>;
    getComplianceScores(): Promise<Array<ComplianceScores>>;
    getGovernanceAttachment(governanceItemId: bigint): Promise<GovAttachmentMeta | null>;
    getGovernanceAttachments(): Promise<Array<[bigint, GovAttachmentMeta]>>;
    getGovernanceFrameworkMappings(): Promise<Array<[bigint, GovFrameworkMapping]>>;
    getGovernanceItems(): Promise<Array<GovernanceItem>>;
    getGovernanceSummary(): Promise<GovernanceSummary>;
    getRiskById(id: bigint): Promise<RiskItem | null>;
    getRiskStats(): Promise<RiskStats>;
    getRisks(): Promise<Array<RiskItem>>;
    getRisksByTenant(tenantId: bigint): Promise<Array<RiskItem>>;
    getSSOConfig(): Promise<SSOConfig>;
    getTenantOrg(domain: string): Promise<TenantOrg | null>;
    getUploadedDocuments(): Promise<Array<UploadedDocumentMeta>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserTenant(user: Principal): Promise<Tenant | null>;
    initializeGRCData(): Promise<void>;
    initializeISMSRepository(): Promise<void>;
    isAdminAssigned(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listTenantUsers(): Promise<Array<TenantUser>>;
    listTenants(): Promise<Array<Tenant>>;
    registerTenantUser(input: UserRegistrationInput): Promise<RegistrationResult>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setGovernanceAttachment(governanceItemId: bigint, fileName: string, fileSize: bigint, blobUrl: string): Promise<void>;
    setGovernanceFrameworkMapping(governanceItemId: bigint, frameworkId: bigint, frameworkName: string): Promise<void>;
    setSSOConfig(config: SSOConfig): Promise<void>;
    tenantLogin(email: string, password: string): Promise<TenantLoginResult>;
    updateComplianceControl(input: UpdateComplianceControlInput): Promise<ComplianceControl>;
    updateGovernanceItem(input: UpdateGovernanceItemInput): Promise<GovernanceItem>;
    updateRisk(input: UpdateRiskInput): Promise<RiskItem>;
    createRiskAsTenantUser(userId: string, input: CreateRiskInput): Promise<bigint>;
    getRisksAsTenantUser(userId: string): Promise<Array<RiskItem>>;
    updateRiskAsTenantUser(userId: string, input: UpdateRiskInput): Promise<RiskItem>;
    deleteRiskAsTenantUser(userId: string, id: bigint): Promise<void>;
    getTenantUsersForDomain(domain: string): Promise<Array<any>>;
    getGovernanceItemsAsTenantUser(userId: string): Promise<Array<GovernanceItem>>;
    createGovernanceItemAsTenantUser(userId: string, input: CreateGovernanceItemInput): Promise<bigint>;
    updateGovernanceItemAsTenantUser(userId: string, input: UpdateGovernanceItemInput): Promise<GovernanceItem>;
}
