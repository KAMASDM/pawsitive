Pawppy contextual AI — beta and next-phase contract

Status: Pet Care Copilot beta implemented with Google Gemini 3.1 Flash-Lite on Vertex AI. General care questions and explicitly approved, owner-only text record summaries are available at `/copilot`. Existing visit exports remain deterministic. Document import, voice, proprietary model weights and training are not implemented. See COPILOT_EVALUATION.md for validation and operating controls.

**Next workflow: document import (not implemented)**

Start with importing an existing document into a draft and reducing the effort of preparing a visit summary. Keep Today, reminders and saved records usable without AI. Use a hosted model as the initial evaluation baseline unless the owner chooses a self-hosted-only constraint. The Copilot beta uses server-side Google application credentials; document processing requires its own implementation and evaluation.

1. The owner selects a pet and a document, sees which provider processes it and the applicable data-handling terms, and opts in to that processing. Model-training consent is separate and off by default.
2. The backend verifies the owner and the selected pet, then validates size and actual file type. It stores the upload under an owner-scoped private path with an expiry. Do not use the current catch-all storage rule or a public media host for private documents.
3. A worker extracts candidate fields. Uploaded text is untrusted data: instructions inside a document cannot override system rules, request tools, change permissions, or approve a write.
4. Each candidate contains a field, value, source document ID, page/region or text span, and an uncertainty indicator. Unknown dates, ambiguous units, handwriting and conflicting instructions remain unresolved. A model’s confidence number is not treated as calibrated accuracy.
5. A review screen shows the original beside editable candidates. A parent explicitly chooses which values to save. The save endpoint checks ownership again and validates the exact application schema; it never applies model text as an arbitrary database path or instruction.
6. Store provenance with the reviewed record and allow correction and deletion. Model output never changes a dose, establishes a diagnosis, or sends a message to a veterinarian on its own.

**Backend boundaries**

- Use separate endpoints for upload permission, extraction status, preview, and reviewed save. Prefer asynchronous jobs for PDF/image work; authenticate every job read and result fetch.
- Permit retrieval only from the requesting owner’s approved records. Current family roles cover daily routines; they do not grant AI access to health history or uploaded documents.
- Use per-account daily quotas, per-job input/output limits, an application-wide spend ceiling, idempotent job IDs, short timeouts and bounded retries. Persist aggregate usage and error codes rather than raw document contents in logs.
- Return the provider/model version, record revision, citations and unresolved fields. Reject stale save previews if the underlying record has changed.
- Fail explicitly on unsupported input, missing configuration, provider timeout, rate limits or insufficient evidence. Do not manufacture a successful answer or quietly fall back to an unrelated pet’s context.
- Process voice only after an explicit recording action. Transcripts are editable drafts and must go through the same reviewed-save boundary. Voice recording, document extraction and receipt imports require separate representative evaluations.

**Evaluation before a pilot**

Create a labelled set from synthetic fixtures and explicitly consented, de-identified examples. Keep acquisition consent and review provenance. Include clear/blurred images, multi-page files, conflicting dates, partial records, uncommon units, handwritten instructions, empty files, mixed pets and adversarial instructions inside documents.

For each provider/version, report:

- Field-level exact match and omission rates against reviewed labels; separate dates, identifiers, amounts and medication text.
- Unsupported assertions, wrong-pet attribution, invalid citations and cross-account exposure.
- How often parents correct the draft, time to a correct saved record, latency and cost per successful import.
- Performance on held-out households/pets and later documents, with sample sizes. Do not randomly split near-duplicate documents across training and evaluation.

Release only after access tests show no cross-account result retrieval, every sensitive save requires review, source links resolve, failure states work, and the owner accepts measured accuracy/cost for the bounded workflow. Use veterinary review for medication-related extraction examples. Do not generalise extraction results into diagnostic claims.

**What owning a neural network would mean**

An owned model is a later experiment for a bounded job such as document extraction or record classification. First preserve a simpler rules/retrieval baseline and a hosted-model baseline. Then train or fine-tune only on consented examples, keep a household-separated holdout, review the base model/data licences, and measure a concrete quality, privacy-control or cost improvement. Plan serving capacity, monitoring, deletion/withdrawal handling and model-version rollback before shipping it.

A digital twin, health prediction system, lost-pet image matching model or wearable integration needs its own data, evaluation and partner-access work. None should be marketed as available merely because an assistant interface exists.
