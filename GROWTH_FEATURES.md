# Care and sharing improvements

## Where to find them

- **Care → Read a vaccination card**: choose a JPEG, PNG, WebP, PDF (up to five pages), or text file. The on-device reader suggests vaccination rows. Select the card's date order, correct names and dates, select rows, and confirm review before saving. Existing vaccinations are preserved; matching vaccine names and given dates are not duplicated. No reminder dates or medical schedules are inferred.
- **Care → QR safety card**: explicitly choose public contact details, optional photo/breed and a message for a finder. Save before sharing or printing. The `/found/:token` page works without an account and is independent of social-profile privacy. Disabling the card, deleting the pet, or changing registered ownership removes access through the link. A tag is a contact card, not a GPS tracker.
- **Family → Prepare a sitter handover**: save feeding/comfort instructions and an emergency contact for the active care team. Shared Today links to the handover. Completed routines support an optional note/photo; viewers can view, caregivers/sitters can contribute. Access is checked against current membership and expiry on every server read/write. Medical records and expenses remain separate.
- **Today → Make a share card**, or **Care → Share their week**: choose a photo, caption, up to five recent non-clinical milestones and an optional recorded-care count. Preview/download an image without publishing. Create a link deliberately to allow account-free viewing at `/week/:token`. Shared snapshots do not change when the draft changes. Owners can turn links off; downloaded copies cannot be revoked.
- **Care → Care starter plan**: species-aware, editable daily check-ins, with life-stage and household-goal choices. Existing routines, including paused routines, are preserved. Saving again does not duplicate a starter routine. This is an organisational aid, not a prescribed feeding, exercise or medication schedule.

Today highlights one relevant next action. Search finds each pet's import, safety, starter and weekly-card tools. Family invitations use an account-free preview; acceptance still requires sign-in and an explicit decision. Existing `/family?owner=...&invite=...` links still work.

New forms and the daily-routine form preserve drafts in session storage scoped to the account. Original card files are not stored. The OS share sheet is used when supported, with copy/download fallbacks.

## Document reader

`npm run dev` and `npm run build` copy pinned Tesseract worker/core/English-language assets to `public/document-reader/v1`. That directory is generated and ignored by Git. No CDN or cloud OCR provider receives a document. The optional assets are excluded from the service-worker precache, so installing an app update does not require downloading the OCR engine. First-time image reading requires access to those assets. Printed English text works best; handwriting and ambiguous dates require manual correction. PDFs use a bundled PDF.js worker; scanned PDF pages go through the same local OCR flow. A document is limited to 10 MB and five PDF pages.

## Backend and data

New Firebase callables: `getMySafetyCard`, `saveSafetyCard`, `getSafetyCard`, `publishWeeklyCard`, `getWeeklyCard`, `listMyWeeklyCards`, `revokeWeeklyCard`, `previewCareInvitation`.

- `petSafetyCards`, `safetyCardLinks`, `weeklyCardLinks`, `weeklyCardIndex`: server-only. Public endpoints return explicit projections; collection enumeration and direct client writes are denied. Public tokens contain 256 bits of randomness. Safety reads resolve the live owner configuration rather than stale copied contact details.
- `careHandovers`: owner-written instructions, read by the owner and active care-team members.
- `careUpdates`: care-team-only notes and resized JPEGs, limited to 500 characters / 350 KB per image. The record must be completed, writer identity is validated, and viewers cannot write. Private images stay in access-controlled RTDB records; the existing public-media storage paths are not reused.

Deploy the additive database rules and new callables before the frontend that uses them. No existing records need migration. The previous `petOwners` ownership index remains required, as for existing private-care features. Existing function exports are left intact.

## Measurement

New actions use the existing opt-out-aware first-party analytics with a fixed event allowlist. No names, notes, images, contact details, public tokens or arbitrary properties are included. A signup can be attributed to an allowlisted safety/week/family link CTA within 24 hours; anonymous page views are not recorded. `npm run report:retention -- --input /path/to/productEvents.json` now also reports aggregate setup, import and sharing funnels. Counts represent measured accounts, not all app users or all shared-link visits.

## Verification

- `npm test`: date parsing, projection privacy, starter deduplication/edit preservation, growth metrics, and existing domain checks.
- `npm run test:rules`: existing security/reminder/family/Copilot coverage plus public projection, token ownership, revocation, handover/photo authorisation and expiry checks.
- `npm run test:browser`: existing UX and new workflows.
- `npm run test:growth`: real OCR and PDF reading, reviewed import/retry, draft restoration, starter plans, finder contact, handovers, notes and weekly-card export/revocation in desktop Chrome, Android Chrome and iPhone WebKit profiles.
- `npm run build`: production bundle and PWA generation. Existing PWA lifecycle tests remain in `playwright.pwa.config.cjs`.
