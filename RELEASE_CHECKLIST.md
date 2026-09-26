Pawppy Pet Parent OS — local implementation and release notes

The coordinated Pet Parent OS release is deployed to `sweekar-af756` and https://pawppy.in as of 10 September 2026. The web release includes the landing image and install/update-prompt fixes. Realtime Database uses the full reviewed `database.rules.json`.

**10 September deployment status**

- Netlify production deploy: `6aa2a4779dae4a71334fd838`. Previous production deploy metadata is in `.firebase/release-2026-09-10-resumed/netlify-site-before.json`.
- Deployed 17 core care/public-profile/family/notification functions and 11 existing notification consumers needed for compatibility with the new device registry. Existing unrelated functions were preserved.
- Backfilled ownership for 37 pets during a brief pet-write pause. The follow-up dry run reported zero missing reservations. Existing care records were preserved; pet editing reopened before the web release.
- Published the verified web preview, then deployed the full Realtime Database rules. The live rules read-back equals `database.rules.json`.
- Current backup, before/after rules, migration evidence, deploy metadata, and temporary verification scripts are in the ignored, restricted local directory `.firebase/release-2026-09-10-resumed/`. Do not commit or print database backup contents.
- The earlier additive rules release and its original backup remain in `.firebase/release-2026-09-10/`.
- Image delivery uses a bundled, content-hashed asset. Production browser checks confirm the 1254-pixel image loads and the install/update/offline-ready banners do not reappear after reload.
- The new public/family functions initially returned platform HTTP 429 before executing. Temporarily starting one instance made them responsive. All 11 public/family callables are restored to zero minimum instances, with their existing maximum of 10 retained. The runtime configuration is consistent with the source code.
- Live permission checks passed for owner pet creation, private-record isolation, safe public projections, caregiver invitations and recording, viewer write denial, and access revocation. A real browser signed in to the live site and loaded the saved routine in Today. All temporary accounts and fixture records were removed. The ignored `verification-final.json` records final endpoint and runtime checks.
- Earlier local checks passed: production build, 21 domain tests, 16 backend/rules emulator tests, 7 app/install browser tests, and 1 production-worker update/reload test. Production checks do not validate physical-device push delivery or real email delivery.

**Released capabilities**

- `/`: a new public landing page with an interactive sample day, practical use cases, installation and pricing explanations, and truthful feature claims.
- `/login`: a separate sign-in/sign-up flow. Verified users arrive at `/today`; caregiver invitation links survive sign-in.
- `/today`: private, minimal pet setup; daily routines across pets; completion, correction, pause/resume, and seven-day activity counts and completed-care counts in weekly digests. Dates use the saved time zone. Routine times organise the list. An optional daily briefing checks for open routines every 15 minutes after the parent’s chosen time, outside quiet hours, with a single occurrence per day. Individual activity alerts are not included. Routine completion does not record medication administration.
- `/care`: existing health, weight, and expense tools, plus `/care/:petId/visit` for a reviewed, downloadable or printable visit-preparation summary.
- `/family`: one-use invitations, caregiver/viewer/sitter access, revocation, and leaving a shared plan. Sharing includes all pets’ basic identities, routine definitions and routine history; it excludes canonical medical records, expenses and private events. Caregiver/viewer access expires after one year; sitter access lasts 1–30 days from acceptance. Invitation links expire after seven days.
- `/discover`: existing community, adoption, resource, shopping and activity destinations. Discovery no longer invents distances; absent shared coordinates are labelled unknown.
- `/settings`: device notification setup, per-channel/category preferences, quiet hours, time zone and product-measurement controls.
- Scheduled health reminders and weekly digests read canonical pet records and use per-occurrence/per-channel delivery tracking. Browser reminder scheduling is disabled. Provider acceptance is recorded, not proof of delivery or opening. A provider acceptance followed by a crash before saving its result can still lead to a retry.
- Public profile callables expose selected fields, and database rules restrict raw care records to owners. Shared care has separately constrained access. Public events must be explicitly published and have a supported non-medical type. Private conversations require participation; the conversation list uses an authenticated backend projection.

**Procedure for subsequent coordinated releases**

1. Review this branch and record the current deployed app, functions and rules versions. Take an operator-controlled database backup. Do not print or commit its contents.
2. Use a coordinated maintenance window for pet creation/edits during the ownership backfill. Older clients create timestamp-based pet IDs without reserving ownership. New clients reserve UUIDs atomically. Running the migration while old writers continue unchecked can miss newly created records.
3. With the intended project’s Application Default Credentials, preview the ownership backfill:

   ```sh
   node scripts/migrate-pet-ownership.cjs --database-url '<production database URL>'
   ```

   It reports counts only and refuses ambiguous duplicate IDs or conflicting reservations. Resolve those conflicts from authoritative records before proceeding. No care records are moved or deleted.
4. Apply the reviewed backfill with the same command plus `--apply`, then repeat the dry run and confirm zero new reservations. Keep the write maintenance window in place until compatible writers are active.
5. Deploy the new Cloud Functions, compatible web build and database rules as one coordinated release. The public readers require the new callables and ownership index. The new Today screen requires the `careRoutines`/`careDays` rules. Existing installed clients need to reload the updated app; their old public database reads will be denied by the new rules. Do not publish only the restrictive rules to an otherwise old client fleet.
6. Verify with an owner, a second account and a signed-out browser: own private records, public profile links, conversation participation, pet creation, two-device completion/correction, invitation acceptance, viewer restrictions and revocation.
7. On real installed devices, explicitly enable notifications and check one saved care date, deep links, quiet hours, category opt-outs, account switching and logout. Verify scheduler deployments and mail/FCM configuration. Local tests do not validate APNs/FCM delivery or real email.
8. Keep the new read boundaries during rollback. A client rollback must retain compatible public callables and ownership-aware writes; restoring broad public database rules would re-expose private records.

**Checks**

Latest local run (10 September 2026): 21 domain tests, 16 database/backend emulator tests, 7 app/install browser tests, and 1 production-worker browser test passed. The production build, Functions syntax check and whitespace check also passed.

```sh
npm ci
npm --prefix functions ci
npm test
npm run test:rules
npm run test:browser
npm run build
./node_modules/.bin/playwright test --config playwright.pwa.config.cjs
```

The emulator tests use `demo-pawppy` and local-only fixtures. Scheduled notification handlers mock external delivery. Browser tests abort external requests; the shared-care browser test stubs only the public transport of the shared-pet projection, while separate handler tests verify that projection and invitation logic against the database emulator. Browser screenshots are in ignored `test-results/`.

**Measurement and remaining release work**

- `npm run report:retention -- --input <export.json>` reads an authorised local export of `productEvents`; `--database-url` supports a read-only administrative report. The report contains cohort aggregates, not pet details or message contents. Raw events are pruned after 90 days by the scheduled function. Measure before making retention claims.
- Cohorts begin at the first measured session, which can be an existing account. D1/D7/D30 are exact UTC calendar-day returns and exclude immature denominators. Activation requires a pet creation plus a health save or routine completion within 24 hours. Household-level retention and acquisition-channel segmentation are not implemented yet.
- Public discovery and the conversation-list API currently scan their existing data sets server-side. Replace these with maintained, indexed projections before scaling to large datasets. Profile polling and family projections should also be monitored for read cost.
- Existing storage rules, third-party hosted media URLs, legacy community write paths and commerce permissions need their own access review before making a blanket privacy claim. This branch’s care and conversation boundaries are not a complete application security audit. Previously shared download URLs cannot be recalled by hiding a profile.
- Routine assignment, timed routine reminders, playdate-specific profiles, replenishment estimates, wearable integrations, document extraction and voice AI workflows remain follow-up work. The current app does not contain a diagnostic assistant, proprietary neural network, or automatic medication decisions.
- Pet Care Copilot beta uses Gemini 3.1 Flash-Lite through authenticated Firebase callables, explicit question/record consent, owner checks, and daily request limits. See COPILOT_EVALUATION.md. Training an owned model still requires consented data and evidence of improvement over this baseline.


PWA implementation references: [MDN install-prompt lifecycle](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt) and [Workbox update activation](https://developer.chrome.com/docs/workbox/handling-service-worker-updates/). The production-worker test verifies that accepting a waiting worker causes one reload and no repeated update banner on subsequent visits.

**Recovery across Netlify releases (10 September 2026)**

- Netlify builds retain the two previous production releases’ hashed assets after generating the current service worker. `release-assets.json` records immutable deploy origins and each release’s own assets, keeping retention bounded. The first rollout restores both releases that predate this manifest. A failed history download stops publication.
- Missing `/assets/*` files return a plain-text 404 instead of the SPA HTML. Asset responses revalidate, and the app sends the popup-compatible `Cross-Origin-Opener-Policy: same-origin-allow-popups` header. Google’s own popup policies can still produce browser warnings; these are separate from route loading.
- Failed route loads show a recovery button. It checks for and activates a waiting service worker before reloading; offline retries retain the recovery screen. There is no automatic reload loop. Tabs older than the retained releases may need this recovery step.
- Verified the production build, restoration of 217 prior assets (including the reported Today, arrow-right and entry-point files), and all five PWA browser tests: successful retry, persistent failure, offline retry, missing-asset responses, and real worker activation.

**Home and installed-app updates (11 September 2026)**

- Home and Settings now expose a working Check for updates / Update app control. The previous standalone button component was not mounted anywhere.
- A single native app worker registration bypasses HTTP caches for update checks. Startup, focus, pageshow, visibility, reconnection, and a five-minute foreground interval check for new releases. Native waiting/activation events replace the registration library’s update heuristics.
- Vite embeds the build ID and emits an uncached `version.json`, outside the service-worker precache. This detects an old open document even if another tab has already activated the newest worker. Updates require an explicit click; the app reloads after activation and preserves browser storage and sign-in. Concurrent update clicks share one operation.
- The signed-in Today screen restores pet photo cards, a lavender welcome area, care shortcuts and discovery cards. Pet cards filter daily routines. Care recording, shared access, and real seven-day counts remain in place. Missing pet photos have a local icon fallback.
- Validation: production build; seven app/install browser tests (including pet filtering, shared-care revocation, and persistent routine changes); ten production PWA browser tests covering resume, reconnection, reopening a dismissed update, activation from a second tab, stale-version detection, slow downloads, and route recovery. Mobile and desktop layouts visually inspected. Physical iOS/Android installed-device behavior still needs device verification.

Release-transition review used the actual prior and new deployed bundles through a local proxy: update acceptance preserved local storage and did not repeat the prompt. The download exceeded one minute; the updater now allows two minutes for installation and shows indeterminate download activity instead of a simulated percentage. The first direct live check hit its one-minute test deadline while the release was still downloading.

**September 14 daily-care increment**

- Added an explicit weekly breakdown by pet, routine and day, using existing saved care records and corrections. Missing entries are labelled as no entries, not missed care.
- Replaced the routine form’s native time field with hour/minute selectors, AM/PM, and morning/afternoon/evening presets; the underlying HH:mm storage format is unchanged.
- Push audit and the remaining public-key/device receipt gate are documented in PUSH_NOTIFICATION_AUDIT.md.

**Mobile loading and PWA update repair — awaiting deployment**

- Accepting an already-downloaded worker bypasses a redundant network check. Activation is confirmed before reloading, including when a mobile browser delays lifecycle events. A release-version mismatch alone cannot trigger a reload of the old cached app.
- `src/sw.js` uses fresh HTML for online navigation and the installed, precached shell when the network fails or takes more than eight seconds. Hashed assets remain precached. Open pages still require update acceptance before a waiting worker takes control.
- The HTML entry point has a recovery action independent of React, so a missing or failed entry script leaves a usable retry screen. Recovery preserves browser storage and sign-in data.
- `playwright.pwa.config.cjs` covers desktop Chrome, Android Chrome emulation, and iPhone WebKit emulation. The 14 scenarios per browser cover activation, multiple tabs, stale releases, slow downloads, network failures, missing assets, and startup recovery. Version changes and navigation failures are simulated by the test server because WebKit request interception does not consistently intercept service-worker traffic.
- Local transition checks using the current deployed release and the new build passed in Android and iPhone emulation: the existing update card activated the replacement worker, loaded the new build, preserved storage, and did not repeat the prompt. These checks do not establish physical-device behavior or deploy the change to `pawppy.in`.

**Pre-push validation — 2026-09-26**

- Production build, 32 unit tests, and 16 browser checks passed, including notification layouts at 320px, 390px, 768px, and 1280px in Chromium and WebKit.
- PWA checks passed 41 of 42 scenarios. The iPhone WebKit missing-route recovery test repeatedly stays on the recovery screen after the simulated Login chunk failure is removed and Reload app is clicked. This remains unresolved; do not treat the PWA suite as fully passing.
