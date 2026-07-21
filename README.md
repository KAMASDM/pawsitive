# Pawppy

Pawppy is a React 18 progressive web application for pet profiles, health
records, social features, lost-and-found reports, local pet resources, weekly
challenges and quizzes, notifications, and multi-vendor commerce.

## Runtime architecture

- Vite builds the React application into `build/`.
- Firebase Authentication manages Google and email/password sign-in.
- Firebase Realtime Database stores the established pet, profile, messaging,
  place, notification, and lost-and-found domains.
- Cloud Firestore stores commerce, quiz, challenge, cart, order, coupon, and
  review data.
- Firebase Storage stores uploaded media.
- Firebase Functions owns trusted commerce mutations, scheduled reminders,
  push notifications, voting counters, quiz scoring, and role provisioning.
- Firebase Hosting is the canonical deployment target. `netlify.toml` is a
  frontend-only fallback and does not host backend functions.

## Local development

Use Node 22, matching the Firebase Functions runtime.

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env` and provide the Firebase, Google Maps, EmailJS,
and FCM browser configuration values. Do not put server credentials or private
keys in any `VITE_` variable because Vite exposes those values to browsers.

## Verification

```bash
npm run lint
npm run test
npm run test:rules
npm run build
```

`npm run test:rules` starts isolated Firestore, Realtime Database, and Storage
emulators. It never connects to production data.

## Deployment

Do not deploy the security hardening changes out of order. Follow
[`DEPLOYMENT_RUNBOOK.md`](./DEPLOYMENT_RUNBOOK.md).

```bash
npm run deploy:functions
npm run deploy:hosting
npm run deploy:rules
```

The combined `npm run deploy` command should only be used after the staged
release has completed successfully in production.

## Further documentation

- `COMPLETE_SITE_DOCUMENTATION.md`: established feature reference
- `COMPONENT_MAP.md`: UI and data-flow map
- `SECURITY_MIGRATION.md`: remaining compatibility migrations
- `DEPLOYMENT_RUNBOOK.md`: safe production rollout and rollback
