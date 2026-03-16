import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Document {
    id: bigint;
    status: DocumentStatus;
    controlName: string;
    title: string;
    controlNumber: string;
    owner: string;
    createdAt: bigint;
    clauseName: string;
    description: string;
    updatedAt: bigint;
    fileId?: string;
    isAnnexA: boolean;
    clauseNumber: string;
}
export enum DocumentStatus {
    notStarted = "notStarted",
    completed = "completed",
    approved = "approved",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getDocumentById(id: bigint): Promise<Document>;
    getDocuments(): Promise<Array<Document>>;
    initializeISMSRepository(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
}
