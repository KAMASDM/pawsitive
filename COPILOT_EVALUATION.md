# Pet Care Copilot beta

Implemented September 12, 2026. Hosted Google Gemini `gemini-3.1-flash-lite` via Vertex AI global, authenticated Firebase Functions in `sweekar-af756`. No proprietary neural network, model training, document extraction, voice processing or automatic care-record edits.

## User workflow

Home and each owned pet's Care card link to `/copilot`. General care questions send only the question. Record summaries require an exact, bounded preview and separate approval. Only the owner's profile, selected vaccination fields, medication names/status, condition/allergy labels and three recent weights are eligible. Medication dose fields, free-form notes, documents, contacts, expenses and messages are excluded. Summary source references point back to approved records. Family routine access does not authorize summaries.

Questions and answers are not persisted by Pawppy. Each question starts fresh. Google processing, including applicable abuse-monitoring retention and global processing, is disclosed before consent. This is not a zero-retention service. See [Google data governance](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/data-governance).

## Controls and operations

- Admin-only RTDB `copilotConfig/enabled` is the kill switch. Set false to stop model calls. It defaults to disabled if absent. Client rules deny reads/writes to configuration and usage.
- Verified sign-in, owner index and record ownership are checked server-side. Summary fingerprints are checked before and after generation. No client-supplied record contents are trusted.
- Atomic usage reservation: five requests per account and fifty total per UTC day, fifteen seconds between requests, request-ID deduplication. Failed provider attempts count. Current-day counters use hashed identifiers, with no prompt/output storage.
- 1,000-character questions; 8,000-byte context limit; 1,024 maximum output tokens; 30-second provider timeout; three maximum instances per callable. These bound beta usage, not the total Google Cloud invoice. No provisioned model capacity.
- Static urgent-care/dosing boundaries plus model instructions and output validation. Output is escaped text. No tools, arbitrary record access, automatic saving, messages or medication decisions.
- Provider failure is shown as unavailable, with no fabricated fallback. The beta may be unavailable after fifty daily requests; raise the shared limit only after measuring demand and costs.

## Verification

- 26 domain unit tests passed, including five new Copilot tests.
- Seven Copilot emulator tests and eight database-rule tests passed: ownership, verified auth, explicit consent, changed-record rejection, concurrency limits, duplicate requests, provider failure and client-denied config/usage.
- Nine browser tests passed, including new consent, preview, pet switching, session clearing and mobile/desktop overflow checks. Browser callable responses are fixtures; these tests do not validate model quality.
- Production build passed. Real deployed callables passed verified sign-in, owner preview, missing-consent rejection, general answer and cited summary using a temporary fictional pet. Temporary identity, pet and profile were deleted afterwards; hashed usage counters remain until their normal rollover.
- Ten initial live synthetic model examples covered everyday care, symptoms, indirect treatment requests, prompt injection, record summaries, missing facts, unsupported trends and off-topic requests. Two unsupported assumptions (sex and inferred recent medication-status change) led to stricter instructions. Seven subsequent examples, including four held-out cases, passed manual review for those boundaries and valid source IDs.

This is a small smoke evaluation, not a clinical benchmark, a guarantee against hallucinations or evidence that retention has improved. The record-injection example ignored the malicious instruction but still described its record as a recorded condition: references identify saved input, not independently verified medical truth. Veterinary review and a larger representative evaluation are needed before expanding health-related scope.

Reproduce the billable synthetic evaluation from the repo root with authorized Google ADC:

```sh
GCLOUD_PROJECT=sweekar-af756 node scripts/evaluate-copilot.cjs
```

Outputs go to `/tmp/pawppy-copilot-evaluation.json` (override with `COPILOT_EVAL_OUTPUT`). Review answers manually; schema validation alone cannot judge truth or suitability. Do not substitute real pet records without separate processing consent.

Model reference: [Google model documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-1-flash-lite). Future work is described in AI_IMPLEMENTATION_SPEC.md.
