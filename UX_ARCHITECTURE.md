# Pawppy UX architecture

This document describes the product structure implemented in the application and the compatibility rules for evolving it safely. It is intentionally route- and data-aware: the goal is to improve discovery without rewriting mature feature logic.

## Product model

Pawppy has two distinct profile concepts. They must never share the same user-facing name:

- **Account** is the human pet parent's identity, settings, requests, messages and pet management at `/profile`.
- **Pet profile** is a pet's social identity, posts, events and shareable public link at `/pet/:slug`.

The authenticated experience is organized around five durable user intents:

1. **Home** — today's overview, owned pets, health status, onboarding and relevant entry points.
2. **Discover** — search and browse pets, local care, adoption, lost-and-found, places and marketplace features.
3. **My pet** — the selected pet's care records, social page, posts, events, availability and requests.
4. **Activity** — challenge and quiz participation, history and leaderboards.
5. **Account** — the human user's settings, messages, requests and multi-pet management.

Desktop navigation adds direct **Care** and **Shop** links because there is enough horizontal space. Mobile keeps those destinations inside Discover and universal search.

## Feature inventory and integration

| Area | Existing routes | Primary data/services | UX entry point |
| --- | --- | --- | --- |
| Home and pet switching | `/my-pets`, `/my-pets/:petId` | RTDB `userPets/{uid}` | Home, central My pet tab |
| Pet social page | `/pet/:slug` | RTDB `petSlugs`, `userPets`, `petPosts`, `petEvents` | Home profile education, pet dashboard |
| Human account | `/profile` | RTDB `users`, `userPets`, mating requests and conversations | Account tab |
| Pet discovery and mating | `/nearby-mates`, `/pet-detail/:petId` | RTDB `userPets`, users, requests; geolocation | Discover, universal search, pet dashboard |
| Care directory | `/resource`, `/resources/:id` | Google Maps/Places, geolocation, local cache | Care nav, Discover, search handoff |
| Adoption | `/adopt-pets` | RTDB pet availability, users, conversations; geolocation | Discover, pet dashboard |
| Lost and found | `/lost-and-found` | RTDB reports, Storage, Google Maps, matching logic | Discover, pet dashboard |
| Pet-friendly places | `/place-tagging` | RTDB and Google Maps | Discover, pet dashboard |
| Notifications | `/notifications` | RTDB user notification counters and notification services | Header bell, search |
| Challenge | `/challenge/*` | Firestore challenges, entries, votes and Cloud Functions | Activity, Discover |
| Quiz | `/quiz/*` | Firestore quiz bank, history, stats and leaderboard | Activity, Discover |
| Activity history | `/activity` | Firestore user quiz/challenge history | Activity tab |
| Marketplace | `/shop`, `/products/:slug`, `/store/:slug`, cart, checkout, orders | Firestore commerce services and role guards | Desktop Shop, Discover, search |
| Vendor/admin | `/vendor/*`, `/admin/*` | Firestore commerce services and role guards | Search/role-specific pages; never consumer primary nav |
| Help and legal | `/faq`, informational and policy routes | Static application content | Account menu/search/footer |

## Navigation contract

- `/my-pets` is the stable authenticated home on every viewport.
- `/my-pets?picker=true` remains a compatible pet-selection link.
- `/my-pets/:petId` remains the private owner dashboard.
- `/pet/:slug` remains the shareable social route.
- `/dashboard` continues to redirect to `/my-pets` for old bookmarks.
- All commerce, resource, profile, challenge, quiz, adoption and safety routes remain unchanged.
- Feature components retain their current Firebase paths and action handlers. Navigation reorganizes entry points; it does not create a second implementation of a feature.

## Search contract

Universal search must answer three different needs:

- **Find my thing:** owned pets and their private dashboards.
- **Find another pet:** non-private community pets with valid public slugs.
- **Find a capability:** every customer-facing destination, using plain-language synonyms.

For location-based care, search transfers the text to `/resource` instead of duplicating Google Places logic. The resource page remains the owner of geolocation, caching, filtering and place details.

The current RTDB schema requires reading `userPets` for community discovery, as the existing Nearby Mates and Adoption features already do. A future security migration should introduce a purpose-built public pet index; the UI contract should not change when that backend optimization happens.

## Pet dashboard hierarchy

All existing pet actions are retained but grouped by intent:

- **Care & records:** health, nearby care, vaccines and events.
- **Social profile:** posts, public pet page, nearby pets and messages.
- **Safety & community:** lost-and-found, adoption, places and incoming requests.

Share, QR and view-profile controls remain in the profile hero because they are high-value identity actions.

## Discovery journey pattern

Care, community pets, adoption and lost-and-found now use a shared page hierarchy:

1. A concise purpose-led hero with a predictable return to Discover.
2. Urgent or high-value actions in the hero instead of burying them in filters.
3. Search and current context before advanced filters.
4. A clear result title, count and scope such as distance or selected pet.
5. Empty states that explain why content is unavailable and link to the action that resolves it.

Feature-specific result cards, Google Maps integration, Firebase reads/writes, forms and conversation modals remain unchanged.

## Compatibility and rollout rules

1. Do not rename or remove existing routes. Add aliases or redirects when terminology changes.
2. Do not move Firebase records as part of a UI change.
3. Keep feature handlers in their existing components; shared navigation passes routes and state only.
4. Verify direct URL loading, browser back/forward and state-based deep links.
5. Test mobile and desktop separately, especially `/my-pets`, pet dashboards and modal flows.
6. Run lint, unit tests and production build before any preview or deployment.
7. Ship navigation/home changes as one reversible frontend deploy; backend/rules migrations remain separate.
8. Keep the prior Netlify deploy available for immediate rollback and do not deploy without explicit approval.

## Follow-up design phases

- Replace broad public-pet reads with a public discovery index after rules migration.
- Give Resources, Nearby Pets, Adoption and Lost & Found a shared results/filter pattern.
- Add contextual empty states that link to the action which creates eligible content.
- Add a unified message/request inbox instead of distributing conversations across Account and feature pages.
- Add analytics for search queries, Discover selections, pet-profile views and share actions to validate discoverability.
