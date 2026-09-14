# Push notification audit — September 12, 2026

## Production findings

- Firebase project `sweekar-af756`: registration/unregistration and care notification functions are ACTIVE. Daily health (hourly), routine briefing (every 15 minutes), and weekly digest (hourly eligibility check) Scheduler jobs are enabled and have recent attempts. Scheduler publishing success alone is not proof of device delivery.
- No ERROR-severity entries were returned for the registration, routine and health functions in the three-day check. Account-level warnings and operating-system receipt are separate signals.
- The production Netlify VAPID public key was missing at the September 12 audit. On September 14, the owner saved the public key in `.env`; it was validated as a 65-byte VAPID public key and synced to Netlify’s production build environment. The public notification worker returns JavaScript with no-cache headers and matches the Firebase project. The initial CLI output was a missing-value message, not a key; the preliminary claim of a configured key was corrected. Do not use that output as a build value.
- Aggregate database snapshot: 79 accounts, one current per-device registration, nine legacy token records, zero routine-briefing opt-ins. These counts are a snapshot, not active-user or notification-reach metrics.
- All ten unique stored tokens were checked using Firebase Admin `send(message, true)` (dry run): nine accepted validation; one returned `messaging/registration-token-not-registered`. No notification was sent. Stale-token cleanup already runs when normal delivery detects invalid registrations.
- No push delivery ledger entries were present. Therefore historic phone delivery cannot be confirmed from this audit.

## Changes

- Failed silent registration no longer marks the session permanently configured. Reconnect/resume retries failed setup, with a cooldown and concurrent-call deduplication; successful registration is reused for the session.
- Setup checks the signed-in account before registering its token. Foreground display respects signed-out/device-disabled state and supports data-only titles/bodies.
- Notification clicks handle Firebase's nested `FCM_MSG` data as well as app-displayed notifications, navigating existing tabs to the intended record instead of relying on Firebase's existing-window behavior. External destinations remain blocked.
- Settings shows registration state and warns if the account push channel is disabled.
- Settings provides an explicit **Send test notification** action. The authenticated backend resolves only the caller's selected registered device; supplied user IDs/tokens are ignored. It permits one attempt per account per minute, does not broadcast, and reports provider acceptance separately from display. An invalid token requires re-enabling reminders. Server-only rate-limit records are denied by database rules. No automatic self-tests run.

## Verification

32 unit tests, 24 backend/rules emulator tests, 11 browser tests and 10 PWA tests across the push and daily-care increments. New coverage checks retry/concurrency, nested Firebase notification click navigation, background display deduplication, external-link blocking, explicit self-test UI interaction, caller-only targeting and rate limits. Browser/emulator sends use fixtures, not real FCM delivery. Production build is checked separately.

## Phone check

1. Update Pawppy and open Settings. On iPhone, open the installed Home Screen app before enabling reminders.
2. Enable reminders and allow the browser/OS permission. Keep the Push channel enabled and save your category preferences. Daily routine briefings require their separate opt-in.
3. Press **Send test notification**. Confirm the notification appears and opens Settings when tapped.
4. Wait at least one minute, send another test, then switch to another app to check background receipt. Verify OS notifications/Focus settings if it does not appear. The test is immediate and may arrive before switching apps; a fully controlled closed-app test requires a separately authorized send after closing it.

The self-test intentionally sends one notification even during account quiet hours. Regular care notifications continue to respect preferences and quiet hours. Provider acceptance, browser display, and parent engagement are different outcomes; no end-to-end phone result is claimed without observing receipt.

References: [Firebase web receive behavior](https://firebase.google.com/docs/cloud-messaging/web/receive-messages), [VAPID configuration](https://firebase.google.com/docs/reference/js/messaging.gettokenoptions), [Admin dry-run API](https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.messaging).

September 14: the deployed self-test endpoint rejects unauthenticated calls with HTTP 401. No real-user test notification was sent. Physical-device display and background receipt still require the explicit device check above.
