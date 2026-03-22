# CybXSan GRC Platform

## Current State
The Compliance Standards page shows controls for each framework with a manual status dropdown (Implemented/Partial/Not Implemented/N/A). The compliance score is calculated based on these manually set statuses. Governance items can be mapped to a framework (not to individual controls). There is no connection between specific governance items and specific compliance controls.

## Requested Changes (Diff)

### Add
- Backend: `setControlGovernanceMapping(controlId: bigint, govItemIds: [bigint])` — stores which governance items are linked to a specific control
- Backend: `getControlGovernanceMappings()` — returns all control-to-governance-item mappings
- Backend: `getControlGovernanceMappingsAsTenantUser(userId: string)` — tenant user version
- Frontend: For each control row, show a "Linked Governance Items" section listing all governance items currently mapped to that control (with their status badge)
- Frontend: A "Link Governance Items" button/panel per control that opens a popover/dialog to select governance items from the same framework
- Frontend: Auto-compute control status based on linked governance items:
  - If 1+ linked governance items exist and ALL are "Active" → Fully Implemented
  - If some are Active but not all → Partially Implemented
  - If linked items exist but none are Active → Not Implemented
  - If no linked items → Not Implemented (compliance score stays 0 for this control)
- Frontend: Override manual status only when governance items are linked; if no items linked, status remains manually settable
- Frontend: Compliance score is computed from auto-assigned statuses (not manual overrides when governance-mapped)

### Modify
- `ComplianceStandards.tsx`: Each control row now shows linked governance items and a "Link" action
- Compliance score cards recalculate in real-time based on governance-linked status
- The status select dropdown should show as read-only / derived when governance items are linked

### Remove
- Nothing removed; manual status editing remains available for controls with no governance item links

## Implementation Plan
1. Generate Motoko backend with new `setControlGovernanceMapping` / `getControlGovernanceMappings` / `getControlGovernanceMappingsAsTenantUser` functions
2. Add `useGetControlGovernanceMappings`, `useSetControlGovernanceMapping` hooks in `useQueries.ts`
3. Rewrite `FrameworkControls` component to:
   a. Fetch all governance items for the current framework
   b. Fetch all control-governance mappings
   c. For each control, show linked governance items inline
   d. Show a "Link" button that opens a multi-select dialog
   e. Auto-derive control status from linked governance items
4. Recalculate compliance score locally from derived statuses
5. Support tenant user isolation for mappings
