# Nakath.lk Matrimony Platform

A trust-first Sri Lankan matrimony platform focused on biodata sharing, profile privacy, verification, and culturally aware compatibility scoring.

This README reflects the current repository state. A few areas in the product are still prototype-grade, especially AI-assisted verification, push notifications, and video/chat enhancements, so this document keeps those distinctions explicit.

## System Architecture

This repo is a Turborepo monorepo with shared business logic in `packages/core` and the current product surface in `apps/web`.

- `packages/core`
  Shared profile types, fixtures, biodata helpers, horoscope rules, Porondam scoring logic, and other domain utilities.
- `apps/web`
  Next.js `16.2.0` web application using React `19`, Tailwind CSS, Framer Motion, Firebase client SDKs, and selected server routes backed by Firebase Admin.
- `apps/mobile`
  Not present yet. Mobile is still a roadmap item, not an active workspace in this repo.

## Tech Stack

- Frameworks: Next.js, React, Tailwind CSS, Framer Motion
- Tooling: Turborepo, TypeScript, npm workspaces
- Data layer: Firebase Authentication, Firestore, Firebase Storage
- Server integrations: Firebase Admin, OpenAI SDK, AWS Rekognition, LiveKit

## Current Product Areas

### Stable core flows

These areas are already part of the main product structure:

- Biodata builder with profile basics, horoscope data, family context, partner preferences, privacy controls, and verification uploads
- Biodata document / PDF-friendly view
- Authenticated profile save/load with Firestore
- Profile browser and profile detail pages
- Porondam-style compatibility preview using internal rules and shared config
- Reviewer workspace with protected reviewer/admin mode when Firebase Admin env and reviewer allowlists are configured

### Working but still prototype-grade

These features exist in the codebase, but they should be treated as in-progress rather than production-complete:

- AI-assisted identity verification
  Present in the web app, but the verification pipeline still needs tighter authorization and operational hardening before it should be treated as a trusted auto-approval system.
- AI-generated chat icebreakers
  Present behind a server route and OpenAI configuration, but still needs stronger access control and production tuning.
- Video calling / family e-meet flow
  LiveKit token generation and UI scaffolding are present, but this is not yet a production-hardened communication surface.
- Push notifications / PWA support
  Manifest, service worker, and notification prompt scaffolding exist, but this still depends on full Firebase Cloud Messaging configuration and real notification delivery flows.

## Security Status

Security is partially implemented, not fully complete.

What is already in place:

- Firebase Authentication for user sign-in
- Firestore-backed user profile ownership patterns
- Storage rules for `profiles/{userId}/...` ownership
- Reviewer/admin role scaffolding using Firebase Admin plus email allowlists
- Protected reviewer API routes for verification decisions

What still needs hardening:

- End-to-end verification that deployed Firestore and Storage rules match the new server-side assumptions
- Privacy hardening around long-lived media download URLs and other prototype-era shortcuts
- Removal of any remaining prototype-only shortcuts before production rollout

If you are evaluating this repo for launch readiness, treat the authentication and core profile flows as the strongest area, and treat AI/video/notification features as development-stage.

## Repository Layout

```text
apps/
  web/          Next.js web app
packages/
  core/         Shared types, profile model, matching logic, astrology rules
```

## Local Development

### 1. Install dependencies

From the repo root:

```bash
npm install
```

### 2. Configure environment variables

At minimum, `apps/web/.env.local` should include:

#### Firebase client

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

#### Firebase Admin

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
ADMIN_EMAILS=
REVIEWER_EMAILS=
```

#### Optional integrations

Only needed if you want those features active:

```env
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
OPENAI_API_KEY=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
MOCK_AI_VERIFICATION=
```

### Feature flags and optional services

You can bring up the main product with Firebase first, then add the heavier integrations one by one.

#### Works with Firebase only

- sign-in and authenticated sessions
- biodata builder and biodata document view
- Firestore-backed profile save/load
- profile browser and profile detail pages
- Storage-backed photo, NIC, and selfie uploads
- reviewer workspace shell and reviewer/admin role gating
- Porondam preview and horoscope rules from `packages/core`

#### Requires extra setup

- push notifications
  Requires `NEXT_PUBLIC_FIREBASE_VAPID_KEY` and a complete Firebase Cloud Messaging setup.
- scheduled auspicious reminders
  Requires `REMINDER_DISPATCH_SECRET` and a scheduler that can call the protected reminder dispatch route.
- AI-assisted verification
  Requires AWS Rekognition credentials unless `MOCK_AI_VERIFICATION=true`.
- AI icebreakers
  Requires `OPENAI_API_KEY`.
- video calling
  Requires `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL`.

#### Recommended local mode

For the smoothest local setup:

1. Configure Firebase first
2. Keep `MOCK_AI_VERIFICATION=true`
3. Leave OpenAI, LiveKit, and FCM blank until the core product flows are stable

### 3. Start the app

From the repo root:

```bash
npm run dev
```

Or only the web app:

```bash
npm run dev --workspace web
```

### 4. Build

From the repo root:

```bash
npm run build
```

## Recommended Setup Order

If you are bringing the project up on a new machine, this order will save time:

1. Configure Firebase client env
2. Configure Firebase Auth, Firestore, and Storage
3. Confirm biodata save/load works
4. Add Firebase Admin env and reviewer allowlists
5. Confirm reviewer workspace works
6. Add optional OpenAI / AWS / LiveKit / FCM integrations only after the core app is stable
7. Deploy both `firestore.rules` and `storage.rules`

## Scheduled Reminder Dispatch

The app now includes a protected reminder dispatch route for:

- Rahu kalaya reminders
- Poya day reminders
- Aluth Avurudu nekath reminders

### Local dry run

From the repo root:

```bash
REMINDER_DISPATCH_SECRET=your-local-secret npm run dispatch:reminders -- --dry-run
```

If your local app is not running on `http://localhost:3000`, also set:

```bash
REMINDER_DISPATCH_URL=https://your-app-url.example
```

### Production scheduler shape

Use any scheduler that can send an HTTP `POST` request:

- Google Cloud Scheduler
- GitHub Actions on a schedule
- a small server cron job

The request must call:

```text
POST /api/notifications/reminders/dispatch
```

with:

```text
x-reminder-secret: <REMINDER_DISPATCH_SECRET>
```

This keeps the route protected while still allowing automated dispatch outside reviewer/admin browser sessions.

### Google Cloud Scheduler quick setup

From the repo root, you can create or update the scheduler job with:

```bash
REMINDER_PROJECT_ID=nakath-platform \
REMINDER_SCHEDULER_LOCATION=asia-south1 \
REMINDER_DISPATCH_URL=https://nakath-platform.web.app \
REMINDER_DISPATCH_SECRET=your-shared-secret \
npm run setup:reminder-scheduler
```

Optional overrides:

- `REMINDER_JOB_NAME`
  Defaults to `nakath-reminder-dispatch`
- `REMINDER_SCHEDULE`
  Defaults to `*/5 * * * *`
- `REMINDER_TIME_ZONE`
  Defaults to `Asia/Colombo`

Current reminder lead times:

- `Rahu kalaya`
  Sent about 10 minutes before the window starts
- `Aluth Avurudu nekath`
  Sent about 15 minutes before the event starts
- `Poya day`
  Sent around 6:00 AM Sri Lanka time on the day

The script will update the job if it already exists, so you can safely rerun it after changing the schedule or base URL.

## Troubleshooting

### Firebase sign-in shows `auth/unauthorized-domain`

Add your local dev host in Firebase Console:

1. Open `Authentication`
2. Go to `Settings`
3. Add both `127.0.0.1` and `localhost` under authorized domains if you use them locally

These are treated as different origins by the browser and by Firebase Auth.

### `/review` shows setup-required

This usually means the Firebase Admin env is incomplete. Check:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `ADMIN_EMAILS` or `REVIEWER_EMAILS`

After updating env values, restart the dev server.

### `/review` shows access-denied

The signed-in account is not on the reviewer allowlist yet.

Add the exact Firebase Auth email to one of:

- `ADMIN_EMAILS`
- `REVIEWER_EMAILS`

Then restart the app and sign in again if needed.

### Push notifications do not enable

Check the following:

- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set
- Firebase Cloud Messaging is configured for the project
- the browser has not permanently blocked notifications
- the current user already has a Firestore profile document

Without a valid VAPID key and FCM setup, the notification prompt UI may render but token registration will fail.

### AI verification is not running

This is usually one of two cases:

- `MOCK_AI_VERIFICATION=true`
  The app stays in local mock mode and does not call AWS Rekognition.
- AWS credentials are missing
  Set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

For local development, keeping mock mode enabled is the intended default.

### AI icebreakers do not generate

Check:

- `OPENAI_API_KEY` is set
- the app is not relying on mock mode unexpectedly
- the related match and profile documents exist in Firestore

If `MOCK_AI_VERIFICATION=true`, the route currently also uses mock responses for local testing.

### Video room token generation fails

Check:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `LIVEKIT_URL`

Without those values, the video route is only safe to use in mock/local scenarios.

## Roadmap Direction

The product direction still includes:

- stronger reviewer/admin operations
- hardened verification workflows
- better match/introduction lifecycle management
- mobile expansion later
- richer astrology and OCR-assisted horoscope tooling later

Those are valid roadmap items, but they are not all production-ready in the current branch.
