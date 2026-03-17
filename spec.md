# GRC Platform

## Current State
The app stores uploaded files (document repository uploads and governance attachments) in `localStorage` (browser-only). Framework mappings for governance items are also in `localStorage`. These disappear when the user clears their browser or accesses from another device.

## Requested Changes (Diff)

### Add
- Backend functions to store document uploads: title, clauseNumber, fileName, fileSize, uploadedAt — with the file itself stored in blob-storage
- Backend functions to store governance attachment metadata and the actual file in blob-storage
- Backend functions to store governance item → compliance framework mappings persistently
- `getUploadedDocuments` / `deleteUploadedDocument` / `getGovernanceAttachments` / `deleteGovernanceAttachment` / `getGovernanceFrameworkMappings` / `setGovernanceFrameworkMapping` / `deleteGovernanceFrameworkMapping` backend API

### Modify
- `Documents.tsx`: replace `localStorage` with backend blob-storage upload/list/delete calls
- `Governance.tsx`: replace `localStorage` with backend blob-storage calls for file attachments and framework mappings
- `useQueries.ts`: add hooks for blob-based document and governance attachment operations

### Remove
- All `localStorage.setItem/getItem` calls for document uploads, governance attachments, and framework mappings

## Implementation Plan
1. Generate Motoko backend with blob-storage integration and new API endpoints for document uploads, governance attachments, and framework mappings
2. Update frontend pages to use blob-storage HTTP URLs for download and the new backend hooks
