# CybXSan GRC Platform

## Current State
- Multi-tenant GRC platform with Internet Identity admin auth and email/password tenant user auth
- Risk register, compliance, governance, document repository, dashboard modules
- Tenant data isolation: `getRisks()` and `getRisksAsTenantUser(userId)` both filter by tenant on backend
- `createRiskAsTenantUser` exists but hardcodes `status = #open`, ignoring input status
- No `updateRiskAsTenantUser` backend method; tenant users' edit calls fall through to II actor path and fail
- No tenant user management page for tenant organizations to manage their own users
- Dashboard stats use separate query paths for admin vs tenant users

## Requested Changes (Diff)

### Add
- `updateRiskAsTenantUser(userId: Text, input: UpdateRiskInput)` backend method: looks up tenant by userId string, verifies risk belongs to that tenant, updates all fields including status
- `getTenantUsersForDomain(domain: Text)` backend method: returns all tenant users for a given domain (for tenant org admins)
- `updateTenantUserRole(userId: Text, role: Text)` backend method: allows updating a tenant user's role within their org
- Tenant User Management page (`/tenant/users`): accessible to tenant users, shows users in the same domain/org, allows adding new users and changing roles
- Navigation link to User Management for tenant users in sidebar

### Modify
- `createRiskAsTenantUser`: pass `input.status` through instead of hardcoding `#open`
- Frontend RiskRegister: use `updateRiskAsTenantUser` hook when current user is a tenant user
- Dashboard: ensure stats are correctly tenant-scoped for tenant users

### Remove
- Nothing

## Implementation Plan
1. Add `updateRiskAsTenantUser` to backend with full field support including status
2. Fix `createRiskAsTenantUser` to pass status from input
3. Add `getTenantUsersForDomain` and `updateTenantUserRole` backend methods
4. Frontend: wire new hooks for tenant user risk update
5. Frontend: build Tenant User Management page with user list, add user form, role change
6. Frontend: add navigation link for tenant users
7. Verify dashboard stats are correctly tenant-scoped
