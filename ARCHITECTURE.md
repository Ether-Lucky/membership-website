# Membership Management System — Architecture Guide

## 1. Folder Structure

```
membership-app/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (member)/
│   │   ├── _layout.tsx           # Protected member layout
│   │   ├── dashboard.tsx
│   │   ├── id-card.tsx
│   │   └── pending.tsx
│   ├── (admin)/
│   │   ├── _layout.tsx           # Protected admin layout
│   │   ├── dashboard.tsx
│   │   ├── members/
│   │   │   ├── index.tsx         # Member list
│   │   │   └── [id].tsx          # Member detail / approve / reject
│   │   └── pending.tsx
│   ├── verify/
│   │   └── [membershipNumber].tsx  # Public verification page
│   └── index.tsx                 # Root redirect
│
├── src/
│   ├── components/               # Reusable UI
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── member/
│   │   │   ├── DigitalIDCard.tsx
│   │   │   ├── MemberCard.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── admin/
│   │   │   ├── MemberTable.tsx
│   │   │   ├── ApplicationCard.tsx
│   │   │   └── StatsWidget.tsx
│   │   └── verification/
│   │       ├── VerificationResult.tsx
│   │       └── QRScanner.tsx
│   │
│   ├── services/                 # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── member.service.ts
│   │   ├── admin.service.ts
│   │   ├── verification.service.ts
│   │   └── storage.service.ts    # Photo upload
│   │
│   ├── repositories/             # Data access layer
│   │   ├── member.repository.ts
│   │   ├── profile.repository.ts
│   │   └── verification.repository.ts
│   │
│   ├── hooks/                    # React hooks
│   │   ├── useAuth.ts
│   │   ├── useMember.ts
│   │   ├── useAdmin.ts
│   │   └── useVerification.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── member.types.ts
│   │   ├── admin.types.ts
│   │   └── database.types.ts     # Generated from Supabase
│   │
│   ├── constants/
│   │   ├── theme.ts
│   │   ├── routes.ts
│   │   └── config.ts
│   │
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatters.ts
│   │   └── qr.ts
│   │
│   └── lib/
│       └── supabase.ts           # Supabase client singleton
│
├── assets/
│   ├── logo.png
│   └── fonts/
│
├── .env.local                    # Never commit
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## 2. Architecture Decisions

### Why MVC + Repository Pattern?
- **Model** = Supabase tables + TypeScript types
- **View** = React Native components + screens
- **Controller** = Services layer (business logic) + hooks
- **Repository** = Data access abstraction (swap Supabase for any backend later)

### Why Expo Router?
- File-based routing mirrors Next.js — easy for web developers
- Route groups `(auth)`, `(member)`, `(admin)` enable layout-level protection
- Deep links work out of the box for QR verification URLs

### Why separate Services from Repositories?
- Repository: *how* data is fetched (Supabase query)
- Service: *what* business rules apply (e.g., can't approve an already-approved member)
- This separation means you can unit-test services by mocking the repository

---

## 3. API Design (Supabase Edge Functions)

All standard CRUD goes through the Supabase client SDK with RLS.
Edge Functions are used only where server-side logic is required.

### Edge Functions

#### POST /functions/v1/approve-member
- Auth: Admin JWT required
- Body: `{ memberId: string, adminId: string }`
- Action: Calls `approve_member()` PostgreSQL function
- Returns: `{ membershipNumber: string }`

#### POST /functions/v1/reject-member
- Auth: Admin JWT required
- Body: `{ memberId: string, adminId: string, reason?: string }`
- Action: Calls `reject_member()` PostgreSQL function

#### GET /functions/v1/verify/:membershipNumber
- Auth: Public (no JWT required)
- Action: Looks up member, logs verification attempt
- Returns: member details or error code
- Rate limited: 30 req/min per IP

### Supabase Client SDK calls (direct, via RLS)

| Operation | Table | Who |
|-----------|-------|-----|
| Register member | `members` INSERT | Self |
| Get own profile | `members` SELECT | Self |
| Get own ID card | `members` SELECT | Self (approved only) |
| List pending apps | `members` + `profiles` | Admin |
| Search members | `members` | Admin |
| Upload photo | Storage bucket `avatars` | Self |

---

## 4. Authentication Flow

```
User registers
    │
    ▼
supabase.auth.signUp()          ← Creates auth.users row
    │
    ▼
on_auth_user_created trigger    ← Auto-creates profiles row (status=pending)
    │
    ▼
Member fills registration form
    │
    ▼
INSERT into members table       ← Links to profiles via profile_id
    │
    ▼
Admin reviews application
    │
    ├─ Approve → approve_member() → membership_number assigned
    │
    └─ Reject  → reject_member()  → reason stored

On login:
supabase.auth.signInWithPassword()
    │
    ▼
Read profiles.role + profiles.status
    │
    ├─ admin    → redirect to /admin/dashboard
    ├─ approved → redirect to /member/dashboard
    └─ pending  → redirect to /member/pending
    └─ rejected → show rejection message
```

---

## 5. Digital ID Card Data Structure

```typescript
interface DigitalIDCard {
  membershipNumber: string;       // MEM-2026-000001
  fullName: string;               // First Middle Last
  photoUrl: string;               // Signed Supabase storage URL
  memberSince: string;            // ISO date → "January 2026"
  status: 'Active' | 'Suspended';
  qrCodeData: string;             // URL: https://yourapp.com/verify/MEM-2026-000001
  organizationName: string;
  organizationLogoUrl: string;
}
```

The QR code encodes the public verification URL so anyone with a phone camera can verify without installing the app.

---

## 6. Security Checklist

### Authentication
- [x] Supabase Auth handles password hashing (bcrypt)
- [x] JWT stored in SecureStore (not AsyncStorage)
- [x] Session refresh handled automatically by Supabase SDK
- [x] Protected routes check auth on every navigation

### Database
- [x] RLS enabled on all tables
- [x] Members can only read/update their own data
- [x] Admins cannot modify membership_number after approval (audit)
- [x] Sensitive operations (approve/reject) are SECURITY DEFINER functions
- [x] Input validation at service layer before DB writes

### API
- [x] Edge Functions validate JWT before any mutation
- [x] Verification endpoint is public but rate-limited
- [x] IP address logged on every verification attempt

### Storage
- [x] Photos uploaded to private Supabase bucket
- [x] Signed URLs (expire in 1 hour) used for display
- [x] File type validated on upload (image/jpeg, image/png only)
- [x] Max file size: 5MB enforced client-side + storage policy

### Recommendations (infra-level)
- Enable Supabase Auth email confirmation for production
- Add Cloudflare in front of the Supabase project URL
- Set up Supabase audit logging
- Add database backup schedule (daily minimum)

---

## 7. Environment Variables

```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # Server/Edge Functions only, NEVER expose
EXPO_PUBLIC_APP_URL=https://yourapp.com  # Used in QR code generation
```

---

## 8. Development Roadmap

### Phase 1 — Authentication & Registration (Week 1)
- [ ] Supabase project setup, schema migration
- [ ] Expo project scaffolding with TypeScript
- [ ] Login screen
- [ ] Signup/registration screen with photo upload
- [ ] Pending approval screen
- [ ] Profile repository + auth service

### Phase 2 — Admin Approval Flow (Week 2)
- [ ] Admin dashboard
- [ ] Pending applications list
- [ ] Member detail view
- [ ] Approve / reject actions (Edge Functions)
- [ ] Search members

### Phase 3 — Digital ID & Verification (Week 3)
- [ ] Digital ID card component
- [ ] QR code generation
- [ ] Public verification page
- [ ] Verification logging

### Phase 4 — Polish & Deploy (Week 4)
- [ ] Error handling + loading states throughout
- [ ] PDF export (react-native-html-to-pdf)
- [ ] Push notifications for approval/rejection
- [ ] Production deployment (EAS Build + Expo Go)
- [ ] Supabase production config

### Phase 5 — Version 2 (Future)
- [ ] Events module
- [ ] QR check-in for events
- [ ] Attendance reports
- [ ] Member portal for event registration

---

## 9. Deployment Guide

### Supabase Setup
1. Create new Supabase project at supabase.com
2. Run `schema.sql` in the SQL Editor
3. Enable Storage → create bucket `avatars` (private)
4. Set storage policy: authenticated users can insert into `avatars/public/{auth.uid()}/*`
5. Deploy Edge Functions: `supabase functions deploy approve-member`
6. Enable email confirmations in Auth settings (production)

### Expo / React Native Build
```bash
# Install dependencies
npm install

# Start development
npx expo start

# Build for production (EAS)
npx eas build --platform all --profile production

# Submit to stores
npx eas submit
```

### Web Deployment (Expo Web)
```bash
npx expo export --platform web
# Deploy /dist folder to Vercel or Netlify
```
