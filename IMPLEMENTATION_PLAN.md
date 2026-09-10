Pawppy Pet Parent OS — phased implementation

Started 9 September 2026. Product direction approved by the owner. This is the working backlog; a phase is complete only when its implementation and checks are recorded below. Local completion does not mean deployed or proven to improve retention.

**Confidence and success criteria**

We expect clearer daily care, lower input effort, and shared responsibility to improve usefulness. Retention is an outcome to measure, not a guarantee. Establish a baseline before changing the primary home experience. Compare activation, D7/D30 return rates, repeated care actions, and notification opt-outs by cohort. Start with dog/cat households unless the owner chooses a narrower audience.

**Phase 1 — dependable foundations (in progress)**

- Repair canonical pet reads in scheduled reminders and digests; stop duplicate browser scheduling.
- Use local calendar dates, explicit next-checkup dates, bounded repeat reminders, idempotent delivery records, and actionable pet links.
- Add notification preferences and contextual permission setup. Track provider acceptance separately from delivery/opening.
- Add first-party, content-free funnel events, measurement controls, and a cohort reporting script.
- Remove unsupported matching/statistics claims and align the positioning copy.
- Privacy release step: inventory public-data consumers, introduce explicit public projections, migrate existing records with a dry run, switch consumers, tighten private-record rules, and test anonymous/owner/other-user access in emulators. Do not deploy restrictive rules separately from the compatible readers and migration.
- Release gate: tests/build pass; verify installed-device reminder flow and deployed jobs; collect baseline. No production release is implied by local tests.

**Phase 2 — Today and the landing page (core implemented locally; validation and release gates remain)**

- One shared Today model for desktop/mobile, across pets, with a pet filter and relevant empty states.
- Owner-selected routines, initially simple daily care; task occurrences, attribution, correction, and concurrency-safe completion. Medication administration requires its own later workflow.
- Progressive onboarding: pet → one need → first useful result → reminder/install invitation.
- Navigation: Today, Care, Add, Discover, Family. Keep all existing destinations reachable.
- Public landing page with an interactive, clearly labelled sample day, real screenshots, practical use cases, pricing/install clarity, and a separate login route.
- Align manifests, SEO/social previews, FAQ, welcome copy, and health labels. Remove fabricated distances from discovery and require real location data or an honest unknown state.
- Gate: a new user can set up and complete a routine without assistance; responsive/accessibility/browser checks; baseline comparison begins.

**Phase 3 — shared care and useful return loops (core shared care and visit export implemented locally)**

- Household membership, invitations, revocable caregiver roles, temporary sitter access, and task ownership.
- Personal weekly recaps, visit-preparation summaries, export, and unresolved-task follow-through.
- Weight/expenses reachable from Care; species-appropriate tracking and veterinarian-provided targets where relevant.
- Optional memories/enrichment challenges; separate playdates from breeding; contextual shopping/replenishment estimates.
- Gate: authorization/concurrency tests; useful repeat actions improve without excessive logging effort or notification fatigue.

**Phase 4 — contextual AI (queued; provider and evaluation gates)**

- Authenticated backend with permissions, request limits, cost tracking, and source-linked pet-history retrieval.
- Photo/PDF extraction into reviewed fields, receipts into reviewed expenses, voice into editable care logs.
- Grounded summaries and sitter handovers; insufficient-information responses and explicit approval before sensitive writes/sharing.
- Separate training consent from processing consent. Treat uploaded documents as untrusted input. No diagnostic scores or medication changes.
- Gate: select provider based on tested quality/cost/data handling; assemble reviewed evaluations with veterinary input where needed; demonstrate useful accuracy and correction flow. Do not ship a fake assistant while credentials or evaluations are unavailable.

**Phase 5 — evidence-led model work (queued; depends on data)**

- Collect consented, reviewed examples and compare simpler rules/retrieval against candidate models.
- Fine-tune or self-host only for a documented quality, control, or cost benefit; license review and operational monitoring.
- Evaluate ranking, extraction, and lost/found similarity as bounded tasks. Split evaluation by pet/household and time.
- Explore supported wearable integrations if partner/API access is available. A predictive digital twin/foundation model is a research decision, not a promised release.

**Research and rollout work across phases**

- Interview 8–12 consenting parents and observe setup/return tasks; outreach requires owner-led recruitment or separate authorization to contact people.
- Record cohort windows, sample sizes, acquisition channel, install mode, and care intent. Distinguish household activity from the same account returning.
- Roll out reversible pilots, evaluate results, and revise priorities. Any delivery dates remain estimates until team capacity and production findings are known.

**Implementation record**

- Initial review: `PET_PARENT_OS_REVIEW.md`.
- Phase 1: canonical scheduled reminders, per-device notification registration, preferences, first-party measurement and reporting, public profile projections, ownership backfill tool, and tighter care/conversation rules are implemented locally. Production backfill, deployment and device checks remain.
- Phase 2: new public landing and separate login; common Today experience; private minimal pet setup; daily routine completion/correction/pause/resume; opt-in daily briefings; Care and Discover hubs; navigation and truthful discovery distances are implemented locally.
- Phase 3: one-use caregiver/viewer/sitter invitations, revocation and shared daily care; seven-day action counts and completed-care counts in weekly digests; printable/downloadable visit preparation; and parent-entered veterinary weight targets are implemented locally. Assignment, richer recaps, playdates and replenishment work remain.
- Phase 4/5: no model provider or production evaluation data has been configured. The app does not claim that AI or an owned neural network is live.
- See `AI_IMPLEMENTATION_SPEC.md` for the next-phase contract. See `RELEASE_CHECKLIST.md` for the coordinated release sequence, checks, precise feature limits and remaining work. Nothing has been deployed.

**Verified locally on 10 September 2026**

- 21 pure domain tests passed.
- 16 database-rule and backend-handler emulator tests passed, including simultaneous owner/caregiver completion, invitation replay, expiry/revocation, conversation isolation and notification deduplication.
- 4 browser tests passed: landing/demo responsiveness, onboarding and routine persistence/correction, saved preferences, and shared-care revocation.
- Production build, Functions syntax check and `git diff --check` passed.
- Production data, migrations, deployment, actual email and installed-device push delivery were not exercised. Retention improvement has not yet been measured.
