/**
 * Seeds Firestore via REST API using the Firebase CLI access token.
 * No service account needed — just `firebase login` (already done).
 *
 *   node scripts/seed-rest.js
 */

const https = require("https");
const fs    = require("fs");

// ── Auth ──────────────────────────────────────────────────────────────────────
const cfg   = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/configstore/firebase-tools.json`, "utf8"));
const TOKEN = cfg.tokens.access_token;
const PROJECT = "sweekar-af756";
const DB_PATH = `projects/${PROJECT}/databases/(default)/documents`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function toFS(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean")        return { booleanValue: v };
  if (typeof v === "number")         return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string")         return { stringValue: v };
  if (v instanceof Date)             return { timestampValue: v.toISOString() };
  if (Array.isArray(v))              return { arrayValue: { values: v.map(toFS) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, val]) => [k, toFS(val)])) } };
}
function fields(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFS(v)]));
}

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "firestore.googleapis.com",
      path: `/v1/${DB_PATH}${path}`,
      method,
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type":  "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const r = https.request(opts, (res) => {
      let buf = "";
      res.on("data", (d) => (buf += d));
      res.on("end", () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${buf}`));
        resolve(buf ? JSON.parse(buf) : {});
      });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

// batchWrite — max 500 per call
async function batchWrite(writes) {
  for (let i = 0; i < writes.length; i += 499) {
    await req("POST", ":batchWrite", { writes: writes.slice(i, i + 499) });
  }
}

function docWrite(collection, id, obj) {
  return { update: { name: `${DB_PATH}/${collection}/${id}`, fields: fields(obj) } };
}

// ── Data ──────────────────────────────────────────────────────────────────────
const TEMPLATES = [
  { weekOffset: 1,  prompt: "Show us your pet's silliest face!",                theme: "Silly Face Tuesday"    },
  { weekOffset: 2,  prompt: "Capture your pet with their favourite toy.",        theme: "Toy Time Tuesday"      },
  { weekOffset: 3,  prompt: "Best sleeping position — show us how they nap!",   theme: "Snooze Tuesday"        },
  { weekOffset: 4,  prompt: "Tuesday Zoomies! Catch your pet mid-sprint.",       theme: "Zoomies Tuesday"       },
  { weekOffset: 5,  prompt: "Outdoor adventure — where did your pet explore?",  theme: "Adventure Tuesday"     },
  { weekOffset: 6,  prompt: "Rainy day mood — how does your pet handle rain?",   theme: "Monsoon Mood Tuesday"  },
  { weekOffset: 7,  prompt: "Snack time face — that look right before a treat.", theme: "Snack Attack Tuesday"  },
  { weekOffset: 8,  prompt: "Pet + owner twinning — dress to match your pet!",   theme: "Twinning Tuesday"      },
  { weekOffset: 9,  prompt: "Photobomb! Catch your pet sneaking into a photo.",  theme: "Photobomb Tuesday"     },
  { weekOffset: 10, prompt: "Show us your pet's best trick on camera.",           theme: "Talent Show Tuesday"   },
  { weekOffset: 11, prompt: "Morning routine — how does your pet wake you up?",  theme: "Wake-Up Tuesday"       },
  { weekOffset: 12, prompt: "Festival ready! Dress your pet for the occasion.",  theme: "Festive Tuesday"       },
];

const QUIZ_BANK = [
  { id:"W01", title:"Food Safety 🍖", topic:"Pet Nutrition", difficulty:"medium", questions:[
    { q:"Which common fruit is toxic to dogs and cats?", options:["Watermelon","Blueberry","Grapes","Mango"], correct:2, explanation:"Grapes and raisins can cause acute kidney failure in dogs and cats, even in small amounts." },
    { q:"Which of these is safe for dogs to eat?", options:["Onions","Chocolate","Carrots","Xylitol"], correct:2, explanation:"Carrots are a great low-calorie snack for dogs. They're good for dental health too!" },
    { q:"What makes chocolate dangerous for dogs?", options:["High sugar","Theobromine","Caffeine","Both B and C"], correct:3, explanation:"Chocolate contains both theobromine and caffeine — both are toxic to dogs. Dark chocolate is the most dangerous." },
    { q:"Can cats eat dog food regularly?", options:["Yes, it's fine","No, they need more taurine","Only wet food","Only dry food"], correct:1, explanation:"Cats require taurine which dog food doesn't provide enough of. Long-term use can cause heart disease in cats." },
    { q:"How often should an adult dog be fed each day?", options:["Once a day","Twice a day","Three times a day","Free-feed always"], correct:1, explanation:"Most vets recommend feeding adult dogs twice a day — morning and evening." },
  ]},
  { id:"W02", title:"Dog Breeds 🐕", topic:"Breeds", difficulty:"easy", questions:[
    { q:"Which dog breed is known as the 'Velcro dog'?", options:["Dalmatian","Vizsla","Greyhound","Chow Chow"], correct:1, explanation:"Vizslas bond extremely closely with their owners and don't like being left alone." },
    { q:"How many consecutive years was the Labrador the most popular US breed (as of 2022)?", options:["10","20","31","42"], correct:2, explanation:"Labs held the top spot for 31 consecutive years before being dethroned by the French Bulldog in 2022." },
    { q:"Which breed is the tallest dog in the world on average?", options:["Saint Bernard","Irish Wolfhound","Great Dane","Newfoundland"], correct:2, explanation:"Great Danes are considered the tallest dog breed." },
    { q:"Which Indian dog breed is known for hunting wild boar?", options:["Rajapalayam","Mudhol Hound","Kombai","Chippiparai"], correct:2, explanation:"The Kombai from Tamil Nadu was historically used to hunt wild boar and bison." },
    { q:"Which breed is known for its wrinkled skin and black tongue?", options:["Mastiff","Chow Chow","Shar Pei","Both B and C"], correct:3, explanation:"Both Chow Chows and Shar Peis have distinctive blue-black tongues." },
  ]},
  { id:"W03", title:"Cat Behaviour 😺", topic:"Behaviour", difficulty:"medium", questions:[
    { q:"Why do cats bring dead animals to their owners?", options:["Dominance","Gift/teaching prey","Hungry","Random"], correct:1, explanation:"Cats bring prey as a gift or to 'teach' hunting — an instinctive nurturing behaviour." },
    { q:"What does a slow blink from a cat mean?", options:["Sleepy","Trust & safety","Want food","Warning"], correct:1, explanation:"A slow blink is called a 'cat kiss' — a sign of trust, relaxation, and affection." },
    { q:"Why do cats knead with their paws?", options:["Marking territory","Comfort from kittenhood","Pain","Boredom"], correct:1, explanation:"Kneading is carried over from kittenhood to stimulate milk flow and signals contentment." },
    { q:"How many hours a day do cats typically sleep?", options:["8–10","10–12","12–16","18–20"], correct:2, explanation:"Cats sleep 12–16 hours a day on average." },
    { q:"What does a puffed-up tail mean in cats?", options:["Happiness","Fear or aggression","Hunger","Playfulness"], correct:1, explanation:"Piloerection is a defensive response — the cat is trying to look larger when frightened." },
  ]},
  { id:"W04", title:"Pet Health 💉", topic:"Health & Vet", difficulty:"hard", questions:[
    { q:"What is the most common preventable disease in pets?", options:["Rabies","Parvo","Obesity","Dental disease"], correct:2, explanation:"Obesity is the #1 preventable disease in pets — leads to diabetes, joint issues, and short lifespan." },
    { q:"At what age should puppies get their first rabies vaccine in India?", options:["4 weeks","8 weeks","12–16 weeks","6 months"], correct:2, explanation:"First rabies vaccine is typically at 12–16 weeks in India." },
    { q:"What is the normal resting heart rate for an adult dog?", options:["40–60 bpm","60–80 bpm","60–140 bpm","120–160 bpm"], correct:2, explanation:"Normal resting heart rate for dogs is 60–140 bpm depending on size." },
    { q:"Which parasite causes Heartworm disease in dogs?", options:["Roundworm","Tapeworm","Dirofilaria immitis","Giardia"], correct:2, explanation:"Dirofilaria immitis is transmitted through mosquito bites and lives in the heart and pulmonary arteries." },
    { q:"How often should a healthy adult dog visit the vet?", options:["Every month","Every 3 months","Once a year","Only when sick"], correct:2, explanation:"Healthy adult dogs need annual wellness exams. Senior dogs (7+) benefit from twice-yearly check-ups." },
  ]},
  { id:"W05", title:"Training Tips 🎓", topic:"Training", difficulty:"easy", questions:[
    { q:"What is the most effective training method for dogs?", options:["Punishment","Dominance","Positive reinforcement","Alpha rolling"], correct:2, explanation:"Positive reinforcement is scientifically the most effective and humane method." },
    { q:"How long should a training session be for a puppy?", options:["1–2 min","5–10 min","20–30 min","1 hour"], correct:1, explanation:"Sessions of 5–10 minutes, 2–3 times a day are more effective than long sessions." },
    { q:"What does 'luring' mean in dog training?", options:["Using fear","Using a treat to guide position","Electric collar","Hand signals only"], correct:1, explanation:"Luring uses food or a toy to guide the dog into position without physical force." },
    { q:"What is a 'jackpot' reward in dog training?", options:["A lottery ticket","Large unexpected reward for exceptional behaviour","Normal treats","Toys only"], correct:1, explanation:"A jackpot is a sudden extra-large reward that creates a strong positive association." },
    { q:"Which command should you teach a puppy first?", options:["Roll over","Stay","Sit","Shake"], correct:2, explanation:"'Sit' is the foundation command — easy, practical, and builds the communication framework." },
  ]},
  { id:"W06", title:"India's Stray Crisis 🐾", topic:"India & Pawppy", difficulty:"medium", questions:[
    { q:"Approximately how many stray dogs are in India?", options:["5 million","15 million","35 million","60 million"], correct:3, explanation:"India has ~60 million stray dogs — the highest in the world." },
    { q:"What does 'ABC' stand for in India's stray dog policy?", options:["Animal Birth Control","Animal Breed Classification","Animal Bite Clinics","Animal Behaviour Council"], correct:0, explanation:"ABC (Animal Birth Control) uses sterilisation rather than culling to manage stray populations." },
    { q:"Which ministry manages the Animal Welfare Board of India?", options:["Environment","Agriculture","Fisheries, Animal Husbandry & Dairying","NGO Sector"], correct:2, explanation:"AWBI functions under Ministry of Fisheries, Animal Husbandry, and Dairying." },
    { q:"What does a yellow tag on a stray dog's ear mean in India?", options:["Rabies-infected","Sterilised and vaccinated","Aggressive","Under observation"], correct:1, explanation:"Yellow ear tag = sterilised and vaccinated under the ABC programme." },
    { q:"Which Indian city was early to adopt pet-friendly public policy?", options:["Mumbai","Bengaluru","Chennai","Pune"], correct:1, explanation:"Bengaluru was among the early adopters with designated dog parks and pet-inclusive housing guidelines." },
  ]},
  { id:"W07", title:"Fun Pet Trivia 🎉", topic:"Fun Facts", difficulty:"easy", questions:[
    { q:"What is a group of cats called?", options:["A pack","A clowder","A herd","A pride"], correct:1, explanation:"A group of cats is called a 'clowder'. A group of kittens is a 'kindle'." },
    { q:"How many muscles does a dog have to move each ear?", options:["3","6","18","32"], correct:2, explanation:"Dogs have 18 muscles per ear, allowing independent rotation to locate sounds." },
    { q:"Which Indian President is famous for love of animals?", options:["APJ Abdul Kalam","Rajendra Prasad","Indira Gandhi","None"], correct:0, explanation:"APJ Abdul Kalam was famously devoted to animals and often spoke on kindness towards them." },
    { q:"What is the average lifespan of a domestic cat?", options:["5–8 years","9–12 years","12–18 years","20+ years"], correct:2, explanation:"Domestic cats typically live 12–18 years. Indoor cats live longer." },
    { q:"A dog's nose print is unique like a fingerprint. True or False?", options:["True","False","Purebreds only","Certain breeds"], correct:0, explanation:"True! A dog's nose leather has a unique pattern that can be used for identification." },
  ]},
  { id:"W08", title:"Monsoon Pet Care 🌧️", topic:"Seasonal Care", difficulty:"medium", questions:[
    { q:"Biggest health risk for dogs during monsoon in India?", options:["Sunstroke","Leptospirosis","Dehydration","Obesity"], correct:1, explanation:"Leptospirosis spreads through water contaminated with infected urine. Common in monsoon flooding." },
    { q:"How often should you check a dog's ears during monsoon?", options:["Once a month","Once a week","Every 2–3 days","Only if smelly"], correct:2, explanation:"High humidity creates the perfect environment for ear infections. Check every 2–3 days." },
    { q:"What to do immediately after a dog gets wet in rain?", options:["Leave to dry","Dry ears and paws first","Full bath","Restrict movement"], correct:1, explanation:"Ears and paws are most vulnerable. Dry them first to prevent infections." },
    { q:"Which tick-borne disease peaks after monsoon?", options:["Rabies","Distemper","Ehrlichiosis / Tick Fever","Parvovirus"], correct:2, explanation:"Tick activity peaks after monsoon. Use monthly tick preventives." },
    { q:"Why do pets get anxious during thunderstorms?", options:["Pressure drop","High-frequency sounds","Static electricity in fur","All of the above"], correct:3, explanation:"Pets sense pressure changes, hear inaudible frequencies, and can get static shocks — all cause anxiety." },
  ]},
];

// ── Compute current week ID ───────────────────────────────────────────────────
function getWeekId(date = new Date()) {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    // 1. Challenge templates
    process.stdout.write("Seeding challengeTemplates...");
    await batchWrite(TEMPLATES.map((t) => docWrite("challengeTemplates", String(t.weekOffset), t)));
    console.log(` ✅ ${TEMPLATES.length} templates`);

    // 2. Quiz bank  
    process.stdout.write("Seeding quizBank...");
    await batchWrite(QUIZ_BANK.map((w) => docWrite("quizBank", w.id, w)));
    console.log(` ✅ ${QUIZ_BANK.length} weeks`);

    // 3. First active quiz (this week)
    const weekId = getWeekId();
    const now = new Date();
    const endTime = new Date(now); endTime.setDate(endTime.getDate() + 7);
    process.stdout.write(`Activating quiz "${weekId}"...`);
    await batchWrite([docWrite("weeklyQuiz", weekId, {
      ...QUIZ_BANK[0],
      isActive: true,
      weekId,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
    })]);
    console.log(" ✅");

    // 4. First active challenge
    const challengeId = `challenge-${weekId}`;
    const t = TEMPLATES[0];
    process.stdout.write(`Activating challenge "${t.theme}"...`);
    await batchWrite([docWrite("challenges", challengeId, {
      prompt: t.prompt,
      theme: t.theme,
      isActive: true,
      templateWeekOffset: t.weekOffset,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      entryCount: 0,
      winnerId: null,
    })]);
    console.log(" ✅");

    console.log("\n🎉 Firestore seeded! Quiz and Challenge are live.");
  } catch (err) {
    console.error("\n❌", err.message);
    process.exit(1);
  }
})();
