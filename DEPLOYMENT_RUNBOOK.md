# Production deployment runbook

The application has active PWA users, so backend and rule changes must remain
compatible with cached frontend versions. Never deploy this branch with one
unreviewed `firebase deploy` command.

## Preflight

1. Use Node 22.
2. Export the current Firebase rules and Functions configuration as a rollback
   snapshot.
3. Run `npm ci`, `npm run verify`, `npm run test:rules`, and
   `npm --prefix functions run lint`.
4. Confirm the Firebase project selected by `.firebaserc` is the intended
   production project.
5. Confirm monitoring access for Functions errors, Firestore denials, Realtime
   Database denials, FCM delivery, and hosting traffic.

## Required rollout order

### 1. Deploy additive backend functions

```bash
npm run deploy:functions
```

This adds `onChallengeVoteCreated`, `submitChallengeEntry`, and
`submitWeeklyQuiz` before any client
depends on them. Legacy vote documents omit `counterManagedBy: "server"`, so
the new trigger deliberately ignores them and does not double-increment votes.
Verify callable-function success and trigger logs.

### 2. Deploy the frontend

```bash
npm run deploy:hosting
```

Verify login, pet selection, pet editing, messaging, lost/found creation and
editing, resource comments, challenge voting, quiz completion, marketplace,
cart, COD checkout, vendor, and admin flows with test accounts.

Keep this compatibility window open for at least the maximum practical PWA
update interval. Monitor old-client traffic and function errors.

### 3. Deploy Firestore rules

The stricter rules make quiz writes and challenge vote counters backend-only.
Deploy only after updated clients are dominant.

```bash
npm run deploy:firestore-rules
```

### 4. Deploy Realtime Database and Storage rules

```bash
npm run deploy:rtdb-storage-rules
```

Monitor permission-denied rates closely. The rules preserve legacy
conversations without a `participants` field, while securing newly created
conversations.

## Rollback

- Frontend regression: redeploy the previous hosting release.
- Callable/trigger regression: redeploy the previous Functions revision; do
  not delete functions until cached clients no longer call them.
- Permission regression: restore the exported previous rule file immediately,
  then reproduce the denial in the emulator before attempting another rollout.

No step in this runbook modifies or migrates production data automatically.
