export interface UploadedDocumentMeta {
  id: bigint;
  title: string;
  clauseNumber: string;
  fileName: string;
  fileSize: bigint;
  blobUrl: string;
  uploadedAt: bigint;
}

export interface GovAttachmentMeta {
  fileName: string;
  fileSize: bigint;
  blobUrl: string;
  uploadedAt: bigint;
}

export interface GovFrameworkMapping {
  frameworkId: bigint;
  frameworkName: string;
}
