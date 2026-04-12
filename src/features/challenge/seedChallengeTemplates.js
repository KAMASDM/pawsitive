/**
 * Run with: node src/features/challenge/seedChallengeTemplates.js
 * (requires GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin SDK)
 *
 * Seeds the /challengeTemplates collection with 12 rotating prompts.
 */

const TEMPLATES = [
  { weekOffset: 1,  prompt: "Show us your pet's silliest face!",               theme: "Silly Face Tuesday" },
  { weekOffset: 2,  prompt: "Capture your pet with their favourite toy.",       theme: "Toy Time Tuesday" },
  { weekOffset: 3,  prompt: "Best sleeping position — show us how they nap!",  theme: "Snooze Tuesday" },
  { weekOffset: 4,  prompt: "Tuesday Zoomies! Catch your pet mid-sprint.",      theme: "Zoomies Tuesday" },
  { weekOffset: 5,  prompt: "Outdoor adventure — where did your pet explore?", theme: "Adventure Tuesday" },
  { weekOffset: 6,  prompt: "Rainy day mood — how does your pet handle rain?",  theme: "Monsoon Mood Tuesday" },
  { weekOffset: 7,  prompt: "Snack time face — that look right before a treat.",theme: "Snack Attack Tuesday" },
  { weekOffset: 8,  prompt: "Pet + owner twinning — dress to match your pet!",  theme: "Twinning Tuesday" },
  { weekOffset: 9,  prompt: "Photobomb! Catch your pet sneaking into a photo.", theme: "Photobomb Tuesday" },
  { weekOffset: 10, prompt: "Show us your pet's best trick on camera.",          theme: "Talent Show Tuesday" },
  { weekOffset: 11, prompt: "Morning routine — how does your pet wake you up?", theme: "Wake-Up Tuesday" },
  { weekOffset: 12, prompt: "Festival ready! Dress your pet for the occasion.", theme: "Festive Tuesday" },
];

// Export for use in Cloud Function seed
module.exports = { TEMPLATES };
