// Local Document types (previously from backend, now defined locally)
export enum DocumentStatus {
  notStarted = "notStarted",
  inProgress = "inProgress",
  completed = "completed",
  approved = "approved",
}

export interface Document {
  id: bigint;
  title: string;
  clauseNumber: string;
  clauseName: string;
  controlNumber: string;
  controlName: string;
  description: string;
  status: DocumentStatus;
  owner: string;
  version: string;
  isAnnexA: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  fileUrl: string;
  fileSize: bigint;
  fileId: string;
}
