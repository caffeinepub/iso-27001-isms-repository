# CybXSan GRC Platform

## Current State
- Tenant users login with email/password; session stored in localStorage
- All backend calls use Internet Identity principal (anonymous for tenant users)
- `getCallerTenantId(caller)` uses `userTenantMap` (II principals only), returns 0 for tenant users
- Result: tenant users see Global/seed data (tenantId=0), get "not assigned to org" error on add
- Admin Tenants tab: can create org tenants but no option to create tenant users directly
- Compliance/Governance also use callerTenantId which is broken for tenant users

## Requested Changes (Diff)

### Add
- Backend: `getRisksAsTenantUser(userId: Text)` - looks up user's domain → org → filters risks
- Backend: `createRiskAsTenantUser(userId: Text, input: CreateRiskInput)` - assigns risk to user's org
- Backend: `getGovernanceItemsAsTenantUser(userId: Text)`
- Backend: `getComplianceFrameworksAsTenantUser(userId: Text)` 
- Backend: `createTenantUserByAdmin(input: AdminCreateTenantUserInput)` - admin creates pre-approved tenant user
- Frontend: TenantUserContext to pass tenantUser to all pages
- Frontend: Admin Tenants tab - "Create Tenant User" button/dialog

### Modify
- RiskRegister: if tenantUser in context, use `getRisksAsTenantUser` and `createRiskAsTenantUser`; `hasTenant = true` for tenant users
- ComplianceStandards: filter by tenantUser's domain/org
- Governance: filter by tenantUser's domain/org
- App.tsx: provide TenantUserContext wrapping authenticated tenant user views
- Backend: seed data with tenantId=0 should NOT be shown to tenant users (only admins)

### Remove
- Nothing removed

## Implementation Plan
1. Backend: add tenant-user session APIs (by userId lookup) for risks, governance, compliance
2. Backend: add `createTenantUserByAdmin` (admin creates pre-approved tenant user)
3. Frontend: create TenantUserContext.tsx, wrap Layout with it
4. Frontend: RiskRegister reads tenantUser from context, uses correct APIs
5. Frontend: ComplianceStandards reads tenantUser from context, filters data
6. Frontend: Governance reads tenantUser from context, filters data
7. Frontend: Admin.tsx Tenants tab - add Create Tenant User card with form
