# CybXSan GRC Platform

## Current State
- Hardcoded super admin email `sanjoykarmakar.hclcdc@gmail.com` in backend; any deploy auto-promotes that email to admin
- Only two effective role levels: `admin` (Internet Identity) and tenant user (email/password)
- No first-run setup wizard; admin claim relies on Caffeine token URL or hardcoded email
- GRC frameworks fixed globally; tenants cannot select or customize their own frameworks
- No tenant onboarding flow after first login
- Tenant admin role is a text string with no enforcement
- No GRC Settings page per tenant
- Compliance control-to-governance mappings stored only in browser localStorage (not backend)

## Requested Changes (Diff)

### Add
- `isPlatformSetupDone()` backend query — returns Bool
- `claimPlatformAdmin(licenseKey: Text)` backend function — only works when no admin assigned; caller must provide a valid license key stored in the canister; promotes caller to platform admin
- `setLicenseKey(key: Text)` backend function (platform admin only, one-time)
- `getTenantSettings(domain: Text)` and `saveTenantSettings(domain: Text, settings: TenantSettings)` — store per-tenant config: selected frameworks, risk appetite thresholds, custom org profile
- `completeTenantOnboarding(userId: Text, input: OnboardingInput)` — saves company profile, selected frameworks, marks onboarding done for that tenant
- `isTenantOnboardingDone(userId: Text)` — query
- `setControlGovernanceLink(tenantDomain: Text, controlId: Text, governanceIds: [Text])` and `getControlGovernanceLinks(tenantDomain: Text)` — persist compliance mappings to backend (fixes the localStorage-only issue)
- PlatformSetup page component — shown when `isAdminAssigned()` returns false; collects a license key, authenticates via Internet Identity, promotes to Platform Admin
- TenantOnboarding wizard component — 3-step: (1) company profile, (2) select compliance frameworks, (3) invite team; shown to tenant admin on first login
- GRCSettings page — accessible from sidebar for tenant admins; allows selecting active frameworks, setting risk appetite (Low/Medium/High thresholds), customizing org profile
- Tenant Admin role enforcement — tenant users with role `admin` can access GRC Settings and User Management; regular tenant users cannot

### Modify
- Remove `DESIGNATED_ADMIN_EMAIL` constant and all references from backend
- `saveCallerUserProfile` — remove the auto-promote-by-email logic
- Navigation sidebar — add GRC Settings link for tenant admins; update role checks to use 3-level hierarchy
- App.tsx routing — add `platformSetup`, `grcSettings`, `tenantOnboarding` pages/views
- Compliance Standards page — replace localStorage mappings with backend `setControlGovernanceLink` / `getControlGovernanceLinks`
- Dashboard and Trust Center — re-read compliance scores after governance-derived status updates using backend-persisted mappings
- Admin Panel — show current license key status (set/not set); allow Platform Admin to set license key

### Remove
- Hardcoded `DESIGNATED_ADMIN_EMAIL` from main.mo
- localStorage-based governance-control mappings in ComplianceStandards page

## Implementation Plan
1. Regenerate Motoko backend with all new functions listed above
2. Update frontend backend.ts bindings
3. Build PlatformSetup page
4. Build TenantOnboarding wizard
5. Build GRCSettings page
6. Update App.tsx routing and auth flow
7. Update sidebar navigation for role-based access
8. Update ComplianceStandards page to use backend mappings
9. Update Dashboard + TrustCenter to read backend-persisted compliance scores
