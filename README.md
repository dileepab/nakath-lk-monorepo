# Sanhinda Matrimony Platform

A modern, highly-secure, and culturally accurate matchmaking platform designed specifically for the Sri Lankan market. This application aims to outperform traditional classifieds (like Poruwa) by deeply integrating astrological matching algorithms, zero-compromise privacy settings, and a premium "Life After Marriage" alignment score.

## 🏗 System Architecture

This project is built as a highly scalable **Turborepo** Monorepo. This allows the Web App, Mobile App, and Backend services to share identical TypeScript types, business logic, and astrological algorithms without duplication.

- **`packages/core`**: The brain of the application. Contains all strictly-typed schemas (`ProfileDraft`, `MatchRequest`), Astrology Logic (`Rahu Kaalaya` engines, `Nakath` options), and the proprietary `Porondam` Matching Calculator.
- **`apps/web`**: The Next.js 14 web application. Features server-rendered pages wrapped in React `<Suspense>`, Tailwind CSS for styling, Framer Motion for premium micro-animations, and full Firebase integrations.
- **`apps/mobile`** *(Pending)*: The future Expo/React Native companion application for iOS and Android.

### Tech Stack
- **Frameworks**: Next.js, React, Tailwind CSS, Framer Motion
- **Tooling**: Turborepo, TypeScript, ESLint 
- **Backend & Database**: Firebase Authentication, Firestore (NoSQL), Firebase Storage
- **Security**: Strictly scoped `firestore.rules` for peer-to-peer data protection.

---

## ✅ Completed Features (Web MVP)

We have successfully built a fully functioning Minimum Viable Product (MVP) ready for beta testers:

### 1. The Dynamic Biodata Builder
A comprehensive, multi-step profile generator capturing everything from localized astrological data (Lagna, Nakath, exact Birth Time/Place) to family setups (Siblings, Parents' Occupations).
- Includes strict **Verification Uploads** (NIC and Selfie).
- Introduces granular **Privacy Models** (e.g., Photos blurred until mutual interest, direct contact info hidden).
- Exportable to a highly shareable, PDF-friendly layout.

### 2. The Auspicious Dashboard & Trust Center
- **Rahu Kaalaya Engine**: A real-time, mathematically accurate dashboard clock alerting users to auspicious times based on Sri Lanka Standard Time.
- **Admin Review Panel**: A dedicated backend dashboard (`/review`) for trusted reviewers to seamlessly verify submitted NICs against accompanying selfies.

### 3. The Match Request Engine
- Replaced generic swipe features with a respectful **"Request Introduction"** pipeline. 
- The Dashboard aggregates inbound intro requests where users can safely "Approve" or "Decline".

### 4. Real-Time Glassmorphism Chat
- Once a Match Request is approved, it unlocks the **`/messages`** portal.
- Utilizing encrypted Firestore `onSnapshot` listeners, users can converse in a stunning real-time chat interface perfectly protected by strict database security rules—meaning users never have to hand out their Whatsapp numbers early.

### 5. "Life After Marriage" Alignment Score
- To fix the fatal flaw of traditional matching (astrological alignment but cultural mismatch), the platform evaluates a secondary score: **The Lifestyle Percentage**.
- Cross-references users on their *Migration Plans*, *Spouse Career Expectations*, and *Family Setup* (Nuclear vs Joint) preferences.
- Displays a dual-score (e.g. `16/20 Porondam` & `100% Lifestyle`) prominently on all profile browsing cards.

---

## 🚀 Future Integration Roadmap (The 'Poruwa-Killers')

The following features have been meticulously drafted to completely capture and dominate the market. They are ready for immediate implementation in subsequent sprints:

1. **AI "Auspicious" Icebreakers**: Connecting an LLM right into the `/messages` UI to scan both matched profiles and generate 3 highly targeted, culturally appropriate conversation starters to eliminate awkward first messages.
2. **Audio "Anti-Catfish" Prompts**: Allowing users to upload a 10-second voice note answering a fun, cultural prompt (e.g., "My perfect Sunday..."). Helps build immense psychological trust before photos are even un-blurred.
3. **React Native Mobile Expansion (`apps/mobile`)**: Bootstrapping the Expo codebase and injecting the exact same `@acme/core` logic to drop the application into the iOS App Store and Google Play instantly.
4. **AI "Kenda" (Horoscope) Scanner**: Integrating Google Cloud Vision OCR so users can snap a photo of their physical, handwritten astrologer's report and instantly auto-fill their digital profile's planetary houses and Lagna.
5. **The Secure "Family Room" (Built-in Video)**: Adding a WebRTC (Twilio/Daily.co) integration into the chat page allowing up to 4 people (Boy, Girl, Parents) to jump on an ephemeral 15-minute video call to safely digitize the traditional "first meeting."

---

## 🛠 Getting Started Locally

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```

2. Run the development server across all packages:
   ```bash
   npx turbo run dev
   ```

3. Type-check and verify the production build:
   ```bash
   npx turbo run build
   ```

*(Ensure the accompanying `.env.local` is fully populated with the Firebase Admin and Client credentials for the services to boot correctly).*
