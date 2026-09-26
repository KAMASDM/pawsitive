# Pawppy interface system

## Direction

Warm and refined. Pawppy should feel like a quiet, dependable place to care for a pet: soft neutral surfaces, restrained lavender, readable system typography and real pet photos. Colour identifies an action or state. Motion explains a change. Neither should compete with the task.

## Decisions in this implementation

| Area | Purpose and resulting behaviour |
| --- | --- |
| Today | Pets, current routines and saved progress come first. The promotional hero and duplicate filters are removed. Secondary destinations follow the care list. |
| Navigation | Five stable destinations: Today, Care, Family, Discover and Profile. The same structure appears on desktop. Add is a contextual action. Scrolling does not hide navigation. |
| Routine creation | A focused sheet keeps the care plan in context. Dismissal preserves the draft. Save errors remain inside the sheet. Medication instructions remain in health records. |
| Care | Each pet has a consistent set of links to health records, visit preparation, an optional AI summary and their profile. |
| Family | Team members, invitations and shared plans have separate sections. Role descriptions explain access before an invitation is created. Removing access requires confirmation. |
| Discover | Destinations are grouped by intent: places, community and things to enjoy. No unsupported popularity, distance or product claims. |
| Profile | Identity and pet management replace promotional account panels. Community availability lives in pet editing. Destructive actions live in pet options, followed by confirmation. Pet cards do not infer vaccination status from incomplete records. |
| Settings | Device connection, reminder choices, privacy, app updates and sign-out have distinct sections. Controls have larger hit areas; preferences remain explicitly saved. |
| Search | A labelled, focused sheet searches pets and actual destinations. Escape closes it and focus returns to the invoking control. |
| Updates and loading | Quiet, legible status feedback preserves the PWA update and startup-recovery behaviour. |

## Foundations

`src/styles/app-system.css` owns the shared tokens and patterns.

| Token | Value / role |
| --- | --- |
| Canvas | `#f6f5f2`, warm neutral |
| Surface | `#ffffff` |
| Primary text | `#292733` |
| Secondary text | `#716e79` |
| Accent | `#71568e` |
| Accent surface | `#eee8f3` |
| Completion | `#31725c` |
| Dividers | `#e8e5e2` |
| Typography | Platform system font; 30–40px page titles, 19–23px section headings, 14–16px principal content |
| Shape | 22–24px panels, 13–15px controls, circular avatars |
| Touch | Principal controls have at least 44px hit areas |

Use `PageHeader`, `ActionRow`, `PetAvatar`, `EmptyState`, `PageLoading` and `Sheet` from `src/components/UI/AppUI.jsx`. Prefer these patterns to new one-off cards and inline colour values.

## Interaction rules

- Keep the user's next action clear; put maintenance and infrequent actions in secondary positions.
- Use text labels for navigation. Show the active destination with `aria-current`.
- Use native dialogs for modal isolation. The shared sheet manages Tab traversal, Escape, scroll locking and focus restoration. An explicit initial-focus marker supports search.
- Preserve safe-area padding on phones. Keep the tab bar clear of the software keyboard when the visual viewport reports it.
- Respect reduced motion. Route transitions use opacity so they do not change the positioning of child overlays.
- Retain truthful empty, loading, error, pending and completed states. Do not invent progress or imply absent records mean absent care.
- UI preferences must not silently change notification delivery, privacy, permissions or saved care data.

## Review and validation

Visual previews in `design-review/` use synthetic local emulator data, with an existing Pawppy image as a sample pet photo. They are not production account screenshots.

Browser coverage includes saved routines and corrections, midnight/noon entry, reminder settings, caregiver revocation, Copilot consent, persistent navigation, 320px layouts, modal focus, draft retention and confirmation before access removal. PWA lifecycle tests remain separate and use the production build.

The shared shell applies throughout the app. This pass redesigns the principal everyday destinations and profile pet cards; specialist commerce, medical and community editors retain their existing feature layouts. Their further redesign should use the same tokens and interaction patterns and receive its own flow review. Physical-device keyboard, accessibility and long-session checks remain necessary before claiming native-app parity.

Design references: [Apple layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout) and [tab-bar guidance](https://developer.apple.com/design/human-interface-guidelines/tab-bars). This remains a web app, with interaction patterns informed by native mobile conventions.
