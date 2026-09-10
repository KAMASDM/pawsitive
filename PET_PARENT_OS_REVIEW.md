Pawppy: product, retention, and AI review

Reviewed 9 September 2026. This is a source-code review and product proposal. I inspected routing, authentication, onboarding, mobile and desktop home experiences, pet dashboards and profiles, health/medication forms, weight and expense trackers, challenges/quizzes, notifications, database rules, and the PWA setup. I also checked primary sources for comparable products and AI approaches. I did not access production analytics, verify deployed functions or database rules, or perform an authenticated device walkthrough. Features present in source are not proof that they work in production. No application code was changed.

**The recommendation:** make Pawppy the place a household uses to decide, coordinate, and remember pet care. Build the recurring care experience around the features already present, then use AI to reduce the effort of maintaining that history.

**1. The foundation is substantial, but the product promise is fragmented.**

| Existing capability | Source evidence | Role in a Pet Parent Operating System |
| --- | --- | --- |
| Multiple pets, profiles, vaccinations, medical notes | `MyPets`, `Profile`, `PetDetails` components | Persistent pet identity and care history |
| Medication records and schedule forms | `MedicationDialog`, `MedicationScheduleDialog`, `PetDetailsPage` | Recurring care, once scheduling and completion are connected |
| Weight history and expenses | `WeightTracker`, `ExpenseTracker`, exposed in `PetDetailsPage` | Longitudinal records and household planning |
| Public profiles, QR sharing, posts, events | `PetProfile`, `PetDashboard`, `PetEventsTimeline` | Memories, identity, and selective sharing |
| Nearby pets, resources, tagged places | `NearbyMates`, `Resources`, `PlaceTagging` | Local discovery when a real need arises |
| Adoption and lost/found | `AdoptPet`, `LostAndFound` | Occasional high-value support |
| Challenges, quizzes, XP, leaderboards | `features/challenge`, `features/quiz`, `utils/xpSystem.js` | Optional enjoyment and weekly participation |
| Shopping, vendors, orders, admin tools | `features/commerce`, `features/ecommerce` | Replenishment and service access |
| Push, inbox, email, scheduled jobs | `services`, `functions/index.js` | Returning at the right moment |

The missing connection is a workflow that starts with something due, helps someone do it, records what happened, and makes the next visit more useful. A collection of destinations becomes an operating system when identity, permissions, history, and actions work across those destinations.

**2. The retention diagnosis is a set of testable hypotheses.**

The reported low return rate is real user feedback, but its causes cannot be established from code alone. I would investigate these mechanisms first:

- **Several prominent features are naturally occasional.** Adoption, lost/found, breeding, and finding a groomer matter greatly when needed. They do not inherently create a daily reason to return.
- **Everyday care is not the main navigation model.** The bottom bar currently contains Challenges, Shop, Home, Quiz, and Profile. The pet dashboard foregrounds a social-style hero, posts/events counts, availability controls, and feature journeys. Care information exists, but a single actionable daily agenda is absent from the inspected flows.
- **Useful tools are spread across pet screens.** The dashboard, public profile, pet details page, and owner profile expose different capabilities. Weight and expenses are in the details page, while the landing experience emphasizes other actions.
- **The experience varies by device.** `PetSelector` sends desktop users to `Home`, while mobile generally restores the last pet or opens the first pet. A unified care model should survive those layout differences.
- **Setup measures completion more than value.** The checklist tracks adding a pet, adding a vaccination, enabling notifications, and creating a profile slug. It does not establish a first recurring routine, a completed care action, or a successfully scheduled reminder. Users with pets for whom vaccination setup is not relevant need a different setup path.
- **The app asks for commitment early.** The root route is the login page. Installation can be prompted after two seconds, and push setup runs around authentication. Visitors can encounter these requests before seeing personal value.
- **The existing game loop is separate from care.** XP rewards quizzes, challenge entries, votes, wins, and shares. These are already implemented; simply adding more points is unlikely to resolve the central workflow gap.
- **Measurement is missing in the inspected app source.** Firebase has a measurement ID configuration, but I found no analytics initialization or product event calls. Console logs, stored quiz scores, and push tokens do not provide a retention funnel.

Do not assume every satisfied owner should open daily. A household managing recurring care may return frequently; a healthy adult pet's single owner may be well served by a weekly review and dependable reminders. Track recurring usefulness alongside visits.

**3. Reliability findings should precede a retention campaign.**

**Pet storage paths disagree.** The shared save hook writes `userPets/{uid}/{petId}`. `dailyHealthNotifications` iterates `users/{uid}/pets`, and the weekly digest reads that same alternate path. `useVaccinationReminder` reads a third path, `pets/{uid}`. Unless there is an external synchronization process, these readers can miss pets saved by the app. See `src/hooks/usePetOperations.js:86`, `functions/index.js:793`, `functions/index.js:899`, and `src/hooks/useVaccinationReminder.js:19`. This is a concrete integration mismatch; production impact remains to be verified.

**Medication scheduling needs end-to-end verification.** Forms promise reminders at scheduled times, and the home reminder component displays medication schedules. I did not find a corresponding time-based medication dispatcher in the inspected scheduled backend jobs. A saved schedule is not equivalent to a delivered reminder or a recorded dose.

**Notification preferences are not consistently enforced.** The client has preference checks, but the inspected backend `notifyUser` sends to the saved token without checking the user's category preferences. Scheduled email paths also need review. It stores one FCM token per user, so another device can replace the earlier device's token. Add per-device tokens, category preferences, time zones, quiet hours, deduplication, retries, and a traceable result for each attempt.

**Some reminder content overstates missing information.** The daily checkup job treats an absent checkup date as overdue, and a date-specific deduplication key allows another message each day. Ask the owner to supply the date; absence of a record is not proof the visit did not happen. Test this when repairing the storage paths so fixing delivery does not introduce daily unwanted alerts.

**Push permission needs a deliberate user action.** Authentication effects currently request permission, and setup awaits service-worker registration before requesting it. Provide an explicit “Remind me about this” action after the owner creates a reminder. Apple documents Home Screen installation and direct user interaction requirements for iOS web push. Verify on actual installed iPhone and Android experiences. [WebKit documentation](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

**Private care data needs real access boundaries.** The checked-in Realtime Database rules grant public reads at `userPets/{uid}`, beneath which health and expense data are stored. Public reads also exist for pet events. The profile's UI privacy check does not enforce database access. Split public profile fields from private care records and grant household/caregiver access explicitly. Verify the deployed rules before making privacy promises or expanding AI access. Firebase explains that read permissions granted at a parent apply to descendants. [Firebase rules documentation](https://firebase.google.com/docs/database/security).

**Health labels should describe what is known.** `PetSelector` derives “All good” from vaccination dates, and `WeightTracker` has broad hard-coded weight ranges. Use “Recorded vaccinations up to date” and descriptive weight trends; use a veterinarian-provided target where available. Avoid presenting a general health verdict from those limited inputs.

**4. Make the category promise understandable.**

Suggested positioning:

> Pawppy — The Pet Parent Operating System.
> Your pet's care, records, and routines. One place for the whole family.

Suggested investor narrative:

> Pawppy brings the daily work of pet parenting into one shared system: what needs doing, who is doing it, and what has happened over time. Its AI can use that history to reduce admin and help parents prepare for the next step.

“Operating system” is a useful category label, but the next sentence must explain the practical benefit. The differentiator to test is a shared, contextual care experience. Reminder and record management already exist in products such as [11pets](https://www.11pets.com/en/feature). Pawppy needs to demonstrate how it connects a care need to an action and the people involved.

**5. Replace the default home experience with Today.**

Illustrative screen content, based on a household's own saved plan:

| Today with Milo | Action |
| --- | --- |
| Breakfast recorded by Asha at 8:10 | View / Correct |
| Evening walk planned for 6:00 | Start / Reschedule |
| Saved medication reminder at 8:00 | Record given / Open instructions |
| Vet visit on Friday | Prepare visit summary |
| Anything different today? | Add a quick observation |

Show relevant tasks across all pets, with a pet switcher. Offer one-tap completion, a timestamp, the person who recorded it, and an undo/correction path. In a calm period, say “Nothing due today” and provide the next relevant date. Do not fill empty space with invented urgency.

Suggested navigation: **Today · Care · Add · Discover · Family**. Put quizzes and challenges inside Discover; put shopping there and in contextual replenishment actions. Keep a consistent navigation location instead of hiding it during ordinary scrolling unless device testing supports that choice.

Start with owner-selected routines: feeding, walking, play, litter care, grooming, or existing medication schedules. Do not prescribe a routine merely from a breed name. Make the setup species-appropriate and allow approximate age or unknown breed.

The first session should end with a small result: add a pet, choose one current need, set a routine or reminder, and see the first useful Today screen. Ask for installation or notifications at the point they improve that result. An early design target can be a useful result within two minutes; measure the actual time.

**6. Prioritize interactions that solve repeated problems.**

| Priority | Feature | Why a parent might return | What to measure |
| --- | --- | --- | --- |
| 1 | Today plus quick care logging | Check what remains and record it quickly | Care actions on distinct days |
| 2 | Family/caregiver sharing | Know who fed, walked, or administered existing treatment | Accepted invitations and shared task completion |
| 3 | A personal weekly recap | Review observations, upcoming dates, and unresolved tasks | Recap-to-useful-action conversion |
| 4 | Document capture | Turn a vaccination card or receipt into a reviewed record | Corrected fields and time saved |
| 5 | A visit-preparation summary | Bring a clear history and questions to a professional | Summaries used/exported and owner feedback |
| 6 | Pet-specific care assistant | Ask questions about saved records without searching screens | Accurate answers and completed actions |

Family sharing is a particularly strong hypothesis: “Has someone already fed Milo?” is a repeated coordination problem. Add revocable roles and time-limited sitter access. Record actions against specific task occurrences so two devices cannot silently record duplicate completion of the same scheduled dose.

Keep the existing emotional layer. A “This week with Milo” memory card can combine photos and recorded milestones. Offer short enrichment challenges and nearby meetups where there are enough participants. Separate social playdates from breeding, since the current “Nearby Mates” framing will not match every parent's intent. Prefer optional weekly progress over punitive daily streaks; missed logging should not suggest someone failed their pet.

Use commerce when it assists an existing need: a saved shopping list, a replenishment reminder based on an owner-entered quantity and consumption estimate, or a repeat purchase. Show how an estimate was calculated and allow correction. Do not imply a product is medically suitable solely because its description looks relevant.

**7. Rebuild the landing page as a demonstration of value.**

The `/` route currently renders `Login.jsx`. Its rotating cards lead with Nearby Mates and “AI-powered breed compatibility and health verification.” The source contains fixed claims including “98% success,” “128 pets nearby,” “45 active now,” “10K+” parents, and “5K+” successful matches. I found no model implementation or linked measurement behind those claims. Validate each claim against evidence, remove it, or label any illustrative numbers explicitly as demo data.

Recommended page sequence:

1. **A concrete promise.** Category label, the plain-language benefit, and primary CTA “Create your pet's care space.” Secondary CTA “Try a sample day.” Keep sign-in available without making the form the whole page.
2. **An interactive sample Today screen.** Let visitors mark a fictional meal as done, see the caregiver attribution, and open a sample care timeline. Clearly label it as a demo. No account needed.
3. **Three everyday problems.** “Who fed them?”, “Where is the vaccination record?”, and “What do I need for the vet visit?” Show the corresponding product interactions.
4. **Real product evidence.** Screenshots or a short walkthrough of the current working product. Mark future AI or family features as planned until shipped.
5. **Relevant starting points.** New parent, ongoing care, multiple pets, or shared household. Show a tailored starting plan rather than asking visitors to understand the entire feature catalog.
6. **Trust and boundaries.** Explain who sees care data, how sharing works, and the assistant's role once the underlying controls support those statements. Use genuine testimonials with permission and measured metrics only.
7. **Pricing and installation clarity.** Explain what is available free, what is paid if applicable, and how the PWA works on phones. Match metadata, manifest wording, FAQ, and welcome emails to the same brand and promise.

On mobile, keep the first screen focused on the promise, one visual, and one action. The existing carousel animation does not communicate the sequence of using the product. The strongest interactive landing element is a small working demonstration of that sequence.

**8. Build AI around the pet's history and actions.**

Proposed examples:

- “Show everything we recorded since Milo's last vet visit.” Return a dated summary with links to the underlying entries.
- “We walked for 25 minutes.” Turn the voice note into an editable walk entry for the selected pet.
- Photograph a vaccination card. Extract visible fields, highlight uncertainty, and ask the parent to confirm before saving. Do not invent a next-due date absent from the document or a confirmed plan.
- Upload a receipt. Suggest expense fields and a category for review.
- “Prepare a handover for our sitter this weekend.” Draft a care checklist from saved instructions and selected sharing permissions.

These interactions make the product feel futuristic because they remove repeated input and remember context. A generic chat screen that does not know the pet's records has a weaker reason to live inside Pawppy.

Recommended architecture:

`Authenticated request → permission-filtered pet records + selected reference material → model → validated answer or proposed action → user review where needed → authorized write → updated Today/timeline`

Keep routine scheduling, permissions, dates, and calculations in ordinary application code. Use direct structured queries for known records and retrieval for documents. Retrieval-augmented generation supplies relevant material to a model at answer time; it does not train the model and does not guarantee correctness. Require source links, an insufficient-information response, and careful evaluation of missing or contradictory records. [Google Research on sufficient context](https://research.google/blog/deeper-insights-into-retrieval-augmented-generation-the-role-of-sufficient-context/).

Serve AI through an authenticated backend, with request limits and per-feature cost tracking. Documents are untrusted input: extracted text must not change permissions or authorize actions. Keep care-data processing and model-training consent separate. User history should remain an editable database record, not become embedded in model weights by default.

For the first release, scope the assistant to record retrieval, summaries, document extraction, and administrative help. Build health-related workflows with veterinary review; do not launch image diagnosis, disease probabilities, dose changes, or a universal “health score” as engagement features.

**9. Yes, Pawppy can have its own neural network, but choose the ownership level deliberately.**

| Approach | What Pawppy would own | Recommendation |
| --- | --- | --- |
| Existing model with Pawppy's retrieval and workflows | Product, data structure, reference collection, action logic, evaluations | Best initial path; accurately describe this as a proprietary AI system powered by an underlying model |
| Self-host an open-weight model | Serving infrastructure and deployment configuration | Consider for measured privacy, control, or cost requirements; license and operational work still apply |
| Fine-tune an existing model | Task-specific weights/adapters and training/evaluation data, subject to the base license | Consider once a specific repeated task and a reviewed dataset justify it |
| Train a small task model | A model for a bounded prediction or ranking task | Possible earlier than training a general language model, but compare with simple rules first |
| Train a general foundation model from scratch | Broad model training pipeline and weights | No evidence in this repo that the data, compute, or research investment is currently justified |

Fine-tuning can use techniques such as LoRA, which adapt a pretrained model using fewer trainable parameters. This reduces fine-tuning overhead; it does not remove the need for suitable data, evaluations, or serving resources. [Hugging Face LoRA documentation](https://huggingface.co/docs/peft/main/conceptual_guides/lora).

A sensible first proprietary model might rank relevant care cards or classify document fields after simpler methods show a measurable shortcoming. Lost/found image retrieval is another later research candidate; similarity must remain a suggestion for human review, not a verified identity match.

Collect consented, reviewed examples and feedback on corrections. Split evaluation data by household/pet and time to avoid testing on near-duplicates from training. Compare accuracy, false alerts, abstention, latency, cost per successful task, and actual parent usefulness. Do not select a model based only on a convincing demo or specify an arbitrary training-example count before measuring learning curves.

For longer-term ambient features, explore supported wearable integrations before building hardware. Products such as Tractive already use activity and sleep histories for trend monitoring on compatible devices; this requires sensor inputs and does not establish that integrations are commercially or technically available to Pawppy. [Tractive feature documentation](https://help.tractive.com/hc/en-us/articles/360011024119-What-health-features-does-Tractive-track). An evolving pet history is achievable now; a medically validated predictive digital twin is a separate research ambition.

**10. Measure the change and sequence the work.**

Interview 8–12 consenting parents across one-time users, repeat users, new pet parents, and shared households. Watch a small number complete setup, find the next care task, and open an installed-app reminder. These interviews uncover friction; they do not estimate market-wide prevalence. Ask what triggered the install, what result they expected, what they used instead afterward, and whether a reminder ever arrived.

Instrument a privacy-conscious funnel: landing/demo use → signup → pet created → routine saved → first useful action → push setup result → return with another useful action. Track notification attempts, provider acceptance, available delivery signals, opens, and task completion separately. Provider acceptance is not proof someone received or read a notification. Record event categories and identifiers rather than private notes or document text.

Report D1, D7, and D30 retention with explicit cohort windows and sufficient observation time. Segment by acquisition source, device/install mode, household type, pet life stage, and initial need. Distinguish account returns from household activity so a second caregiver is not mistaken for the original user returning. Avoid treating correlations between feature use and retention as causal evidence.

Suggested primary product measure: households completing a meaningful care workflow in a week, alongside activation-to-week-four care retention. For a pilot of daily-routine households, track action days per week; do not apply the same daily target to all owners. Guardrails: notification opt-outs, false alerts, duplicate completions, failed saves, time required to log care, and AI correction rates.

| Illustrative phase | Deliverable | Decision gate |
| --- | --- | --- |
| Weeks 1–2 | Instrumentation, user interviews, reminder-path investigation/fixes, privacy boundaries, truthful landing copy | Can a test pet's reminder reliably reach the right installed device and open the right record? |
| Weeks 3–4 | Unified Today, one routine type, completion history, contextual onboarding, sample landing demo | Can a new parent get a useful result quickly and repeat it without assistance? |
| Weeks 5–8 | Expand useful routine types, family access, weekly recap; evaluate first cohort results | Do activation and repeat care improve without excessive prompts or logging effort? |
| Weeks 9–12 | Limited document extraction and grounded visit-summary pilot | Are reviewed outputs accurate enough, useful, and affordable to expand? |
| Later, evidence-dependent | Fine-tuning, contextual ranking, supported device integrations | Do they outperform the simpler baseline on a documented unmet need? |

This is an illustrative sequence, not a staffing or delivery commitment. Calendar dates depend on team capacity, production findings, and the chosen scope. Start with a small reversible pilot; randomize a larger rollout if the sample permits, otherwise report directional learning without invented statistical certainty.

The first investment decision should fund reliable care workflows and proof of repeat value. A proprietary dataset and model opportunity can then grow from a product people already choose to use.
