# CybXSan GRC Platform — Enterprise Grade Upgrade

## Current State
- Multi-tenant GRC SaaS platform (CybXSan) with dark/light theme
- Color system uses 0-chroma OKLCH (pure grayscale) tokens — no branded color identity
- Dashboard has stat cards, compliance bars, risk distribution but lacks charts/data viz
- Login pages have gradient orbs but feel basic for enterprise SaaS
- Layout sidebar is functional but lacks polish (no icons accented, no clear visual hierarchy)
- Risk Register has tables, matrices, export — but styling is plain
- Compliance Standards page has control lists — layout is dense
- All pages functional but look like a starter template, not enterprise software

## Requested Changes (Diff)

### Add
- Proper brand color tokens: cyan/teal primary (oklch ~0.65 0.18 200) for dark mode, deep navy primary for light mode
- A real data visualization section on Dashboard: bar/area chart for risk trend by category using recharts (already bundled in shadcn)
- Audit log / recent activity feed section on Dashboard
- "Quick Actions" bar on Dashboard for common tasks
- Better stat card design: gradient borders, glow effects on hover, trend indicators
- Notification dot on admin nav item when there are pending approvals
- Professional page headers with breadcrumb-style context and action buttons
- Better empty states with icons and call-to-action
- Improved sidebar: company/tenant badge, active state with left accent bar
- Smooth page transition animations
- Loading shimmer animations (already skeleton, but more polished)
- Trust Center public page: better visual trust score display

### Modify
- `index.css`: Update ALL OKLCH tokens to use cyan/teal-based primary (chroma > 0) for both light and dark modes. Dark mode: deep charcoal backgrounds (navy-black), cyan primary (~0.65 0.18 200). Light mode: white bg, deep navy primary (~0.28 0.12 240).
- `Layout.tsx`: Sidebar active item gets a left accent bar (2px cyan line), better icon+label treatment, avatar initials for user instead of just email text
- `Dashboard.tsx`: Add recharts BarChart for risk distribution (replace the basic list), add a compliance radar-style display, add recent activity section
- `Login.tsx` and `TenantLogin.tsx`/`TenantSignUp.tsx`: More polished card with glass morphism style, better form spacing, enterprise-grade visual
- `RiskRegister.tsx`: Better table header styling, sortable column indicators, search bar at top, cleaner risk level badges with proper colors
- `ComplianceStandards.tsx`: Better control list layout with status pills that are more visually distinct
- `WordMark.tsx`: Ensure the CybXSan gradient wordmark looks sharp
- All page titles: consistent pattern with icon + title + subtitle
- `index.css` / global styles: Add `.stat-card-glow` proper glow, sidebar-grid background pattern, glass card style

### Remove
- Caffeine.ai footer attribution (replace with CybXSan copyright)
- Any plain grayscale primary color values

## Implementation Plan
1. Update `index.css` with enterprise color tokens (cyan primary for dark, navy for light), improved CSS utilities (stat-card-glow, glass card, sidebar accent bar)
2. Update `Layout.tsx` sidebar with left accent bar on active items, better user info display with avatar initials
3. Update `Dashboard.tsx` with recharts BarChart for risk data, better stat cards with trend indicators, replace caffeine footer with CybXSan branding
4. Polish `Login.tsx`, `TenantLogin.tsx`, `TenantSignUp.tsx` with better card/form design
5. Improve `RiskRegister.tsx` table header styling and search UX
6. Update `ComplianceStandards.tsx` with better status badges and layout
7. Validate and fix any type/build errors
