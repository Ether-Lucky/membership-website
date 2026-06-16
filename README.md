# MemberPortal

A production-ready **digital membership management system** built with React Native (Expo), TypeScript, and Supabase.

Members apply online, admins approve applications, and approved members receive a **professional digital ID card** with a QR code for instant verification — no printing required.

---

## Features

| Area | What's included |
|---|---|
| **Auth** | Email/password login, secure session storage, role-based routing |
| **Registration** | Full application form, photo upload (camera or library) |
| **Admin dashboard** | Stats overview, pending applications list, approve/reject with reason |
| **Member directory** | Searchable list of all approved members |
| **Digital ID card** | Navy + gold design, member photo, QR code, membership number |
| **Verification** | Public page — look up any member by ID or scan their QR code |
| **Audit log** | Every verification attempt is logged with IP address and timestamp |
| **V2 ready** | Events, registrations, and attendance tables already in schema |

---

## Tech Stack

- **Frontend** — React Native + Expo Router (file-based routing), TypeScript
- **Backend** — Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **Database** — PostgreSQL with RLS, triggers, and stored procedures
- **Architecture** — MVC + Repository/Service pattern

---

## Prerequisites

Before you start, make sure you have:

- [Node.js](https://nodejs.org/) 18 or later
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Supabase account](https://supabase.com) (free tier is fine for development)
- Expo Go app on your phone (iOS or Android) — for testing without a simulator

---

## Folder Structure

This is the complete layout of the project. Every file is listed.

```
membership-app/
│
│  ← Project config files (root level)
├── .env.example             # Copy to .env.local and fill in your values
├── .env.local               # Your actual secrets — NEVER commit this
├── .gitignore
├── app.json                 # Expo app configuration (name, bundle ID, permissions)
├── babel.config.js          # Babel config required by Expo
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
│
│  ← Documentation
├── ARCHITECTURE.md          # Full architecture guide and design decisions
├── schema.sql               # PostgreSQL schema — run this first in Supabase
├── supabase-setup.sql       # Storage policies + admin seeding — run this second
│
│  ← Expo Router screens (file = route)
├── app/
│   ├── _layout.tsx          # Root layout — wraps the whole app (REQUIRED)
│   ├── index.tsx            # Entry point — redirects based on auth state
│   │
│   ├── (auth)/              # Public routes — no login required
│   │   ├── login.tsx        # Login screen
│   │   └── signup.tsx       # Registration / application form
│   │
│   ├── (member)/            # Protected — logged-in members only
│   │   ├── _layout.tsx      # Auth guard: redirects if not logged in
│   │   ├── dashboard.tsx    # Member home screen
│   │   ├── id-card.tsx      # Digital membership ID card
│   │   └── pending.tsx      # Shown to members awaiting approval
│   │
│   ├── (admin)/             # Protected — admin role only
│   │   ├── _layout.tsx      # Auth guard: redirects if not admin
│   │   ├── dashboard.tsx    # Admin home with stats
│   │   ├── pending.tsx      # List of pending applications
│   │   └── members/
│   │       ├── index.tsx    # Searchable approved member directory
│   │       └── [id].tsx     # Member detail + approve/reject actions
│   │
│   └── verify/
│       └── [membershipNumber].tsx  # Public verification page (also has manual lookup)
│
│  ← Application source code
├── src/
│   │
│   ├── lib/
│   │   └── supabase.ts      # Supabase client singleton (SecureStore session)
│   │
│   ├── types/
│   │   └── member.types.ts  # All TypeScript interfaces and types
│   │
│   ├── repositories/        # Data access layer — raw DB queries live here
│   │   └── member.repository.ts
│   │
│   ├── services/            # Business logic layer — rules and orchestration
│   │   ├── index.ts         # Barrel export
│   │   ├── auth.service.ts  # Register, login, logout, session
│   │   ├── member.service.ts        # Profile fetching, ID card builder
│   │   ├── admin.service.ts         # Approve, reject, stats, member lists
│   │   ├── verification.service.ts  # Public membership lookup + audit log
│   │   └── storage.service.ts       # Photo upload/download (Supabase Storage)
│   │
│   ├── hooks/               # React hooks — connect screens to services
│   │   ├── index.ts         # Barrel export
│   │   ├── useAuth.ts       # Auth state, login, logout
│   │   ├── useMember.ts     # Own member profile + ID card data
│   │   ├── useAdmin.ts      # Pending applications
│   │   └── useDebounce.ts   # Debounced value for search inputs
│   │
│   ├── components/
│   │   └── member/
│   │       └── DigitalIDCard.tsx  # The visual ID card component (navy/gold design)
│   │
│   └── utils/
│       └── validation.ts    # Registration form validation
│
│  ← Supabase Edge Functions (server-side TypeScript / Deno)
└── supabase/
    └── functions/
        ├── approve-member/
        │   └── index.ts     # Admin-only: approve a member, generate membership ID
        └── verify-member/
            └── index.ts     # Public: look up a member (rate limited 30 req/min)
```

---

## Step-by-Step Setup

### Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**, choose a name and a strong database password
3. Wait for the project to provision (about 1–2 minutes)
4. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret — server use only)

### Step 2 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `schema.sql` from this project, paste the entire contents, click **Run**
4. You should see: *"Success. No rows returned"*

### Step 3 — Run the setup script

1. In SQL Editor, open a new query
2. Paste the contents of `supabase-setup.sql`, click **Run**
3. This creates the storage policies for avatar uploads

### Step 4 — Create the storage bucket

1. In Supabase, go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name it exactly: `avatars`
4. Set **Public bucket** to **OFF** (keep it private — signed URLs are used)
5. Click **Save**

### Step 5 — Create your first admin account

1. In Supabase, go to **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter the email and password for your admin account
4. Click **Create user**
5. Back in **SQL Editor**, run this (replace the email):

```sql
DO $$
DECLARE
  v_auth_id UUID;
BEGIN
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = 'admin@yourorg.com'  -- ← change this
  LIMIT 1;

  UPDATE profiles
  SET role = 'admin', status = 'approved'
  WHERE auth_id = v_auth_id;

  RAISE NOTICE 'Admin assigned to %', v_auth_id;
END $$;
```

### Step 6 — Set up the project locally

```bash
# 1. Clone or unzip the project
cd membership-app

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_APP_URL=https://yourapp.com
EXPO_PUBLIC_ORG_NAME=Your Organization Name
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> `EXPO_PUBLIC_` variables are safe to use in the app. `SUPABASE_SERVICE_ROLE_KEY` must **never** go in the client — it's only used in Edge Functions.

### Step 7 — Deploy the Edge Functions

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Log in
supabase login

# Link to your project (find your ref in: Settings → General)
supabase link --project-ref your-project-ref

# Deploy both functions
supabase functions deploy approve-member
supabase functions deploy verify-member
```

### Step 8 — Start the app

```bash
npm start
```

This opens the Expo dev server. Scan the QR code with the **Expo Go** app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

---

## How It Works — User Flows

### New member applies
```
Opens app → Signup screen → fills form + uploads photo
    → Supabase Auth creates user
    → Trigger auto-creates profile (status: pending)
    → Member record inserted
    → Redirected to "Pending Approval" screen
```

### Admin reviews and approves
```
Admin logs in → Dashboard → "Pending Applications"
    → Taps applicant → sees full profile + photo
    → Taps "Approve Application"
    → approve_member() PostgreSQL function runs
    → Membership number generated (MEM-2026-000001)
    → Member's status set to "approved"
    → Member can now access their digital ID card
```

### Member views their ID card
```
Member logs in → Dashboard → "My ID Card"
    → DigitalIDCard component renders with:
       - Name, photo, membership number
       - Member since date
       - QR code linking to /verify/MEM-2026-000001
    → Member can share their verification link
```

### Verification
```
Anyone scans the QR code (or visits /verify/MEM-2026-000001)
    → Verification page loads
    → Looks up membership in database
    → Logs the attempt (IP, timestamp, result)
    → Shows: Full Name, Membership ID, Status, Member Since, Verified At
```

---

## Membership ID Format

IDs are generated automatically when a member is approved:

```
MEM-2026-000001
MEM-2026-000002
MEM-2026-000003
```

The format is `MEM-{YEAR}-{6-digit-sequence}`. The sequence is global (not reset per year), ensuring IDs are always unique. This is handled entirely in PostgreSQL via a sequence and stored function — no race conditions possible.

---

## Database Overview

| Table | Purpose |
|---|---|
| `profiles` | Linked to Supabase Auth. Stores role (admin/member) and status (pending/approved/rejected) |
| `members` | Extended profile: name, birthdate, address, photo, membership number |
| `verification_logs` | Audit trail of every membership verification attempt |
| `events` | (V2 placeholder) Future events |
| `event_registrations` | (V2 placeholder) Member event signups |
| `attendance` | (V2 placeholder) QR check-in tracking |

All tables have **Row Level Security (RLS)** enabled. Members can only read their own data. Admins can read everything. Sensitive mutations (approve/reject) go through `SECURITY DEFINER` functions that bypass RLS safely.

---

## Security Notes

- Passwords are hashed by Supabase Auth (bcrypt) — never stored in your database
- Sessions are stored in device SecureStore (encrypted), not AsyncStorage
- Photos are in a private storage bucket — accessible only via time-limited signed URLs (1 hour expiry)
- The verification endpoint is public but rate-limited to 30 requests per minute per IP
- The `SUPABASE_SERVICE_ROLE_KEY` is only used inside Edge Functions and never sent to the client

---

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure your project (first time only)
eas build:configure

# Build for both platforms
eas build --platform all --profile production

# Submit to App Store / Play Store
eas submit
```

For web deployment, export and deploy to Vercel or Netlify:

```bash
npx expo export --platform web
# Upload the /dist folder to your hosting provider
```

---

## Customization Checklist

Before going live, update these to match your organization:

- [ ] `EXPO_PUBLIC_ORG_NAME` in `.env.local` — your organization name
- [ ] `EXPO_PUBLIC_APP_URL` in `.env.local` — your deployed app URL (used in QR codes)
- [ ] `bundleIdentifier` in `app.json` → `ios` section — e.g. `com.myorg.memberportal`
- [ ] `package` in `app.json` → `android` section — same value
- [ ] Logo in `assets/` — replace `icon.png`, `splash.png`, `adaptive-icon.png`
- [ ] Colors in `src/components/member/DigitalIDCard.tsx` → `COLORS` object — the navy/gold is the default
- [ ] Organization logo in the ID card — replace the `logoPlaceholder` circle with an `<Image>` component

---

## Version 2 Roadmap

The schema and folder structure are already prepared for these features:

- **Events management** — create and publish events
- **Member event registration** — members sign up for events
- **QR check-in** — scan a member's QR code at an event entrance
- **Attendance reports** — see who attended what
- **Push notifications** — notify members when approved or when new events are posted
- **PDF ID card export** — printable version of the digital ID

---

## Troubleshooting

**"Missing Supabase environment variables" error on startup**
→ Make sure `.env.local` exists and has both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` filled in. Restart the dev server after editing env files.

**Photo upload fails**
→ Make sure the `avatars` storage bucket exists and is set to private. Re-run `supabase-setup.sql` to apply storage policies.

**Admin role not working after seeding**
→ Sign out and sign back in. The profile role is loaded fresh on each login.

**"Member is not yet approved" on ID card screen**
→ The member's profile status must be `approved` in the `profiles` table. Check the admin panel to confirm the approval went through.

**Edge Function returns 401**
→ Make sure you're passing the user's JWT in the `Authorization: Bearer <token>` header. The Supabase client does this automatically when you call the function.

**QR code doesn't open the app**
→ Update `EXPO_PUBLIC_APP_URL` to your actual deployed URL. In development, use your machine's local IP: `http://192.168.x.x:8081`.
