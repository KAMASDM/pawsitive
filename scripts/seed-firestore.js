/**
 * One-time seed script — run with:
 *   node scripts/seed-firestore.js
 *
 * Requires application-default credentials:
 *   firebase login (already done if you can deploy)
 *   GOOGLE_APPLICATION_CREDENTIALS or gcloud ADC
 *
 * Seeds:
 *  /challengeTemplates/{1..12}
 *  /quizBank/{W01..W08}
 */

const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore, WriteBatch } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

// ── Init ──────────────────────────────────────────────────────────────────────
// Try service account file first, fall back to ADC
let app;
const saPath = path.join(__dirname, "../service-account.json");
if (fs.existsSync(saPath)) {
  app = initializeApp({ credential: cert(require(saPath)) });
} else {
  app = initializeApp({ credential: applicationDefault() });
}

const db = getFirestore(app);

// ── Challenge Templates ───────────────────────────────────────────────────────
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

// ── Quiz Bank ─────────────────────────────────────────────────────────────────
const QUIZ_BANK = [
  {
    id: "W01",
    title: "Food Safety 🍖",
    topic: "Pet Nutrition",
    difficulty: "medium",
    questions: [
      { q: "Which common fruit is toxic to dogs and cats?", options: ["Watermelon","Blueberry","Grapes","Mango"], correct: 2, explanation: "Grapes and raisins can cause acute kidney failure in dogs and cats, even in small amounts." },
      { q: "Which of these is safe for dogs to eat?", options: ["Onions","Chocolate","Carrots","Xylitol"], correct: 2, explanation: "Carrots are a great low-calorie snack for dogs. They're good for dental health too!" },
      { q: "What makes chocolate dangerous for dogs?", options: ["High sugar","Theobromine","Caffeine","Both B and C"], correct: 3, explanation: "Chocolate contains both theobromine and caffeine — both are toxic to dogs. Dark chocolate is the most dangerous." },
      { q: "Can cats eat dog food regularly?", options: ["Yes, it's fine","No, they need more taurine","Only wet food","Only dry food"], correct: 1, explanation: "Cats require taurine (an amino acid) in their diet which dog food doesn't provide enough of. Long-term use can cause heart disease in cats." },
      { q: "How often should an adult dog be fed each day?", options: ["Once a day","Twice a day","Three times a day","Free-feed always"], correct: 1, explanation: "Most vets recommend feeding adult dogs twice a day — morning and evening — to maintain stable blood sugar and digestion." },
    ],
  },
  {
    id: "W02",
    title: "Dog Breeds 🐕",
    topic: "Breeds",
    difficulty: "easy",
    questions: [
      { q: "Which dog breed is known as the 'Velcro dog' for following owners everywhere?", options: ["Dalmatian","Vizsla","Greyhound","Chow Chow"], correct: 1, explanation: "Vizslas are called 'Velcro dogs' because they bond extremely closely with their owners and don't like being left alone." },
      { q: "The Labrador Retriever has been the most popular dog breed in the US for how many consecutive years (as of 2022)?", options: ["10 years","20 years","31 years","42 years"], correct: 2, explanation: "Labs held the top spot for 31 consecutive years before being dethroned by the French Bulldog in 2022." },
      { q: "Which breed is the tallest dog in the world on average?", options: ["Saint Bernard","Irish Wolfhound","Great Dane","Newfoundland"], correct: 2, explanation: "Great Danes are considered the tallest dog breed. Zeus, a Great Dane, holds the record as the world's tallest dog." },
      { q: "Which Indian dog breed is known for hunting wild boar?", options: ["Rajapalayam","Mudhol Hound","Kombai","Chippiparai"], correct: 2, explanation: "The Kombai (or Combai) from Tamil Nadu was historically used to hunt wild boar and bison. It's a fearless, powerful breed." },
      { q: "Which breed is known for its wrinkled skin and black tongue?", options: ["Mastiff","Chow Chow","Shar Pei","Both B and C"], correct: 3, explanation: "Both Chow Chows and Shar Peis have distinctive blue-black tongues. The Shar Pei is also famous for its excessive wrinkles." },
    ],
  },
  {
    id: "W03",
    title: "Cat Behaviour 😺",
    topic: "Behaviour",
    difficulty: "medium",
    questions: [
      { q: "Why do cats bring dead animals to their owners?", options: ["To show dominance","As a gift/teaching prey","They are hungry","Random behaviour"], correct: 1, explanation: "Cats bring prey to their owners as a gift or to 'teach' them to hunt — it's an instinctive nurturing behaviour from their wild ancestors." },
      { q: "What does it mean when a cat slowly blinks at you?", options: ["They're sleepy","They feel safe and trust you","They want food","They're warning you"], correct: 1, explanation: "A slow blink from a cat is often called a 'cat kiss' — it's a sign of trust, relaxation, and affection." },
      { q: "Why do cats knead with their paws?", options: ["Marking territory","Comfort from kittenhood","Pain behaviour","Boredom"], correct: 1, explanation: "Kneading is a behaviour carried over from kittenhood when kittens knead their mother's belly to stimulate milk flow. It signals contentment." },
      { q: "How many hours a day do cats typically sleep?", options: ["8–10 hours","10–12 hours","12–16 hours","18–20 hours"], correct: 2, explanation: "Cats sleep 12–16 hours a day on average. Their predatory nature means short bursts of intense activity followed by long rest periods." },
      { q: "What does a puffed-up tail mean in cats?", options: ["Happiness","Fear or aggression","Hunger","Playfulness"], correct: 1, explanation: "A puffed-up tail (piloerection) is a defensive response — the cat is trying to look larger when frightened or feeling threatened." },
    ],
  },
  {
    id: "W04",
    title: "Pet Health 💉",
    topic: "Health & Vet",
    difficulty: "hard",
    questions: [
      { q: "What is the most common preventable disease in pets according to vets?", options: ["Rabies","Parvo","Obesity","Dental disease"], correct: 2, explanation: "Obesity is the #1 preventable disease in pets. It leads to diabetes, joint disease, heart problems, and a shorter lifespan." },
      { q: "At what age should puppies receive their first rabies vaccine in India?", options: ["4 weeks","8 weeks","12–16 weeks","6 months"], correct: 2, explanation: "The first rabies vaccine is typically given at 12–16 weeks of age in India, followed by a booster at 1 year and then every 1–3 years." },
      { q: "What is the normal resting heart rate for an adult dog?", options: ["40–60 bpm","60–80 bpm","60–140 bpm","120–160 bpm"], correct: 2, explanation: "Normal resting heart rate for dogs is 60–140 bpm depending on size. Smaller dogs tend to have faster heart rates than larger breeds." },
      { q: "Which parasite causes 'Heartworm disease' in dogs?", options: ["Roundworm","Tapeworm","Dirofilaria immitis","Giardia"], correct: 2, explanation: "Dirofilaria immitis is the parasite that causes heartworm disease, transmitted through mosquito bites. It lives in the heart and pulmonary arteries." },
      { q: "How often should a healthy adult dog visit the vet for a check-up?", options: ["Every month","Every 3 months","Once a year","Only when sick"], correct: 2, explanation: "Healthy adult dogs should have an annual wellness exam. Senior dogs (7+) benefit from twice-yearly check-ups." },
    ],
  },
  {
    id: "W05",
    title: "Training Tips 🎓",
    topic: "Training",
    difficulty: "easy",
    questions: [
      { q: "What is the most effective training method for dogs according to animal behaviourists?", options: ["Punishment-based","Dominance theory","Positive reinforcement","Alpha rolling"], correct: 2, explanation: "Positive reinforcement — rewarding desired behaviour — is scientifically the most effective and humane training method for dogs." },
      { q: "How long should a training session be for a puppy?", options: ["1–2 minutes","5–10 minutes","20–30 minutes","1 hour"], correct: 1, explanation: "Puppies have short attention spans. Sessions of 5–10 minutes, 2–3 times a day are more effective than long sessions." },
      { q: "What does 'luring' mean in dog training?", options: ["Using fear to motivate","Using a treat to guide into position","Electric collar training","Hand signals only"], correct: 1, explanation: "Luring involves using food or a toy to guide the dog into the desired position without physically pushing them. It's a gentle, effective method." },
      { q: "What is a 'jackpot' reward in dog training?", options: ["A lottery ticket","A large, unexpected reward for exceptional behaviour","Normal treats","Using toys only"], correct: 1, explanation: "A jackpot is a sudden, extra-large reward given to mark an exceptional performance. It creates a strong positive association with the behaviour." },
      { q: "Which command should you teach a puppy first?", options: ["Roll over","Stay","Sit","Shake"], correct: 2, explanation: "'Sit' is the foundation command — it's easy, practical, and builds the communication framework for all future training." },
    ],
  },
  {
    id: "W06",
    title: "India's Stray Crisis 🐾",
    topic: "India & Pawppy",
    difficulty: "medium",
    questions: [
      { q: "Approximately how many stray dogs are there in India?", options: ["5 million","15 million","35 million","60 million"], correct: 3, explanation: "India has approximately 60 million stray dogs — the highest in the world. This contributes to India having the most human deaths from rabies globally." },
      { q: "What does 'ABC' stand for in India's stray dog management policy?", options: ["Animal Birth Control","Animal Breed Classification","Animal Bite Clinics","Animal Behaviour Council"], correct: 0, explanation: "ABC (Animal Birth Control) is the approved method in India for managing stray dog populations through sterilisation rather than culling." },
      { q: "Which organisation manages the Animal Welfare Board of India (AWBI)?", options: ["Ministry of Environment","Ministry of Agriculture","Ministry of Fisheries, Animal Husbandry & Dairying","NGO Sector"], correct: 2, explanation: "The AWBI functions under the Ministry of Fisheries, Animal Husbandry, and Dairying. It was established under the Prevention of Cruelty to Animals Act, 1960." },
      { q: "What does a yellow tag on a stray dog's ear typically indicate in India?", options: ["Rabies-infected","Sterilised and vaccinated","Aggressive dog","Under observation"], correct: 1, explanation: "A yellow ear tag indicates the dog has been sterilised and vaccinated as part of the ABC programme. These dogs are safe to be released back to their territory." },
      { q: "Which Indian city was the first to have an official 'Pet-Friendly' public policy?", options: ["Mumbai","Bengaluru","Chennai","Pune"], correct: 1, explanation: "Bengaluru (Bangalore) was among the early adopters of pet-friendly urban policies, including designated dog parks and pet-inclusive housing guidelines." },
    ],
  },
  {
    id: "W07",
    title: "Fun Pet Trivia 🎉",
    topic: "Fun Facts",
    difficulty: "easy",
    questions: [
      { q: "What is a group of cats called?", options: ["A pack","A clowder","A herd","A pride"], correct: 1, explanation: "A group of cats is called a 'clowder'. A group of kittens is called a 'kindle'. Fascinating, right?" },
      { q: "Dogs have approximately how many muscles to move each ear?", options: ["3","6","18","32"], correct: 2, explanation: "Dogs have 18 muscles dedicated to ear movement, which is why they can tilt, rotate, and move their ears independently to locate sounds." },
      { q: "Which President of India is famous for their love of pets?", options: ["APJ Abdul Kalam (loved stray dogs)","Rajendra Prasad (cows)","Indira Gandhi (tigers)","Narendra Modi (Labradors)"], correct: 0, explanation: "APJ Abdul Kalam was famously devoted to animals and often spoke about the importance of kindness towards animals." },
      { q: "What is the average lifespan of a domestic cat?", options: ["5–8 years","9–12 years","12–18 years","20+ years"], correct: 2, explanation: "Domestic cats typically live 12–18 years. Indoor cats tend to live longer than outdoor cats due to fewer hazards." },
      { q: "A dog's nose print is unique — similar to human fingerprints. True or False?", options: ["True","False","Only for purebred dogs","Only for certain breeds"], correct: 0, explanation: "True! A dog's nose leather has a unique pattern of ridges and creases that can be used for identification — like a fingerprint." },
    ],
  },
  {
    id: "W08",
    title: "Monsoon Pet Care 🌧️",
    topic: "Seasonal Care",
    difficulty: "medium",
    questions: [
      { q: "What is the biggest health risk for dogs during the monsoon in India?", options: ["Sunstroke","Leptospirosis","Dehydration","Obesity"], correct: 1, explanation: "Leptospirosis is a bacterial infection spread through water contaminated with infected animal urine. Stagnant monsoon water is a major source. Annual vaccination is recommended." },
      { q: "How often should you check a dog's ears during monsoon season?", options: ["Once a month","Once a week","Every 2–3 days","Only if smelling bad"], correct: 2, explanation: "The humidity during monsoon creates the perfect environment for bacterial and yeast ear infections. Check and clean ears every 2–3 days to prevent otitis." },
      { q: "What should you do immediately after a dog gets wet in the rain?", options: ["Leave them to dry","Dry ears and paws first","Give a full bath","Restrict movement"], correct: 1, explanation: "Ears and paws are the most vulnerable in rain. Dry them first to prevent infections. A full bath isn't always necessary unless they're visibly dirty." },
      { q: "Which disease transmitted by ticks peaks during and after monsoon?", options: ["Rabies","Distemper","Ehrlichiosis / Tick Fever","Parvovirus"], correct: 2, explanation: "Tick activity peaks after monsoon when vegetation is dense. Ehrlichiosis, Babesiosis, and other tick-borne diseases are common. Use monthly tick preventives." },
      { q: "Why do some pets become anxious during thunderstorms?", options: ["They feel the pressure drop","They hear high-frequency sounds","Static electricity in fur","All of the above"], correct: 3, explanation: "Pets are sensitive to barometric pressure changes, hear frequencies humans can't, and some dogs experience static shocks through their fur during storms — all contribute to anxiety." },
    ],
  },
];

// ── Seed functions ────────────────────────────────────────────────────────────
async function seedChallengeTemplates() {
  const batch = db.batch();
  TEMPLATES.forEach((t) => {
    const ref = db.collection("challengeTemplates").doc(String(t.weekOffset));
    batch.set(ref, t);
  });
  await batch.commit();
  console.log(`✅ Seeded ${TEMPLATES.length} challenge templates into /challengeTemplates`);
}

async function seedQuizBank() {
  const batch = db.batch();
  QUIZ_BANK.forEach((week) => {
    const ref = db.collection("quizBank").doc(week.id);
    batch.set(ref, week);
  });
  await batch.commit();
  console.log(`✅ Seeded ${QUIZ_BANK.length} quiz weeks into /quizBank`);
}

// ── Also create the first active quiz so users can play right away ────────────
async function activateFirstQuiz() {
  // Use W01 as the first quiz
  const now = new Date();
  // weekId: YYYY-W<N>
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

  const endTime = new Date(now);
  endTime.setDate(endTime.getDate() + 7);

  const weekData = QUIZ_BANK[0];
  await db.collection("weeklyQuiz").doc(weekId).set({
    ...weekData,
    isActive: true,
    weekId,
    startTime: now,
    endTime,
    createdAt: now,
  });
  console.log(`✅ Activated first quiz as "${weekId}" (active until ${endTime.toDateString()})`);
}

// ── Also create the first active challenge ────────────────────────────────────
async function activateFirstChallenge() {
  const now = new Date();
  const endTime = new Date(now);
  endTime.setDate(endTime.getDate() + 7);

  // Use template weekOffset 1
  const t = TEMPLATES[0];
  const ref = db.collection("challenges").doc();
  await ref.set({
    prompt: t.prompt,
    theme: t.theme,
    isActive: true,
    templateWeekOffset: t.weekOffset,
    startTime: now,
    endTime,
    entryCount: 0,
    winnerId: null,
    createdAt: now,
  });
  console.log(`✅ Activated first challenge: "${t.theme}" (active until ${endTime.toDateString()})`);
}

// ── Run all ───────────────────────────────────────────────────────────────────
(async () => {
  try {
    await seedChallengeTemplates();
    await seedQuizBank();
    await activateFirstQuiz();
    await activateFirstChallenge();
    console.log("\n🎉 All seed data uploaded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
})();
