# Compatibility security migration

This release closes the permissions that can be tightened without changing
stored data, and moves challenge vote counts and quiz scores to trusted backend
code. Several legacy structures require a data migration before stricter rules
can be enabled safely.

## Protected in this release

- Storage no longer has an authenticated wildcard grant.
- Avatar, pet image, challenge entry, and vendor document path checks are now
  effective.
- Lost and found reports can only be changed or deleted by their creator.
- Pet slug records can only be changed by their creator.
- New tagged places can only be changed by their creator.
- New conversations require the creator to be a participant and can only be
  read or changed by participants.
- A notification sender can create a notification but cannot edit or delete it
  afterward; the recipient retains read-state control.
- Challenge entry vote counts are backend-owned.
- Quiz history, XP, streaks, and leaderboards are backend-owned.

## Remaining migrations

### Private pet discovery

Existing discovery screens read `userPets` as a collection. Realtime Database
rules cannot filter private children from a collection read. Introduce a
server-maintained `publicPets` index, update discovery to read it, backfill
public pets, then remove broad reads from `userPets`.

### Legacy conversations

Old conversations without `participants` remain readable to authenticated
users for compatibility. Backfill participant maps from request/conversation
metadata, audit unmatched records, and then remove the legacy fallback from
`database.rules.json`.

### Pet posts and events

Some older posts and events do not contain an owner uid, while likes and
comments intentionally allow community writes. Backfill `ownerUid`, move likes
to uid-keyed children, and add owner/commenter-specific rules before removing
the legacy authenticated write grant.

### Client-created notifications

Some established flows still create recipient notifications in browser code.
Move each to a validated callable function or database trigger, then deny all
cross-user notification writes.

### Legacy Realtime Database commerce

Subdomain storefronts still depend on `vendorStores`, `vendorProducts`,
`buyerOrders`, and `vendorOrders`. Migrate those stores and orders to the
Firestore commerce schema with reconciliation reports before retiring the old
paths. Do not delete `features/ecommerce` until subdomain traffic and data have
been migrated.

### Firebase Admin 14

The Functions dependency audit has no critical or high findings after the
non-breaking updates in this release. Nine moderate transitive findings remain
behind Firebase Admin 13. Firebase Admin 14 removes the legacy namespace API
used throughout `functions/index.js`, so resolving them requires a deliberate
import/API migration and Functions integration tests. Do not force the major
upgrade during a production hotfix; migrate and canary it as a separate
backend-only release on Node 22.

Each migration needs an idempotent dry-run, record counts before and after,
emulator tests, a production backup, and a documented rollback.
