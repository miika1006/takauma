# Takauma – Developer Guide

Takauma (Finnish: "Flashback") is a Next.js web application for collaborative photo collection at events. An organiser creates an event, shares a link, and anyone with that link can upload photos — no login required. Photos are stored directly in the organiser's Google Drive.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| UI | React 18 + TypeScript 5 |
| Auth | next-auth v4 (Google OAuth2, JWT sessions) |
| Storage | Google Drive API (googleapis) |
| User DB | AWS DynamoDB via @aws-sdk v3 |
| i18n | next-i18next (Finnish default, English) |
| Hosting | Vercel |

---

## Project Layout

```
takauma/          ← Next.js application root
├── pages/
│   ├── api/
│   │   ├── auth/[...nextauth].ts   ← NextAuth handler + authOptions
│   │   ├── file/[event].ts         ← Upload / list photos (public, event-scoped)
│   │   └── folder/
│   │       ├── index.ts            ← Create / list / delete folders (auth required)
│   │       └── share.ts            ← Share / unshare folder (auth required)
│   ├── events/
│   │   ├── index.tsx               ← Events management (auth required)
│   │   └── [event].tsx             ← Public photo upload page
│   ├── index.tsx                   ← Landing page
│   ├── privacy.tsx / terms.tsx     ← Legal pages
│   ├── _app.tsx                    ← App wrapper (SessionProvider, i18n, analytics)
│   └── _document.tsx               ← HTML document
├── components/                     ← React components
├── lib/
│   ├── googledrive.ts              ← All Google Drive API calls
│   ├── dynamo-db.ts                ← DynamoDB user/ban management
│   └── event.ts                   ← base64 event-id encoding/decoding
├── common/
│   ├── hooks/                      ← useLoadingIndicator, usePrevious
│   └── types/index.ts              ← Shared TypeScript types
├── types/                          ← Module augmentations (next-auth, env)
├── public/locales/                 ← i18n JSON (en, fi)
└── styles/                         ← CSS Modules
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Google Cloud project with OAuth2 credentials and a service account
- AWS account with a DynamoDB table

### Install

```bash
cd takauma
yarn install
```

### Environment Variables

Create `takauma/.env.local`:

```
NEXTAUTH_URL=http://localhost:3000
SECRET=<random-long-string>

# Google OAuth2 (https://console.cloud.google.com/)
GOOGLE_ID=<client-id>
GOOGLE_SECRET=<client-secret>

# Google Service Account (for reading shared folders anonymously)
SERVICE_ACCOUNT=<service-account-email>
SERVICE_ACCOUNT_KEY=<private-key-with-literal-\n-newlines>

# AWS DynamoDB
APP_AWS_ACCESS_KEY=<key-id>
APP_AWS_SECRET_KEY=<secret-key>
APP_AWS_REGION=eu-north-1
APP_AWS_TABLE_NAME=takauma-users
APP_AWS_NEXT_AUTH_TABLE_NAME=takauma-nextauth
```

> **Vercel note:** Paste the `SERVICE_ACCOUNT_KEY` value with literal `\n` characters (not real newlines) directly into the Vercel environment variable UI.

### Run

```bash
yarn dev    # http://localhost:3000
yarn build
yarn start
yarn lint
```

---

## Key Architectural Decisions

### Event ID encoding
An event link embeds `base64(email/folderId)`. The API routes decode this to identify the Drive folder and verify the owner. See `lib/event.ts`.

### Anonymous uploads
The file upload endpoint (`/api/file/[event]`) looks up the folder owner's `refreshToken` from DynamoDB and calls the Google Drive API on their behalf. No authentication is required from the uploader.

### Token refresh
`pages/api/auth/[...nextauth].ts` implements refresh-token rotation. If the access token has expired, it calls the Google token endpoint directly, saves the new tokens to DynamoDB, and returns the updated JWT.

### Ban list
DynamoDB stores `{ UserEmail, IsBanned, accessToken, refreshToken }`. Sign-in and every JWT refresh check `IsBanned`.

### Folder caching
`lib/googledrive.ts` uses `node-cache` (90 s TTL) for `GetGoogleDriveFolderById` to reduce Drive API quota consumption on the anonymous upload page.

---

## Authentication (next-auth v4)

- Provider: Google (scopes: `userinfo.email`, `drive.file`)
- Strategy: JWT (`session.strategy = "jwt"`)
- `authOptions` is exported from the NextAuth route so server-side helpers (`getServerSession`) can import it directly.
- Client-side: import hooks/helpers from `next-auth/react`.
- Server-side (API routes): use `getServerSession(req, res, authOptions)`.

---

## AWS DynamoDB (@aws-sdk v3)

`lib/dynamo-db.ts` uses `DynamoDBDocumentClient` from `@aws-sdk/lib-dynamodb`.  
Commands: `GetCommand`, `PutCommand`, `UpdateCommand`.

---

## i18n

- Default locale: Finnish (`fi`)
- Translations: `public/locales/{fi,en}/common.json`
- Every page that needs translations must call `serverSideTranslations` in `getServerSideProps`.

---

## No Tests

There is currently no test suite. When adding tests, Jest + React Testing Library is the recommended approach for components; use `jest-environment-jsdom`. API routes can be tested with `supertest` against a Next.js test server.

---

## Deployment (Vercel)

1. Push to `main`.
2. Vercel auto-deploys.
3. Set all environment variables listed above in the Vercel project settings.
4. `localePath` in `next-i18next.config.js` must use `path.resolve(...)` for Vercel to find locale files.
