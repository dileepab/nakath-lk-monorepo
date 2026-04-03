# Navigation System

This document defines the intended information architecture for the Nakath.lk web app and the route meanings we should preserve as the product grows.

## Navigation Goals

- Keep the app understandable for first-time users and families
- Separate marketing navigation from signed-in product navigation
- Reduce duplicate ways of reaching the same concept
- Make the primary route structure stable enough for future mobile and localization work

## User-Facing Route Map

### Public routes

- `/`
  Landing page and product explanation
- `/auth`
  Sign-in and redirect entry point

### Core product routes

- `/dashboard`
  Signed-in home for requests, approvals, messages, and reminders
- `/profiles`
  Browse and discover profiles
- `/profiles/[profileId]`
  Canonical public profile detail route
- `/profile?profileId=...`
  Temporary hosted-safe fallback detail route while dynamic Hosting behavior is inconsistent
- `/messages`
  Approved introductions and private chat
- `/biodata`
  Editable personal biodata workspace
- `/biodata/document`
  Printable or shareable biodata document
- `/settings`
  Privacy, notification, and reminder settings

### Role-gated route

- `/review`
  Reviewer and admin workspace only

## Primary Navigation Model

### Public header

Used on the landing page:

- Home
- How it works
- Privacy preview
- Browse
- Sign in or Dashboard
- Primary CTA: Create biodata

### Signed-in app shell

Primary items:

- Dashboard
- Browse
- Messages
- My Biodata
- Settings

Conditional reviewer item:

- Review

## Canonical Meanings

- `Dashboard`
  The signed-in home. This is where ongoing activity should converge.
- `Browse`
  Discovery and introduction requests.
- `Messages`
  Only approved conversations.
- `My Biodata`
  Editing and maintaining the user’s own profile.
- `Biodata document`
  A secondary view of My Biodata, not a top-level destination.
- `Settings`
  Privacy, notifications, language, and device readiness.
- `Review`
  Internal workflow for trusted reviewer/admin users.

## Route Cleanup Direction

Preferred long-term route set:

- `/dashboard`
- `/profiles`
- `/profiles/[profileId]`
- `/messages`
- `/biodata`
- `/biodata/document`
- `/settings`
- `/review`

Temporary compatibility route:

- `/profile?profileId=...`

This fallback should stay only until Hosting behavior is reliable enough to make `/profiles/[profileId]` the single public profile detail route everywhere.

## UI Structure

### Desktop

- Sticky top application bar
- Primary navigation visible on authenticated product pages
- Contextual reviewer action when access exists
- Account action on the right

### Mobile

- Compact top bar
- Bottom tab bar for primary destinations:
  - Dashboard
  - Browse
  - Messages
  - My Biodata
  - Settings

Reviewer access remains top-bar only to avoid overloading the bottom navigation.

## Label Decisions

- Use `Browse` instead of `Profiles` in primary navigation
- Use `My Biodata` instead of plain `Biodata`
- Use `Settings` as the home of privacy and notification controls
- Keep `Review` explicit and role-based

## Implementation Notes

- Shared navigation should live in one central config
- Route highlighting should be semantic, not strictly pathname-only, because `/profile?profileId=me` behaves closer to the user’s own profile than a public browse detail
- Existing page-local “Back to…” controls can remain during transition, but the app shell should become the main navigation system
