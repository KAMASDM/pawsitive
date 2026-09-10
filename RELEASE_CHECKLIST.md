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
- Routine assignment, timed routine reminders, a richer weekly recap, playdate-specific profiles, replenishment estimates, wearable integrations and AI workflows remain follow-up work. The current app does not contain a diagnostic assistant, proprietary neural network, or automatic medication decisions.
- AI requires provider configuration, reviewed evaluation examples, explicit processing controls and cost limits. Training an owned model additionally requires consented data and evidence of improvement over a simpler baseline. Those are release prerequisites, not capabilities demonstrated by this branch.


PWA implementation references: [MDN install-prompt lifecycle](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt) and [Workbox update activation](https://developer.chrome.com/docs/workbox/handling-service-worker-updates/). The production-worker test verifies that accepting a waiting worker causes one reload and no repeated update banner on subsequent visits.
