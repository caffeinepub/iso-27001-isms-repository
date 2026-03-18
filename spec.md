# CybXSan GRC Platform

## Current State
Uses Internet Identity for all users. No email/password login option.

## Requested Changes (Diff)

### Add
- Tenant Sign Up page: full name, email, password, company name, domain
- Tenant Login page: email and password
- Backend: registerTenantUser, tenantLogin, stable storage for tenant users/orgs
- Main login page: two paths (Admin via Internet Identity, Tenant via email/password)

### Modify
- main.mo: add tenant auth functions
- App.tsx: routes for /tenant-login and /tenant-signup, tenant session state
- Login.tsx: two-path UI

### Remove
- Nothing

## Implementation Plan
1. Update backend with TenantUser type, stable storage, registerTenantUser, tenantLogin
2. Add TenantLogin.tsx and TenantSignUp.tsx pages
3. Update Login.tsx for two-path login
4. Update App.tsx with new routes and tenant session
