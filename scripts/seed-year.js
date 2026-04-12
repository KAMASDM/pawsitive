/**
 * Full-year seed script — 52 challenges + 52 quizzes
 * Run: node scripts/seed-year.js
 * Uses gcloud ADC (already logged in via `gcloud auth application-default login`)
 */

const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const saPath = path.join(__dirname, "../service-account.json");
const app = fs.existsSync(saPath)
  ? initializeApp({ credential: cert(require(saPath)), projectId: "sweekar-af756" })
  : initializeApp({ credential: applicationDefault(), projectId: "sweekar-af756" });

const db = getFirestore(app);

// ── 52 Challenge themes (rotating Tuesday prompts) ────────────────────────────
const CHALLENGES = [
  { theme: "Silly Face Tuesday",      prompt: "Show us your pet's silliest face!" },
  { theme: "Toy Time Tuesday",        prompt: "Capture your pet with their favourite toy." },
  { theme: "Snooze Tuesday",          prompt: "Best sleeping position — show us how they nap!" },
  { theme: "Zoomies Tuesday",         prompt: "Tuesday Zoomies! Catch your pet mid-sprint." },
  { theme: "Adventure Tuesday",       prompt: "Outdoor adventure — where did your pet explore?" },
  { theme: "Monsoon Mood Tuesday",    prompt: "Rainy day mood — how does your pet handle rain?" },
  { theme: "Snack Attack Tuesday",    prompt: "Snack time face — that look right before a treat." },
  { theme: "Twinning Tuesday",        prompt: "Pet + owner twinning — dress to match your pet!" },
  { theme: "Photobomb Tuesday",       prompt: "Photobomb! Catch your pet sneaking into a photo." },
  { theme: "Talent Show Tuesday",     prompt: "Show us your pet's best trick on camera." },
  { theme: "Wake-Up Tuesday",         prompt: "Morning routine — how does your pet wake you up?" },
  { theme: "Festive Tuesday",         prompt: "Festival ready! Dress your pet for the occasion." },
  { theme: "Beach Day Tuesday",       prompt: "Paws in the sand — show us your pet at the beach." },
  { theme: "Couch Potato Tuesday",    prompt: "Ultimate couch potato pose — who relaxes better?" },
  { theme: "Shadow Play Tuesday",     prompt: "Cool shadow or silhouette of your pet." },
  { theme: "Best Friends Tuesday",    prompt: "Your pet with their best friend — human or animal." },
  { theme: "Hat Day Tuesday",         prompt: "Put a hat (or anything) on your pet's head!" },
  { theme: "Garden Tuesday",          prompt: "Your pet exploring or napping in a garden." },
  { theme: "Eyes Tuesday",            prompt: "Extreme close-up of your pet's beautiful eyes." },
  { theme: "Staircase Tuesday",       prompt: "Your pet on stairs — going up, coming down, or stuck!" },
  { theme: "Mirror Tuesday",          prompt: "Your pet reacting to their reflection in a mirror." },
  { theme: "Blanket Fort Tuesday",    prompt: "Your pet buried under or building a blanket fortress." },
  { theme: "Bath Time Tuesday",       prompt: "Bath time reaction — thrilled or horrified?" },
  { theme: "Window Watcher Tuesday",  prompt: "Your pet's favourite window — what are they watching?" },
  { theme: "Jump Tuesday",            prompt: "Catch your pet mid-jump or mid-leap!" },
  { theme: "Sunset Paws Tuesday",     prompt: "Your pet framed against a sunset or golden hour." },
  { theme: "Flower Power Tuesday",    prompt: "Your pet among flowers or a colourful garden." },
  { theme: "Night Owl Tuesday",       prompt: "Your pet up late — best night-time photo wins." },
  { theme: "Car Ride Tuesday",        prompt: "Window-down, tongue-out car ride faces!" },
  { theme: "Yoga Pose Tuesday",       prompt: "Your pet doing their best yoga pose (or failing!)." },
  { theme: "Backpack Tuesday",        prompt: "Your small pet peeking out of a bag or backpack." },
  { theme: "Rainy Day Cuddles",       prompt: "Rainy day vibes — your pet keeping warm and cosy." },
  { theme: "First Snow Tuesday",      prompt: "First reaction to cold weather or something chilly." },
  { theme: "Grocery Bag Tuesday",     prompt: "Your pet investigating a grocery bag or box." },
  { theme: "Bookworm Tuesday",        prompt: "Your pet 'reading' a book or sitting on your laptop." },
  { theme: "Matching Outfits Tuesday",prompt: "You and your pet in matching colours or patterns." },
  { theme: "Tiny Paws Tuesday",       prompt: "Extreme close-up of your pet's paws." },
  { theme: "Big Yawn Tuesday",        prompt: "Catch that jaw-dropping, eye-watering yawn!" },
  { theme: "New Toy Tuesday",         prompt: "Your pet unboxing or playing with a brand-new toy." },
  { theme: "Balcony Life Tuesday",    prompt: "Your pet chilling on the balcony or rooftop." },
  { theme: "Puddle Jump Tuesday",     prompt: "Splash! Your pet jumping in or over a puddle." },
  { theme: "Hammock Tuesday",         prompt: "Your pet in or stealing a hammock." },
  { theme: "Superhero Tuesday",       prompt: "Cape on, powers on — dress your pet as a superhero!" },
  { theme: "Diwali Glow Tuesday",     prompt: "Your pet in festive lights or diyas." },
  { theme: "Holi Tuesday",            prompt: "Your pet in safe Holi colours (or refusing to be coloured!)." },
  { theme: "Independence Day Tuesday",prompt: "Your pet decked in the tricolour for Independence Day." },
  { theme: "Pongal Tuesday",          prompt: "Your pet joining in the Pongal celebrations." },
  { theme: "World Animal Day Tuesday",prompt: "Celebrate your pet on World Animal Day!" },
  { theme: "Earth Day Tuesday",       prompt: "Your eco-friendly pet — recycling, gardening, or outdoors." },
  { theme: "Birthday Tuesday",        prompt: "Happy birthday to any pet born this week! Show the cake." },
  { theme: "Rescue Story Tuesday",    prompt: "Share your pet's rescue or adoption story in a photo." },
  { theme: "End-of-Year Tuesday",     prompt: "Best pet photo of the year — your favourite shot!" },
];

// ── 52 Quizzes ────────────────────────────────────────────────────────────────
const QUIZZES = [
  {
    id: "W01", title: "Food Safety 🍖", topic: "Pet Nutrition", difficulty: "medium",
    questions: [
      { q: "Which common fruit is toxic to dogs and cats?", options: ["Watermelon","Blueberry","Grapes","Mango"], correct: 2, explanation: "Grapes and raisins can cause acute kidney failure in dogs and cats, even in small amounts." },
      { q: "Which of these is safe for dogs to eat?", options: ["Onions","Chocolate","Carrots","Xylitol"], correct: 2, explanation: "Carrots are a great low-calorie snack for dogs." },
      { q: "What makes chocolate dangerous for dogs?", options: ["High sugar","Theobromine","Caffeine","Both B and C"], correct: 3, explanation: "Chocolate contains both theobromine and caffeine — both toxic to dogs." },
      { q: "Can cats eat dog food regularly?", options: ["Yes, it's fine","No, they need more taurine","Only wet food","Only dry food"], correct: 1, explanation: "Cats require taurine which dog food lacks." },
      { q: "How often should an adult dog be fed?", options: ["Once a day","Twice a day","Three times a day","Free-feed always"], correct: 1, explanation: "Most vets recommend feeding adult dogs twice a day." },
    ],
  },
  {
    id: "W02", title: "Dog Breeds 🐕", topic: "Breeds", difficulty: "easy",
    questions: [
      { q: "Which breed is called the 'Velcro dog'?", options: ["Dalmatian","Vizsla","Greyhound","Chow Chow"], correct: 1, explanation: "Vizslas bond extremely closely with their owners." },
      { q: "Which is the tallest dog breed on average?", options: ["Saint Bernard","Irish Wolfhound","Great Dane","Newfoundland"], correct: 2, explanation: "Great Danes are the tallest dog breed." },
      { q: "Which Indian breed hunts wild boar?", options: ["Rajapalayam","Mudhol Hound","Kombai","Chippiparai"], correct: 2, explanation: "The Kombai from Tamil Nadu was used to hunt wild boar." },
      { q: "Which breed has a blue-black tongue?", options: ["Mastiff","Chow Chow","Shar Pei","Both B and C"], correct: 3, explanation: "Both Chow Chows and Shar Peis have blue-black tongues." },
      { q: "Which breed was used by ancient Egyptians for hunting?", options: ["Greyhound","Poodle","Beagle","Basenji"], correct: 0, explanation: "Greyhounds are one of the oldest breeds, depicted in ancient Egyptian art." },
    ],
  },
  {
    id: "W03", title: "Cat Behaviour 😺", topic: "Behaviour", difficulty: "medium",
    questions: [
      { q: "Why do cats knead with their paws?", options: ["Mark territory","Comfort behaviour from kittenhood","Stretch muscles","Sharpen claws"], correct: 1, explanation: "Kneading is a comforting behaviour cats carry from nursing as kittens." },
      { q: "What does a slow blink from a cat mean?", options: ["They're sleepy","They're angry","They trust you","They're hungry"], correct: 2, explanation: "A slow blink is a cat's way of showing trust and affection." },
      { q: "Why do cats bring dead prey home?", options: ["To eat later","To teach you to hunt","To show off","They're lost"], correct: 1, explanation: "Cats see their owners as poor hunters and bring prey as 'lessons'." },
      { q: "How many hours a day do cats typically sleep?", options: ["6-8","10-12","12-16","18-20"], correct: 2, explanation: "Cats sleep 12–16 hours a day, conserving energy as natural predators." },
      { q: "What does it mean when a cat's tail is straight up?", options: ["Fear","Aggression","Happiness/greeting","Pain"], correct: 2, explanation: "A tail held straight up is a confident, happy greeting signal." },
    ],
  },
  {
    id: "W04", title: "Pet Health Basics 🏥", topic: "Health", difficulty: "medium",
    questions: [
      { q: "How often should you deworm an adult dog?", options: ["Monthly","Every 3–6 months","Once a year","Never if indoors"], correct: 1, explanation: "Adult dogs should be dewormed every 3–6 months depending on lifestyle." },
      { q: "What is the normal body temperature range for dogs?", options: ["36–37°C","37.5–39.2°C","39.5–41°C","34–36°C"], correct: 1, explanation: "Normal canine body temperature is 37.5–39.2°C (99.5–102.5°F)." },
      { q: "Which vaccination is legally required for dogs in India?", options: ["Parvovirus","Rabies","Distemper","Leptospirosis"], correct: 1, explanation: "Rabies vaccination is legally mandated for dogs in India under the Prevention of Cruelty to Animals Act." },
      { q: "What is the minimum age for a puppy's first vaccination?", options: ["2 weeks","4 weeks","6 weeks","8 weeks"], correct: 3, explanation: "Puppies should ideally start their vaccination schedule at 6–8 weeks of age." },
      { q: "Which organ does Parvovirus primarily attack in dogs?", options: ["Liver","Kidneys","Gastrointestinal tract","Lungs"], correct: 2, explanation: "Canine Parvovirus primarily attacks the gastrointestinal tract causing severe vomiting and bloody diarrhea." },
    ],
  },
  {
    id: "W05", title: "Indian Pet Laws 📜", topic: "Legal & Welfare", difficulty: "hard",
    questions: [
      { q: "Which Indian law primarily governs animal cruelty?", options: ["Wildlife Protection Act","Prevention of Cruelty to Animals Act 1960","Environment Protection Act","Indian Penal Code"], correct: 1, explanation: "The PCA Act 1960 is the primary legislation for prevention of cruelty to animals in India." },
      { q: "Who can legally adopt a stray dog in India?", options: ["Only NGOs","Only government bodies","Any Indian citizen","Foreigners only"], correct: 2, explanation: "Any Indian citizen can adopt/foster a stray dog under the ABC Rules 2023." },
      { q: "Which body registers pet breeders in India?", options: ["PETA India","SPCA","Animal Welfare Board of India","Kennel Club of India"], correct: 2, explanation: "AWBI under the Ministry of Fisheries oversees animal welfare including breeder registration." },
      { q: "Is feeding community animals in housing societies legal in India?", options: ["No, it's always banned","Yes, it's a right under ABC Rules","Only with society permission","Only for dogs"], correct: 1, explanation: "The ABC Rules and Supreme Court rulings affirm the right to feed community animals." },
      { q: "What is the maximum jail term under PCA Act for cruelty to animals?", options: ["3 months","6 months","1 year","5 years"], correct: 0, explanation: "The PCA Act 1960 prescribes a maximum jail term of just 3 months, which many consider inadequate." },
    ],
  },
  {
    id: "W06", title: "Exotic Pets 🦜", topic: "Exotic Animals", difficulty: "medium",
    questions: [
      { q: "Which bird is illegal to keep as a pet in India?", options: ["Budgerigar","Cockatiel","Rose-ringed Parakeet","Lovebird"], correct: 2, explanation: "The Rose-ringed Parakeet is protected under the Wildlife Protection Act 1972 and cannot be kept as a pet." },
      { q: "What do tortoises need in captivity that's often overlooked?", options: ["Running water","UVB lighting","Protein-rich diet","Cold temperature"], correct: 1, explanation: "UVB lighting is essential for tortoises to metabolize calcium and prevent metabolic bone disease." },
      { q: "Which fish is known to jump out of aquariums?", options: ["Goldfish","Betta fish","Arowana","Guppy"], correct: 2, explanation: "Arowanas are notorious jumpers and require tightly covered aquariums." },
      { q: "What is the primary diet of a healthy adult rabbit?", options: ["Pellets","Fresh vegetables","Hay","Fruits"], correct: 2, explanation: "Hay should make up 80% of a rabbit's diet for healthy gut motility and teeth wear." },
      { q: "Which reptile is commonly mislabeled as 'low maintenance'?", options: ["Leopard gecko","Chameleon","Corn snake","Blue-tongue skink"], correct: 1, explanation: "Chameleons have very specific humidity, lighting, and temperature requirements — far from low-maintenance." },
    ],
  },
  {
    id: "W07", title: "Dog Training 🎯", topic: "Training", difficulty: "easy",
    questions: [
      { q: "What is positive reinforcement in dog training?", options: ["Punishing bad behaviour","Rewarding desired behaviour","Ignoring the dog","Using a choke chain"], correct: 1, explanation: "Positive reinforcement means rewarding the behaviour you want to encourage." },
      { q: "What is the 'sit' command best taught using?", options: ["Force","Luring with a treat","Loud commands","Repetition only"], correct: 1, explanation: "Luring with a treat over the dog's head causes them to naturally sit." },
      { q: "How long should a puppy training session be?", options: ["1 hour","30 minutes","5–10 minutes","2 hours"], correct: 2, explanation: "Puppies have short attention spans; 5–10 minute sessions are most effective." },
      { q: "What does 'clicker training' use to mark correct behaviour?", options: ["A whistle","A click sound","A hand signal","A treat bag"], correct: 1, explanation: "A clicker produces a precise click sound to mark the exact moment of correct behaviour." },
      { q: "Which word is recommended when teaching a dog NOT to do something?", options: ["No!","Bad dog!","Leave it","Stop"], correct: 2, explanation: "'Leave it' is a specific, trainable command. 'No' is too vague and easy to ignore." },
    ],
  },
  {
    id: "W08", title: "Pet First Aid 🆘", topic: "First Aid", difficulty: "hard",
    questions: [
      { q: "What should you do first if your dog is hit by a car?", options: ["Give water","Keep calm and move them safely to avoid further injury","Give pain medication","Let them rest where they are"], correct: 1, explanation: "Keep the dog calm, muzzle if needed, and move them on a flat surface to avoid internal injury." },
      { q: "Which human medication is toxic to cats in any amount?", options: ["Ibuprofen","Paracetamol (acetaminophen)","Aspirin","All of the above"], correct: 3, explanation: "All three — ibuprofen, paracetamol, and aspirin — are toxic to cats." },
      { q: "If a dog swallows a foreign object, you should:", options: ["Induce vomiting immediately","Call a vet immediately","Give milk","Wait and watch"], correct: 1, explanation: "Always call a vet — some objects should NOT be vomited back up as they can cause more damage." },
      { q: "What is the Heimlich manoeuvre used for in dogs?", options: ["Heart failure","Choking","Seizures","Fractures"], correct: 1, explanation: "A modified Heimlich manoeuvre dislodges objects from a dog's airway." },
      { q: "What should you apply to a bleeding wound while rushing to the vet?", options: ["Antiseptic cream","Firm pressure with a clean cloth","Ice directly on the wound","Turmeric paste"], correct: 1, explanation: "Apply firm, direct pressure with a clean cloth or bandage to slow bleeding." },
    ],
  },
  {
    id: "W09", title: "Cat Breeds 🐈", topic: "Breeds", difficulty: "easy",
    questions: [
      { q: "Which cat breed has no hair?", options: ["Devon Rex","Scottish Fold","Sphynx","Siamese"], correct: 2, explanation: "The Sphynx is the most well-known hairless cat breed." },
      { q: "Which breed is known for its flat face and long fur?", options: ["Abyssinian","Persian","Bengal","Maine Coon"], correct: 1, explanation: "Persian cats have distinctive flat faces (brachycephalic) and long, luxurious coats." },
      { q: "What is the largest domestic cat breed?", options: ["Norwegian Forest Cat","Ragdoll","Maine Coon","Siberian"], correct: 2, explanation: "Maine Coons are the largest domestic cat breed, with males reaching 8–10 kg." },
      { q: "Which breed is known for going limp when picked up?", options: ["Siamese","Ragdoll","Burmese","Russian Blue"], correct: 1, explanation: "Ragdolls are named for their tendency to go limp when held, like a ragdoll." },
      { q: "Which cat breed has an 'M' mark on its forehead?", options: ["Persian","Siamese","Tabby","Bengal"], correct: 2, explanation: "The tabby pattern includes a distinctive 'M' marking on the forehead." },
    ],
  },
  {
    id: "W10", title: "Animal Records 🌍", topic: "Fun Facts", difficulty: "easy",
    questions: [
      { q: "What is the world's most popular pet?", options: ["Dog","Cat","Fish","Bird"], correct: 2, explanation: "Fish are the most popular pet worldwide by number — over 150 million kept globally." },
      { q: "Which dog ran the fastest speed ever recorded?", options: ["Greyhound","Saluki","Cheetah-mix","Whippet"], correct: 0, explanation: "A Greyhound named Star Title holds records at 72 km/h." },
      { q: "What is the oldest recorded domestic cat's age?", options: ["25 years","30 years","38 years","45 years"], correct: 2, explanation: "Creme Puff from Texas lived to 38 years and 3 days — the oldest cat ever recorded." },
      { q: "How far can a dog smell compared to a human?", options: ["10x farther","100x farther","10,000x farther","100,000x farther"], correct: 3, explanation: "Dogs can detect smells up to 100,000 times better than humans due to ~300 million scent receptors." },
      { q: "Which animal has the best memory among common pets?", options: ["Dog","Cat","Parrot","Goldfish"], correct: 2, explanation: "Parrots, especially African Greys, have exceptional memory and problem-solving abilities." },
    ],
  },
  {
    id: "W11", title: "Parasite Prevention 🦟", topic: "Health", difficulty: "medium",
    questions: [
      { q: "Which parasite is transmitted through mosquito bites in dogs?", options: ["Tapeworm","Heartworm","Hookworm","Roundworm"], correct: 1, explanation: "Heartworm (Dirofilaria immitis) is transmitted by mosquitoes and can be fatal if untreated." },
      { q: "What is the best way to remove a tick from your pet?", options: ["Burn it off","Use fine-tipped tweezers close to the skin","Apply petroleum jelly","Squeeze it out"], correct: 1, explanation: "Use fine-tipped tweezers to grasp the tick close to the skin and pull upward steadily." },
      { q: "How often should dogs be given flea and tick prevention?", options: ["Once a year","Monthly","Every 6 months","Only when infested"], correct: 1, explanation: "Most flea and tick preventatives require monthly application for continuous protection." },
      { q: "Which household chemical kills fleas in the environment?", options: ["Bleach","Salt","Diatomaceous earth","Vinegar"], correct: 2, explanation: "Food-grade diatomaceous earth dehydrates and kills fleas in carpets and bedding safely." },
      { q: "Can humans get ringworm from pets?", options: ["No, it's species-specific","Yes, it's a zoonotic fungal infection","Only from cats","Only from dogs"], correct: 1, explanation: "Ringworm (dermatophytosis) is a zoonotic fungal infection transmissible between pets and humans." },
    ],
  },
  {
    id: "W12", title: "Pet Nutrition Science 🥗", topic: "Nutrition", difficulty: "hard",
    questions: [
      { q: "Which amino acid is essential ONLY for cats?", options: ["Lysine","Taurine","Arginine","Methionine"], correct: 1, explanation: "Taurine is an essential amino acid for cats — they cannot synthesize it and must get it from food." },
      { q: "What is the ideal protein percentage in adult dry dog food?", options: ["5–10%","18–25%","30–40%","50–60%"], correct: 1, explanation: "AAFCO recommends a minimum of 18% protein for adult dogs on dry food." },
      { q: "Which vitamin is toxic to dogs in excess?", options: ["Vitamin C","Vitamin A","Vitamin B12","Vitamin K"], correct: 1, explanation: "Vitamin A toxicity (hypervitaminosis A) can cause bone deformities and liver damage in dogs." },
      { q: "What does 'grain-free' dog food replace grains with?", options: ["Nothing — it's just less food","Legumes like peas and lentils","More meat protein","Vegetables only"], correct: 1, explanation: "Grain-free foods typically substitute grains with legumes, which have been linked to DCM in some dogs." },
      { q: "Which nutrient gives cats energy and must come from animal fat?", options: ["Arachidonic acid","Omega-3","Linoleic acid","Palmitic acid"], correct: 0, explanation: "Cats cannot synthesize arachidonic acid and must obtain it from animal-based fats." },
    ],
  },
  {
    id: "W13", title: "Pet Body Language 🤔", topic: "Behaviour", difficulty: "medium",
    questions: [
      { q: "What does a dog's tail wagging to the RIGHT generally mean?", options: ["Fear","Anxiety","Positive emotion","Aggression"], correct: 2, explanation: "Research shows tail wagging to the right indicates positive emotions; left indicates negative." },
      { q: "A cat showing you its belly is:", options: ["Always asking for belly rubs","A sign of trust, not necessarily an invitation to touch","A sign of hunger","A sign of aggression"], correct: 1, explanation: "Showing the belly is a trust signal — touching it often triggers defensive reflexes." },
      { q: "What does a dog yawning during training usually mean?", options: ["They're tired","They're stressed or need a break","They're bored","They're happy"], correct: 1, explanation: "Yawning in dogs is a calming signal indicating stress or discomfort." },
      { q: "What does a cat chattering at birds mean?", options: ["They want to play","Predatory excitement and frustration","They're calling the birds","They're scared"], correct: 1, explanation: "Chattering is a response to prey frustration — they can see the prey but can't reach it." },
      { q: "A dog that rolls over and shows its belly during greetings is:", options: ["Dominant","Submissive","Aggressive","Playing"], correct: 1, explanation: "Rolling over and exposing the belly is a classic submissive appeasement gesture." },
    ],
  },
  {
    id: "W14", title: "Aquarium Basics 🐟", topic: "Aquatic Pets", difficulty: "easy",
    questions: [
      { q: "What does the nitrogen cycle do in an aquarium?", options: ["Adds oxygen","Converts toxic ammonia to less harmful compounds","Filters physical debris","Balances pH"], correct: 1, explanation: "Beneficial bacteria convert toxic ammonia (from waste) → nitrite → nitrate." },
      { q: "What is the ideal water temperature for most tropical fish?", options: ["15–18°C","22–28°C","28–32°C","10–15°C"], correct: 1, explanation: "Most tropical fish thrive between 22–28°C." },
      { q: "Why should you cycle a new aquarium before adding fish?", options: ["To decorate it","To establish beneficial bacteria","To warm the water","To add salt"], correct: 1, explanation: "Cycling builds up beneficial bacteria colonies to process fish waste safely." },
      { q: "Can you keep a Betta fish with other Betta fish?", options: ["Yes always","Two females only","Never — they'll fight","Only in large tanks"], correct: 1, explanation: "Two female bettas can sometimes coexist, but male bettas are highly territorial and will fight." },
      { q: "What causes cloudy water in a new aquarium?", options: ["Overfeeding","Bacterial bloom during cycling","Too much light","Wrong pH"], correct: 1, explanation: "Bacterial bloom during the cycling process causes temporary cloudiness." },
    ],
  },
  {
    id: "W15", title: "Dog Senses 👃", topic: "Biology", difficulty: "medium",
    questions: [
      { q: "How many scent receptors does a dog have compared to a human?", options: ["Same","5x more","40x more","300 million vs 6 million"], correct: 3, explanation: "Dogs have ~300 million olfactory receptors vs humans' ~6 million." },
      { q: "Can dogs see colour?", options: ["No, only black and white","Yes, full colour like humans","Yes, but limited — mainly blue and yellow","Only red and green"], correct: 2, explanation: "Dogs are dichromats — they see blue and yellow best but can't distinguish red and green." },
      { q: "What frequency range can dogs hear?", options: ["20–20,000 Hz","40–65,000 Hz","100–100,000 Hz","20–100,000 Hz"], correct: 1, explanation: "Dogs hear from about 40 Hz to 65,000 Hz — much higher than humans' 20,000 Hz upper limit." },
      { q: "How do dogs primarily regulate body temperature?", options: ["Sweating through skin","Panting","Rolling in cool mud","Fur insulation only"], correct: 1, explanation: "Dogs primarily cool down through panting, which evaporates moisture from their tongues." },
      { q: "Where do dogs have sweat glands?", options: ["Nowhere","Only on their paws","All over their body","Under their armpits"], correct: 1, explanation: "Dogs have merocrine sweat glands only on their paw pads." },
    ],
  },
  {
    id: "W16", title: "Puppy Milestones 🐶", topic: "Development", difficulty: "easy",
    questions: [
      { q: "When do puppies first open their eyes?", options: ["At birth","1 week","2 weeks","4 weeks"], correct: 2, explanation: "Puppies are born with eyes sealed shut and typically open them at around 2 weeks of age." },
      { q: "The critical socialization window for puppies is:", options: ["0–4 weeks","3–14 weeks","6–12 months","1–2 years"], correct: 1, explanation: "The critical socialization period is 3–14 weeks — experiences during this time shape lifetime behaviour." },
      { q: "When should a puppy be separated from its mother?", options: ["4 weeks","6 weeks","8 weeks","12 weeks"], correct: 2, explanation: "8 weeks is the recommended minimum — earlier separation causes behavioural problems." },
      { q: "What is the 'fear imprint period' in puppies?", options: ["0–2 weeks","8–11 weeks","12–16 weeks","6 months"], correct: 1, explanation: "8–11 weeks is a fear imprint period — traumatic experiences here can leave lasting impressions." },
      { q: "When do most dogs reach sexual maturity?", options: ["3 months","6 months","9–12 months","18 months"], correct: 2, explanation: "Most dogs reach sexual maturity between 6–12 months, though larger breeds may take longer." },
    ],
  },
  {
    id: "W17", title: "Stray & Community Animals 🐕", topic: "Welfare & India", difficulty: "medium",
    questions: [
      { q: "What does ABC stand for in the context of Indian stray dog management?", options: ["Animal Birth Control","Animal Behaviour Control","Anti-Bite Campaign","Animal Breeding Certification"], correct: 0, explanation: "ABC — Animal Birth Control — is India's humane approach to managing stray dog populations." },
      { q: "Under ABC Rules, what happens to sterilised strays?", options: ["Sent to shelters","Euthanised","Returned to the same locality","Sent to farms"], correct: 2, explanation: "Sterilised and vaccinated strays are returned to their area — called RVS (Return to Vaccination Site)." },
      { q: "Which NGO is known for large-scale stray animal rescue in India?", options: ["WWF","Blue Cross of India","Greenpeace","TRAFFIC"], correct: 1, explanation: "Blue Cross of India (Chennai) is one of India's oldest and largest animal welfare NGOs." },
      { q: "Is it legal to relocate community dogs in India?", options: ["Yes, anywhere","No — Supreme Court rulings prohibit arbitrary relocation","Only with MCD permission","Only if they bite"], correct: 1, explanation: "Multiple High Court and Supreme Court rulings have affirmed that strays cannot be arbitrarily relocated." },
      { q: "What is the primary disease risk community dogs pose that vaccinations prevent?", options: ["Parvovirus","Rabies","Distemper","Leptospirosis"], correct: 1, explanation: "Rabies is the primary public health concern, which is why mass vaccination is central to ABC programs." },
    ],
  },
  {
    id: "W18", title: "Bird Intelligence 🦜", topic: "Birds", difficulty: "medium",
    questions: [
      { q: "Which parrot species is considered most intelligent?", options: ["Budgerigar","Macaw","African Grey","Cockatoo"], correct: 2, explanation: "African Grey parrots demonstrate vocabulary, object permanence, and concept understanding rivalling young children." },
      { q: "What is 'flight feather clipping' in pet birds?", options: ["A hygiene procedure","Trimming feathers to limit flight","A medical treatment","Removing wing feathers entirely"], correct: 1, explanation: "Flight feather clipping trims primary feathers to reduce flight capability — controversial among avian vets." },
      { q: "Which common household fume is deadly to birds?", options: ["Candle wax","PTFE/Teflon non-stick coating fumes","Perfume","Cigarette smoke"], correct: 1, explanation: "PTFE (polytrafluoroethylene) from overheated non-stick pans releases fumes instantly fatal to birds." },
      { q: "How do birds regulate their body temperature?", options: ["Sweating","Panting and fluffing feathers","Shivering only","They can't regulate it"], correct: 1, explanation: "Birds pant to lose heat and fluff their feathers to trap warm air." },
      { q: "What is the average lifespan of a pet Budgerigar?", options: ["1–2 years","5–8 years","15–20 years","25+ years"], correct: 1, explanation: "Budgerigars typically live 5–8 years in captivity with good care." },
    ],
  },
  {
    id: "W19", title: "Dental Health 🦷", topic: "Health", difficulty: "medium",
    questions: [
      { q: "What percentage of dogs over 3 have dental disease?", options: ["20%","50%","80%","Nearly all — over 90%"], correct: 3, explanation: "Over 90% of dogs over age 3 have some form of periodontal disease." },
      { q: "How often should you brush your dog's teeth?", options: ["Once a month","Once a week","Daily","Only at the vet"], correct: 2, explanation: "Daily brushing is ideal; 3x per week is the minimum effective frequency." },
      { q: "What type of toothpaste should you use for dogs?", options: ["Human fluoride toothpaste","Baking soda paste","Pet-specific enzymatic toothpaste","Any fruity toothpaste"], correct: 2, explanation: "Pet-specific enzymatic toothpaste is safe when swallowed; human fluoride toothpaste is toxic to dogs." },
      { q: "What are 'dental chews' primarily effective at?", options: ["Whitening teeth","Reducing plaque and tartar","Replacing brushing","Treating gum disease"], correct: 1, explanation: "Dental chews mechanically reduce plaque and tartar but do not replace brushing." },
      { q: "What is a sign of dental pain in cats?", options: ["Excessive meowing","Dropping food/reluctance to eat hard food","Increased grooming","Excessive thirst"], correct: 1, explanation: "Cats hide pain well — dropping food or reluctance to eat hard kibble often signals dental pain." },
    ],
  },
  {
    id: "W20", title: "Pet Psychology 🧠", topic: "Behaviour", difficulty: "hard",
    questions: [
      { q: "What is classical conditioning in pet training?", options: ["Rewarding good behaviour","Associating a stimulus with a response","Punishing bad behaviour","Ignoring unwanted behaviour"], correct: 1, explanation: "Classical conditioning (Pavlov) creates associations — e.g., the sound of a leash triggers excitement." },
      { q: "What is 'separation anxiety' in dogs?", options: ["Disliking strangers","Distress when left alone","Fear of open spaces","Aggression with other dogs"], correct: 1, explanation: "Separation anxiety is a clinical condition where dogs become distressed when separated from their attachment figure." },
      { q: "What is counter-conditioning?", options: ["Training to counter bad habits","Changing emotional response to a stimulus","A punishment technique","Using treats vs praise"], correct: 1, explanation: "Counter-conditioning changes a negative emotional response to a positive one by pairing the trigger with rewards." },
      { q: "What does 'operant conditioning' involve?", options: ["Associating stimuli","Learning through consequences (reward/punishment)","Pack hierarchy training","Alpha techniques"], correct: 1, explanation: "Operant conditioning (Skinner) involves learning through the consequences of behaviour — reinforcement and punishment." },
      { q: "The 'Alpha/Dominance' theory in dog training is:", options: ["Scientifically sound","Outdated — based on misinterpreted wolf studies","The gold standard","Recommended by all vets"], correct: 1, explanation: "The dominance theory was based on studies of unrelated captive wolves. Modern science shows dogs don't have rigid pack hierarchies." },
    ],
  },
  {
    id: "W21", title: "Pet Travel & Safety ✈️", topic: "Travel", difficulty: "easy",
    questions: [
      { q: "What is the safest way to transport a dog in a car?", options: ["Loose in the back seat","Secured in a crate or harness","On the owner's lap","In the boot/trunk"], correct: 1, explanation: "A secured crate or crash-tested harness is safest — a loose dog becomes a projectile in a crash." },
      { q: "How soon before a flight should you stop feeding your pet?", options: ["No restriction","4 hours","12 hours","24 hours"], correct: 1, explanation: "Most airlines and vets recommend withholding food 4 hours before flying to reduce nausea." },
      { q: "What document is required to travel with a pet by train in India?", options: ["Nothing","Vaccination certificate","Vet fitness certificate","Both B and C"], correct: 3, explanation: "Indian Railways requires a health certificate and vaccination record to carry pets." },
      { q: "Should you give sedatives to your pet for flights?", options: ["Yes — always","Only on long flights","Generally no — check with your vet","Only for cats"], correct: 2, explanation: "Most vets advise against sedation as it can cause respiratory and cardiovascular issues at altitude." },
      { q: "What should you pack in a pet travel kit?", options: ["Just food","Food, water, familiar toys, vet records, medications","Only medications","Toys only"], correct: 1, explanation: "A complete kit includes food, water, bowls, familiar items, vaccination records, and any medications." },
    ],
  },
  {
    id: "W22", title: "Zoonotic Diseases 🦠", topic: "Health & Safety", difficulty: "hard",
    questions: [
      { q: "What is a zoonotic disease?", options: ["A disease only affecting zoo animals","A disease which can pass from animals to humans","A disease caused by parasites only","A genetic disease"], correct: 1, explanation: "Zoonotic diseases can be transmitted between animals and humans, such as rabies, ringworm, and leptospirosis." },
      { q: "How is leptospirosis spread from dogs to humans?", options: ["Direct contact","Through urine in water or soil","By biting","Through saliva"], correct: 1, explanation: "Leptospira bacteria are shed in urine and contaminate water/soil — humans get infected through skin or mucous membranes." },
      { q: "Which common pet parasite can cause visceral larva migrans in children?", options: ["Tapeworm","Toxocara (roundworm)","Hookworm","Giardia"], correct: 1, explanation: "Toxocara canis (dog roundworm) larvae can migrate to human organs causing visceral larva migrans." },
      { q: "What is 'cat scratch disease'?", options: ["A skin condition in cats","A bacterial infection from cat scratches","A parasitic disease","A virus"], correct: 1, explanation: "Cat scratch disease (Bartonella henselae) is a bacterial infection humans get from cat scratches or bites." },
      { q: "Which occupational group is at highest risk of zoonotic infections?", options: ["Teachers","Vets, pet owners, and farm workers","Office workers","Athletes"], correct: 1, explanation: "Vets, farmers, and pet owners have the highest exposure to potential zoonotic pathogens." },
    ],
  },
  {
    id: "W23", title: "Reptile Basics 🦎", topic: "Reptiles", difficulty: "medium",
    questions: [
      { q: "What is thermoregulation in reptiles?", options: ["Producing internal body heat","Moving between warm and cool areas to control body temperature","Hibernation","Shedding skin"], correct: 1, explanation: "Reptiles are ectotherms — they regulate body temperature by moving between different temperature zones." },
      { q: "How often do ball pythons typically eat?", options: ["Daily","Every 1–2 weeks","Once a month","Every 5 days"], correct: 1, explanation: "Ball pythons typically eat every 1–2 weeks depending on age and size." },
      { q: "What causes dysecdysis (incomplete shedding) in reptiles?", options: ["Overfeeding","Low humidity","Too much UV","Cold temperature"], correct: 1, explanation: "Low humidity is the primary cause — humid hides and misting can prevent incomplete sheds." },
      { q: "Which common bacteria is associated with reptile handling?", options: ["E. coli","Salmonella","Streptococcus","MRSA"], correct: 1, explanation: "Many reptiles carry Salmonella bacteria naturally — handwashing after handling is essential." },
      { q: "What does a leopard gecko's tail dropping indicate?", options: ["Hunger","Extreme stress or self-defence","A mating display","Normal behaviour"], correct: 1, explanation: "Tail dropping (autotomy) is a defence mechanism — leopard geckos can regenerate their tail." },
    ],
  },
  {
    id: "W24", title: "Senior Pet Care 👴", topic: "Care", difficulty: "medium",
    questions: [
      { q: "At what age is a dog generally considered 'senior'?", options: ["3 years","5 years","7–10 years (breed-dependent)","12 years"], correct: 2, explanation: "Senior status depends on size — small breeds at ~10 years, large breeds at ~7 years." },
      { q: "What health check is most important for senior dogs?", options: ["Eye check","Annual bloodwork and urine analysis","Dental check","Hip X-ray"], correct: 1, explanation: "Bloodwork and urinalysis catch early organ dysfunction before symptoms appear." },
      { q: "Which supplement is commonly recommended for senior dog joint health?", options: ["Vitamin C","Zinc","Glucosamine and chondroitin","Iron"], correct: 2, explanation: "Glucosamine and chondroitin support cartilage health and are widely used for arthritis in senior dogs." },
      { q: "What cognitive decline condition can affect elderly dogs?", options: ["Dog dementia (CDS)","Parkinson's","Alzheimer's","Epilepsy"], correct: 0, explanation: "Canine Cognitive Dysfunction Syndrome (CDS) is similar to dementia in humans." },
      { q: "How should senior pet food differ from adult food?", options: ["More calories","Lower protein","Adjusted calories, easier to digest, joint-support nutrients","More grains"], correct: 2, explanation: "Senior diets often have adjusted calories, enhanced joint support, and are more digestible." },
    ],
  },
  {
    id: "W25", title: "Spay & Neuter 🏥", topic: "Health & Welfare", difficulty: "medium",
    questions: [
      { q: "What is the primary benefit of spaying a female dog?", options: ["Makes her calmer","Eliminates risk of uterine infection and mammary cancer","Improves coat","Reduces barking"], correct: 1, explanation: "Spaying eliminates pyometra (uterine infection) risk and dramatically reduces mammary cancer risk." },
      { q: "At what age is it typically recommended to neuter a male dog?", options: ["3 months","6 months","12 months (or when fully grown for large breeds)","2 years"], correct: 2, explanation: "6–12 months is common, though larger breeds benefit from waiting until skeletal maturity." },
      { q: "Does neutering stop aggressive behaviour in dogs?", options: ["Always","Never","Reduces testosterone-driven aggression; not a fix-all","Only in males"], correct: 2, explanation: "Neutering reduces hormone-driven aggression but won't fix learned aggression or fear-based behaviour." },
      { q: "What is the term for surgical sterilisation in female cats?", options: ["Neutering","Spaying","Castration","Desexing"], correct: 1, explanation: "Spaying (ovariohysterectomy) removes ovaries and uterus in female cats." },
      { q: "Which organisation promotes Trap-Neuter-Return (TNR) for feral cats?", options: ["PETA","Alley Cat Allies","SPCA India","Cats Protection"], correct: 1, explanation: "Alley Cat Allies pioneered and promotes TNR as the humane, effective management strategy for feral cat colonies." },
    ],
  },
  {
    id: "W26", title: "Wild Animals as Pets 🐆", topic: "Wildlife & Law", difficulty: "hard",
    questions: [
      { q: "Is keeping a wild animal as a pet legal in India?", options: ["Yes, with a license","No — Schedule I animals are prohibited under WPA 1972","Only for zoos","Only exotic species from abroad"], correct: 1, explanation: "The Wildlife Protection Act 1972 prohibits keeping Schedule I and many Schedule II species as pets." },
      { q: "Which seemingly 'exotic' animal is actually protected in India?", options: ["Goldfish","Indian Star Tortoise","Red-eared Slider","Hamster"], correct: 1, explanation: "The Indian Star Tortoise is protected under Schedule IV of WPA 1972 and cannot be kept as a pet." },
      { q: "Why should wild animals NOT be kept as pets?", options: ["They're expensive","They suffer from stress, improper diet, space deprivation, and loss of natural behaviour","They eat too much","They're hard to train"], correct: 1, explanation: "Wild animals have complex needs that cannot be met in captivity, causing chronic stress and disease." },
      { q: "What should you do if you find an injured wild animal?", options: ["Take it home as a pet","Contact a licensed wildlife rescue centre","Release it far from where you found it","Leave it alone always"], correct: 1, explanation: "Contact SPCA, local forest department, or a licensed wildlife rescue — do not attempt to care for it yourself." },
      { q: "Which global treaty regulates trade in endangered species?", options: ["CITES","CBD","Ramsar Convention","IUCN Red List"], correct: 0, explanation: "CITES (Convention on International Trade in Endangered Species) regulates international wildlife trade." },
    ],
  },
  {
    id: "W27", title: "Pet Insurance 💰", topic: "Finance & Care", difficulty: "easy",
    questions: [
      { q: "What does pet insurance typically cover?", options: ["Only accidents","Only illness","Accidents, illnesses, and sometimes wellness","Everything including food"], correct: 2, explanation: "Most pet insurance covers unexpected accidents and illnesses; some plans include wellness care." },
      { q: "What is a 'waiting period' in pet insurance?", options: ["Time to get your card","Period before claims are eligible","Time between renewals","Processing time for claims"], correct: 1, explanation: "Waiting periods (usually 14–30 days) prevent people from buying insurance only when their pet is already sick." },
      { q: "Is pet insurance available in India?", options: ["No","Yes, some companies offer it","Only for exotic pets","Only through vets"], correct: 1, explanation: "Companies like New India Assurance, Bajaj Allianz, and others offer pet insurance in India." },
      { q: "What is a 'pre-existing condition' in pet insurance?", options: ["A condition that will develop in future","A health issue present before the policy started","A genetic disease","A chronic illness"], correct: 1, explanation: "Pre-existing conditions are typically excluded from coverage — they existed before the policy began." },
      { q: "When is the best time to buy pet insurance?", options: ["When your pet is sick","When your pet is young and healthy","After a big vet bill","It doesn't matter"], correct: 1, explanation: "Buying when young and healthy means lower premiums and no pre-existing condition exclusions." },
    ],
  },
  {
    id: "W28", title: "Animal Communication 💬", topic: "Behaviour", difficulty: "medium",
    questions: [
      { q: "What does a dog's play bow communicate?", options: ["Submission","Aggression","Invitation to play","Fear"], correct: 2, explanation: "The play bow (front down, rear up) is a universal canine invitation to play." },
      { q: "What is 'allogrooming' in cats?", options: ["Self-grooming","Grooming another animal","A stress behaviour","Marking territory"], correct: 1, explanation: "Allogrooming — mutual grooming between cats — strengthens social bonds and shows trust." },
      { q: "Why do dogs tilt their head when you talk to them?", options: ["They're confused","They're trying to hear better and process words","They're bored","A trained response only"], correct: 1, explanation: "Head tilting helps dogs locate sounds more precisely and may help them see facial expressions better." },
      { q: "What does it mean when a cat headbutts you (bunting)?", options: ["They want food","They're scent marking you as their territory, affectionately","They're sick","They want to play"], correct: 1, explanation: "Bunting deposits scent from facial glands onto you — a mark of affection and ownership." },
      { q: "What does a dog's high-pitched yelp communicate?", options: ["Happiness","Pain or sudden surprise","Aggression","Hunger"], correct: 1, explanation: "A sudden high-pitched yelp is typically a pain or surprise response." },
    ],
  },
  {
    id: "W29", title: "Monsoon Pet Care 🌧️", topic: "Seasonal Care", difficulty: "easy",
    questions: [
      { q: "Why are paw checks important after monsoon walks?", options: ["Mud is pretty","Wet paws attract insects","Moisture causes fungal infections between paw pads","Paws grow faster in rain"], correct: 2, explanation: "Prolonged moisture between paw pads creates ideal conditions for fungal and bacterial infections." },
      { q: "Which disease risk rises sharply for dogs in monsoon season?", options: ["Arthritis","Leptospirosis","Obesity","Dental disease"], correct: 1, explanation: "Leptospira bacteria thrive in stagnant water — the risk skyrockets during monsoon flooding." },
      { q: "How should you dry your dog after a rainy walk?", options: ["Leave them to air dry","Use a hairdryer on high heat","Dry with a towel focusing on ears and paws","Just shake them"], correct: 2, explanation: "Dry with a towel, focusing especially on ears (to prevent otitis) and between paw pads." },
      { q: "What should you consider for dog bedding during monsoon season?", options: ["Remove all bedding","Use waterproof/easily washable bedding elevated off the floor","Use thick rugs","Nothing changes"], correct: 1, explanation: "Elevated, waterproof bedding prevents damp floors from causing joint pain and fungal growth." },
      { q: "Can mosquito-borne heartworm transmission increase during monsoon?", options: ["No — mosquitoes die in rain","Yes — mosquito populations surge with standing water","Stays the same","Only for cats"], correct: 1, explanation: "Monsoon creates breeding grounds for mosquitoes, increasing heartworm transmission risk significantly." },
    ],
  },
  {
    id: "W30", title: "Small Pets 🐹", topic: "Small Animals", difficulty: "easy",
    questions: [
      { q: "What is the ideal diet for a pet hamster?", options: ["Only seeds","Pellets, fresh veggies, limited seeds, occasional protein","Only fruits","Hamster muesli mix only"], correct: 1, explanation: "A balanced hamster diet includes quality pellets, fresh vegetables, limited seeds, and occasional protein." },
      { q: "Which common fruit is toxic to hamsters?", options: ["Apple (seedless)","Banana","Citrus fruits","Cucumber"], correct: 2, explanation: "Citrus fruits are too acidic and can cause digestive upset in hamsters." },
      { q: "How often does a guinea pig need vitamin C?", options: ["Weekly","Daily — they cannot synthesize it","Monthly","They don't need it"], correct: 1, explanation: "Guinea pigs, like humans, cannot synthesize Vitamin C and must receive it daily through diet." },
      { q: "Why should rabbits not be kept in small cages?", options: ["They overheat","They need space to run and binky or they suffer physically and mentally","They eat the cage","They need company"], correct: 1, explanation: "Rabbits need space to run — a confined rabbit develops spinal problems and severe psychological stress." },
      { q: "Which small pet is completely silent?", options: ["Hamster","Guinea pig","Fish","Gerbil"], correct: 2, explanation: "Fish produce no audible sounds, making them the most noise-free pet option." },
    ],
  },
  {
    id: "W31", title: "Fun Pet History 📚", topic: "History", difficulty: "easy",
    questions: [
      { q: "Which civilization first domesticated cats?", options: ["Roman","Chinese","Ancient Egyptian","Greek"], correct: 2, explanation: "Ancient Egyptians domesticated cats around 4,000 years ago — they were revered and even worshipped." },
      { q: "What was the first animal ever sent to space?", options: ["Chimpanzee","Laika the dog","A rabbit","A monkey"], correct: 1, explanation: "Laika, a Soviet stray dog, became the first animal in orbit in 1957 aboard Sputnik 2." },
      { q: "Dogs were first domesticated from which animal?", options: ["Foxes","Jackals","Wolves","Coyotes"], correct: 2, explanation: "All domestic dogs descend from wolves — domestication began 15,000–40,000 years ago." },
      { q: "Which country has the highest rate of pet ownership per household?", options: ["USA","India","Australia","Brazil"], correct: 0, explanation: "The USA has one of the highest rates of pet ownership, with pets in over 70% of households." },
      { q: "What was the primary role of cats in ancient Egypt?", options: ["Religious symbol only","Hunting companion","Pest control (protecting grain stores)","Guard animals"], correct: 2, explanation: "Cats were prized for protecting grain stores from rodents — their pest control role led to their domestication." },
    ],
  },
  {
    id: "W32", title: "Common Toxins ☠️", topic: "Safety & Health", difficulty: "hard",
    questions: [
      { q: "Which common houseplant is toxic to cats?", options: ["Spider plant","Aloe vera","Lilies","Bamboo palm"], correct: 2, explanation: "All species of lilies (Lilium and Hemerocallis) are extremely toxic to cats, causing acute kidney failure." },
      { q: "What makes xylitol dangerous to dogs?", options: ["High calories","Causes severe low blood sugar and liver failure","It's an allergen","Causes dehydration"], correct: 1, explanation: "Xylitol triggers massive insulin release causing severe hypoglycemia, and can cause acute liver failure in dogs." },
      { q: "Which common household chemical is toxic to cats when licked off paws?", options: ["Dish soap","Any essential oil","Bleach-based floor cleaner","Baking soda"], correct: 2, explanation: "Bleach-based cleaners are highly toxic — cats lick paws after walking on cleaned floors." },
      { q: "How quickly can onion toxicity affect dogs?", options: ["Immediately","Within hours","Over days of repeated exposure","Rarely dangerous"], correct: 2, explanation: "Onion causes cumulative damage to red blood cells (Heinz body anaemia) — effect builds with repeated exposure." },
      { q: "What should you do first if your pet ingests a toxin?", options: ["Give milk","Induce vomiting","Call the vet or pet poison helpline immediately","Wait and watch"], correct: 2, explanation: "Always call a vet first — inducing vomiting is contraindicated for some toxins (caustics, sharp objects, hydrocarbons)." },
    ],
  },
  {
    id: "W33", title: "Microchipping 📡", topic: "Technology & ID", difficulty: "easy",
    questions: [
      { q: "What is a pet microchip?", options: ["A GPS tracker","A small RFID chip implanted under the skin","A medical monitoring device","A tracking collar"], correct: 1, explanation: "A microchip is a passive RFID device (no battery) that stores a unique ID number scannable by vets and shelters." },
      { q: "Where is a microchip typically implanted in dogs?", options: ["In the ear","Between shoulder blades","In the leg","Under the front paw"], correct: 1, explanation: "Microchips are typically implanted under the skin between the shoulder blades." },
      { q: "What must you do after microchipping your pet?", options: ["Nothing","Register the chip number in a national database","Get a certificate only","Replace it yearly"], correct: 1, explanation: "The chip is useless without registration — the ID must be linked to owner contact details in a database." },
      { q: "Is microchipping mandatory in India?", options: ["Yes, nationally","No, but some states and apartments require it","Only for imported pets","Only for dangerous dogs"], correct: 1, explanation: "While not nationally mandated, many housing societies, states, and registration bodies require microchipping." },
      { q: "How long does a microchip last?", options: ["1–2 years","5 years","The lifetime of the pet","10 years"], correct: 2, explanation: "Microchips are designed to last the lifetime of the pet — no battery, no maintenance required." },
    ],
  },
  {
    id: "W34", title: "Pet Mental Health 💆", topic: "Mental Wellbeing", difficulty: "medium",
    questions: [
      { q: "What is environmental enrichment for pets?", options: ["Giving more food","Activities and stimulation that meet natural behaviour needs","Expensive toys only","Larger living space"], correct: 1, explanation: "Environmental enrichment provides mental and physical stimulation matching natural behaviours — vital for welfare." },
      { q: "Which sign MOST indicates chronic stress in cats?", options: ["Purring","Over-grooming leading to bald patches","Sleeping often","Eating well"], correct: 1, explanation: "Psychogenic alopecia (over-grooming to the point of hair loss) is a classic sign of chronic stress in cats." },
      { q: "What is Adaptil (DAP)?", options: ["A medication","A synthetic dog appeasing pheromone diffuser","A supplement","A training tool"], correct: 1, explanation: "Adaptil contains synthetic DAP (Dog Appeasing Pheromone) that helps reduce anxiety in dogs." },
      { q: "Does a busy, working owner contribute to dog anxiety?", options: ["No — dogs sleep all day","Yes — separation anxiety is linked to under-stimulation and owner absences","Never — dogs are resilient","Only in large breeds"], correct: 1, explanation: "Dogs left alone for long periods or under-exercised are at much higher risk of separation anxiety." },
      { q: "What is food puzzle enrichment?", options: ["Fancy food bowls","Devices that require mental effort to access food","A special diet","Portion control feeding"], correct: 1, explanation: "Food puzzles slow eating and provide mental stimulation — great for bored or anxious pets." },
    ],
  },
  {
    id: "W35", title: "Dog Sports & Activities 🏃", topic: "Activities", difficulty: "easy",
    questions: [
      { q: "What is agility training for dogs?", options: ["Swimming training","Navigating obstacle courses under direction","Weight pulling","Racing"], correct: 1, explanation: "Dog agility is a sport where dogs navigate obstacle courses (jumps, tunnels, weave poles) directed by their handler." },
      { q: "Which breed excels at flyball?", options: ["Basset Hound","Border Collie","Bulldog","Chow Chow"], correct: 1, explanation: "Border Collies dominate flyball with their speed, intelligence, and ball drive." },
      { q: "What is 'nose work' or 'scent work' for dogs?", options: ["Teaching dogs not to sniff","A sport where dogs find a hidden scent in various environments","Nose grooming","Socialisation training"], correct: 1, explanation: "Nose work/scent work is a sport based on detection training where dogs find specific odours." },
      { q: "How much exercise does a Border Collie typically need daily?", options: ["20 minutes","1 hour","2+ hours of intense exercise","30 minutes is enough"], correct: 2, explanation: "Border Collies are working dogs needing 2+ hours of vigorous daily activity or they develop behavioural issues." },
      { q: "What is Canicross?", options: ["Dog swimming races","Cross-country running with your dog attached to you","Dog vs dog racing","Off-leash hiking"], correct: 1, explanation: "Canicross is a sport where a runner is attached to their dog via a bungee line and harness for trail running." },
    ],
  },
  {
    id: "W36", title: "Veterinary Careers 👩‍⚕️", topic: "Education & Careers", difficulty: "easy",
    questions: [
      { q: "How many years is a BVSc degree in India?", options: ["3 years","4 years","5 years","6 years"], correct: 2, explanation: "BVSc (Bachelor of Veterinary Science) in India is a 5-year programme including internship." },
      { q: "What does 'TANUVAS' stand for?", options: ["Tamil Nadu Urban Veterinary Agency","Tamil Nadu Veterinary and Animal Sciences University","Tamil Nadu Association of Vets","Tamilnadu Animal University"], correct: 1, explanation: "TANUVAS is a premier veterinary university in Chennai offering BVSc, MVSc, and PhD programmes." },
      { q: "Which exam must be cleared for postgraduate veterinary admission in India?", options: ["NEET PG","GATE (XL paper)","ICAR-AIEEA-PG","Both B and C"], correct: 2, explanation: "ICAR-AIEEA-PG is the national entrance for MSc and MVSc at ICAR institutes." },
      { q: "What is a 'veterinary behaviourist'?", options: ["A vet who only treats wild animals","A vet specialising in diagnosing and treating animal behaviour problems","A dog trainer","A zookeeper"], correct: 1, explanation: "A veterinary behaviourist holds a DVM plus specialty board certification in animal behaviour — different from a trainer." },
      { q: "What does 'zoo medicine' involve?", options: ["Treating only dogs and cats","Veterinary care for zoo, aquarium, and exotic animals","Only elephant care","Emergency medicine only"], correct: 1, explanation: "Zoo medicine encompasses veterinary care for exotic, zoo, and aquarium animals across hundreds of species." },
    ],
  },
  {
    id: "W37", title: "Pet Allergies 🤧", topic: "Health", difficulty: "medium",
    questions: [
      { q: "What is the most common allergy trigger in dogs?", options: ["Pollen","Cat dander","Flea saliva","Dust mites"], correct: 2, explanation: "Flea allergy dermatitis (FAD) is the most common allergic skin condition in dogs worldwide." },
      { q: "Are humans allergic to pet hair or pet dander?", options: ["Hair","Dander (dead skin cells) and proteins in saliva/urine","Both equally","Neither — it's the fur oils"], correct: 1, explanation: "Pet allergies in humans are triggered by proteins found in dander (Fel d 1 in cats, Can f 1 in dogs), not hair." },
      { q: "What is an elimination diet for pets?", options: ["A starvation diet","Feeding a novel protein/carb diet for 8–12 weeks to identify food allergies","Removing treats","A weight-loss plan"], correct: 1, explanation: "Elimination diets use novel ingredients for 8–12 weeks to determine whether symptoms are food-related." },
      { q: "What is atopic dermatitis in dogs?", options: ["A bacterial skin infection","A chronic allergic skin condition to environmental allergens","A fungal disease","A parasite infestation"], correct: 1, explanation: "Atopic dermatitis is a chronic inflammatory skin condition caused by environmental allergens like pollen and dust." },
      { q: "Which dog breed is most prone to allergies?", options: ["Poodle","Maltese","Bulldog","West Highland White Terrier and Labrador"], correct: 3, explanation: "WHWTs and Labradors (among others) are particularly prone to atopic dermatitis." },
    ],
  },
  {
    id: "W38", title: "Pet Photography 📸", topic: "Fun & Hobbies", difficulty: "easy",
    questions: [
      { q: "What setting helps freeze a moving pet in a photo?", options: ["Long exposure","High ISO only","Fast shutter speed (1/500s+)","Portrait mode"], correct: 2, explanation: "A fast shutter speed (1/500s or faster) freezes motion to capture sharp action shots of pets." },
      { q: "What is the best light for pet photography?", options: ["Flash directly on the pet","Harsh midday sunlight","Natural soft light (golden hour or overcast)","Indoor fluorescent light"], correct: 2, explanation: "Natural diffused light (golden hour, open shade, overcast skies) avoids harsh shadows and unflattering flash." },
      { q: "How do you get a pet to look at the camera?", options: ["Shout their name","Make interesting sounds or show a treat just above the lens","Chase them","Wait indefinitely"], correct: 1, explanation: "Squeaky toys, treat sounds, or calling while holding a treat above the lens gets natural eye contact." },
      { q: "What camera angle makes pets look most engaging?", options: ["Above, looking down","Same level as or below the pet","Far away with zoom","Always from the right side"], correct: 1, explanation: "Shooting at the pet's eye level creates connection and intimacy — get down on their level!" },
      { q: "What is the 'burst mode' used for in pet photography?", options: ["Better colour","To take multiple rapid shots and select the sharpest","Longer battery life","Better focus"], correct: 1, explanation: "Burst mode takes several frames per second — essential for capturing that perfect mid-action moment." },
    ],
  },
  {
    id: "W39", title: "Animal Welfare Ethics 🌿", topic: "Ethics & Welfare", difficulty: "hard",
    questions: [
      { q: "What are the 'Five Freedoms' of animal welfare?", options: ["Five laws in India","Freedom from hunger, discomfort, pain, fear, and to express normal behaviour","Five rights under PCA Act","Five vet guidelines"], correct: 1, explanation: "The Five Freedoms (Brambell, 1965) are: freedom from hunger/thirst, discomfort, pain/injury/disease, fear/distress, and to express normal behaviour." },
      { q: "What does 'sentience' mean in the context of animal welfare?", options: ["Intelligence of animals","Ability to feel pain, pleasure, and emotions","Legal rights","Social behaviour"], correct: 1, explanation: "Sentience refers to the capacity to feel subjective experiences — the scientific basis for animal welfare rights." },
      { q: "What is the biggest argument against puppy mills?", options: ["Too expensive","They produce unhealthy breeds","Dogs are kept in inhumane, cramped conditions with no welfare standards","They're unregistered"], correct: 2, explanation: "Puppy mills prioritise profit over welfare — breeding dogs live in appalling conditions with no socialisation or care." },
      { q: "Is it ethical to declaw a cat?", options: ["Yes — safer for furniture","No — it's amputation causing chronic pain and behaviour changes","Only for indoor cats","Depends on the cat"], correct: 1, explanation: "Declawing (onychectomy) removes the last bone of each toe — it causes chronic pain and is banned in many countries." },
      { q: "What does 'adopt don't shop' advocate?", options: ["Making pet shops illegal","Choosing to adopt from shelters instead of buying from breeders","Only pure-breed rescues","Government regulation of breeders"], correct: 1, explanation: "The campaign encourages adoption from shelters and rescues to reduce demand for bred animals and shelter euthanasia." },
    ],
  },
  {
    id: "W40", title: "Indian Breeds 🇮🇳", topic: "Breeds", difficulty: "medium",
    questions: [
      { q: "Which Indian dog breed is also called the 'Caravan Hound'?", options: ["Mudhol Hound","Chippiparai","Rampur Hound","Kanni"], correct: 0, explanation: "The Mudhol Hound from Karnataka is also called the Caravan Hound and is one of India's fastest breeds." },
      { q: "Which Indian breed is known for its hunting prowess and loyal nature?", options: ["Combai","Indie","Pomeranian","Dalmatian"], correct: 0, explanation: "The Combai (Kombai) from Tamil Nadu is a fierce, loyal hunting dog known for boar hunting." },
      { q: "What is a 'Desi/Indie' dog?", options: ["An imported breed","An Indian pariah dog (indigenous mixed-breed)","A specific registered breed","A street dog only"], correct: 1, explanation: "Indie/INDog refers to the Indian pariah dog — an ancient, naturally selected landrace with excellent health." },
      { q: "Which Indian state does the Jonangi breed originate from?", options: ["Tamil Nadu","Andhra Pradesh","Rajasthan","Kerala"], correct: 1, explanation: "The Jonangi originated along the Andhra Pradesh coastline and was used by fishermen and for herding ducks." },
      { q: "Which Indian breed is known for unusual vocalisations instead of barking?", options: ["Mudhol Hound","Jonangi","Chippiparai","Rajapalayam"], correct: 1, explanation: "Jonangi dogs are known for their yodelling vocalisations — they rarely bark conventionally." },
    ],
  },
  {
    id: "W41", title: "Cat Health Basics 🐱", topic: "Health", difficulty: "medium",
    questions: [
      { q: "What is FIV in cats?", options: ["Feline Infectious Virus (generic)","Feline Immunodeficiency Virus — a retrovirus like HIV","Feline Intestinal Virus","Feline Influenza Virus"], correct: 1, explanation: "FIV is a retrovirus that weakens cats' immune systems — it's transmitted primarily through deep bite wounds." },
      { q: "What is the most common urinary issue in male cats?", options: ["Bladder cancer","Urinary blockage (urethral obstruction)","Kidney stones","UTI"], correct: 1, explanation: "Male cats have a very narrow urethra — blockages are a life-threatening emergency requiring immediate vet care." },
      { q: "What does hairball prevention treatment do?", options: ["Removes hair","Lubricates the digestive tract to help pass hair","Stops grooming","Reduces shedding"], correct: 1, explanation: "Hairball remedies (usually petroleum jelly-based) lubricate the gut allowing hair to pass through." },
      { q: "Which poison is uniquely lethal to cats but not dogs?", options: ["Chocolate","Permethrin (dog flea products)","Grapes","Onions"], correct: 1, explanation: "Permethrin-based dog flea products are acutely toxic to cats — even small amounts cause seizures and death." },
      { q: "At what age should cats transition from kitten to adult food?", options: ["6 months","1 year","2 years","18 months"], correct: 1, explanation: "Cats should switch to adult food at around 12 months when growth slows." },
    ],
  },
  {
    id: "W42", title: "Animal Shelters 🏠", topic: "Welfare & India", difficulty: "easy",
    questions: [
      { q: "What is the primary cause of animal shelter overcrowding in India?", options: ["Too many vets","Irresponsible abandonment and lack of spaying/neutering","Too small shelters","Government policy"], correct: 1, explanation: "Abandonment and unrestricted breeding — combined with inadequate adoption rates — cause chronic overcrowding." },
      { q: "What happens at a responsible animal shelter intake?", options: ["Animals are immediately caged","Health check, vaccination, deworming, and temperament assessment","Just fed and sheltered","Immediate adoption listing"], correct: 1, explanation: "Responsible shelters assess health, vaccinate, deworm, and temperament-test before listing for adoption." },
      { q: "What is a 'foster' in pet rescue?", options: ["An adoptive parent","A temporary carer who houses an animal until permanent adoption","A shelter volunteer","The shelter owner"], correct: 1, explanation: "Fosters provide temporary, home-based care — critical to freeing up shelter space and socialising animals." },
      { q: "What is 'adoption fee'?", options: ["A fine","A small fee covering basic vet care given before adoption","A subscription","Shelter profit"], correct: 1, explanation: "Adoption fees typically cover vaccination, sterilisation, microchipping, and deworming costs incurred by the shelter." },
      { q: "What should you bring to an animal shelter adoption event?", options: ["Nothing","ID, proof of address, and questions about the pet's history","Treats only","Cash only"], correct: 1, explanation: "Most shelters require ID to ensure responsible adoption; bringing questions about history, health, and needs is essential." },
    ],
  },
  {
    id: "W43", title: "Gut Health & Probiotics 🦠", topic: "Nutrition & Health", difficulty: "medium",
    questions: [
      { q: "What are probiotics for pets?", options: ["Vitamins","Beneficial bacteria that support gut health","Antibiotics","Digestive enzymes only"], correct: 1, explanation: "Probiotics are live beneficial bacteria that help maintain a healthy gut microbiome in pets." },
      { q: "What can disrupt a pet's gut microbiome?", options: ["Regular feeding","Antibiotics, diet changes, and stress","Exercise","Grooming"], correct: 1, explanation: "Antibiotics, abrupt diet changes, and chronic stress are the top disruptors of gut flora balance." },
      { q: "What is the function of dietary fibre in a dog's diet?", options: ["Just adds bulk","Feeds beneficial gut bacteria and regulates bowel movements","Provides energy","Replaces protein"], correct: 1, explanation: "Fibre feeds beneficial gut bacteria (prebiotic effect) and regulates intestinal transit." },
      { q: "Can dogs eat plain yoghurt as a probiotic?", options: ["No — dairy is always toxic","Yes, unsweetened plain yoghurt with live cultures in small amounts","Always in large amounts","Only specific breeds"], correct: 1, explanation: "Plain, unsweetened yoghurt with live cultures can benefit dog gut health in small amounts." },
      { q: "What does a healthy dog stool look like?", options: ["Always soft and light brown","Firm, moist, log-shaped, dark brown","Runny is normal","Varies wildly — no standard"], correct: 1, explanation: "Healthy dog stool is firm, moist, log-shaped, and dark brown — consistent changes warrant vet attention." },
    ],
  },
  {
    id: "W44", title: "Service Animals 🦮", topic: "Working Animals", difficulty: "medium",
    questions: [
      { q: "What type of dog helps people with visual impairment?", options: ["Therapy dog","Guide dog","Hearing dog","Medical alert dog"], correct: 1, explanation: "Guide dogs (e.g., Labradors, Golden Retrievers) are trained to navigate obstacles and safely guide their blind handlers." },
      { q: "What is a 'therapy animal'?", options: ["A medically trained dog","An animal visiting hospitals/schools to provide comfort","A service animal","A search and rescue dog"], correct: 1, explanation: "Therapy animals are certified to visit facilities like hospitals, schools, and care homes to provide emotional support." },
      { q: "Which breed is most commonly used as a guide dog?", options: ["German Shepherd","Labrador Retriever","Border Collie","Poodle"], correct: 1, explanation: "Labradors are the most commonly used guide dog breed for their temperament, trainability, and reliability." },
      { q: "What is a 'medical alert dog' trained to do?", options: ["Diagnose illness","Alert owners to oncoming medical events (seizures, low blood sugar)","Fetch medication","Work in hospitals"], correct: 1, explanation: "Medical alert dogs are trained to detect physiological changes (scent of hormonal shifts, etc.) before medical events occur." },
      { q: "Are service animals allowed in all public spaces in India?", options: ["No","Yes — per the Rights of Persons with Disabilities Act 2016","Only in airports","Only guide dogs"], correct: 1, explanation: "The RPwD Act 2016 and related guidelines affirm the right of disabled persons to be accompanied by service animals." },
    ],
  },
  {
    id: "W45", title: "Disaster Preparedness 🆘", topic: "Emergency Planning", difficulty: "medium",
    questions: [
      { q: "What should a pet emergency kit include?", options: ["Toys only","Food, water, medications, vet records, ID tag, carrier","Just food","Only their favourite items"], correct: 1, explanation: "A complete kit: 3-day food/water supply, medications, vaccination records, photo ID, and a carrier." },
      { q: "What should you do with your pet during an earthquake?", options: ["Leave them outside","Keep them in a crate or contained to prevent escape panicking","Hold them tightly","Leave the area first"], correct: 1, explanation: "Frightened pets may bolt — a crate or closed room prevents escape. Keep them contained until safe." },
      { q: "Why do pets often go missing during disasters?", options: ["They choose to leave","Loud noises and chaos cause fear-based escape behaviour","They find food elsewhere","They return to nature"], correct: 1, explanation: "Loud thunder, fireworks, and disaster chaos trigger flight responses — the #1 reason pets go missing." },
      { q: "What is the purpose of a pet-safe evacuation plan?", options: ["Legal requirement","Ensuring pets are included in evacuation routes and sheltering arrangements","For insurance purposes","Required by law"], correct: 1, explanation: "Many people refuse to evacuate without their pets — having a plan ensures animals aren't left behind." },
      { q: "What should be on a pet ID tag for disaster preparedness?", options: ["Name only","Name, owner's phone number, alternate contact, and home address","Microchip number only","Breed and colour"], correct: 1, explanation: "A comprehensive tag with multiple contact methods maximises chances of reunification." },
    ],
  },
  {
    id: "W46", title: "Veterinary Technology 💻", topic: "Technology", difficulty: "easy",
    questions: [
      { q: "What is telemedicine in veterinary practice?", options: ["Phone consultations only","Remote video/chat consultations with a vet","Self-diagnosis apps","Insurance claims technology"], correct: 1, explanation: "Vet telemedicine allows remote video or chat consultations — useful for minor concerns, follow-ups, and triage." },
      { q: "What does an ultrasound detect in pets?", options: ["Bone fractures","Soft tissue structures, organ abnormalities, and pregnancy","Blood disorders","Skin infections"], correct: 1, explanation: "Ultrasound images soft tissue — ideal for organs, pregnancy, and conditions invisible on X-rays." },
      { q: "What is a pet wearable/GPS tracker best used for?", options: ["Health monitoring only","Location tracking + activity monitoring","Microchip replacement","Social networking"], correct: 1, explanation: "Modern pet wearables combine GPS tracking with activity, sleep, and health monitoring." },
      { q: "What does 'in-house blood testing' allow vets to do?", options: ["Save money","Get results in minutes instead of days, enabling faster treatment","Replace blood tests","Just for convenience"], correct: 1, explanation: "In-house analysers provide full blood panels in 10–15 minutes, enabling faster diagnosis and treatment." },
      { q: "What is the purpose of dental X-rays in veterinary dentistry?", options: ["To count teeth","To see below the gumline where most dental disease occurs","For cosmetic assessment","Required by law"], correct: 1, explanation: "Over 60% of dental disease is below the gumline — invisible without radiographs." },
    ],
  },
  {
    id: "W47", title: "Paws & Coats 🐾", topic: "Grooming", difficulty: "easy",
    questions: [
      { q: "How often should you bathe a short-haired dog?", options: ["Daily","Every 4–6 weeks or when dirty","Once a year","Never"], correct: 1, explanation: "Short-haired dogs need bathing every 4–6 weeks or when dirty — over-bathing strips natural oils." },
      { q: "What is double-coating in dogs?", options: ["Very thick fur","Two-layer coat: dense undercoat + guard hairs","A genetic mutation","A grooming style"], correct: 1, explanation: "Double-coated breeds (Huskies, Labs) have a dense undercoat for insulation plus protective guard hairs." },
      { q: "Why should you not shave a double-coated dog in summer?", options: ["It grows back different colour","The coat protects against heat AND cold — shaving can damage the undercoat permanently","It's painful","Groomers dislike it"], correct: 1, explanation: "A double coat insulates against both cold and heat — shaving can cause 'post-clipping alopecia' and loss of insulation." },
      { q: "What is the purpose of nail trimming in pets?", options: ["Cosmetic only","Prevents overgrowth causing pain, joint problems, and injuries","To slow their walking","For hygiene only"], correct: 1, explanation: "Overgrown nails cause pain, alter gait, lead to joint issues, and can curl into paw pads." },
      { q: "What causes 'hot spots' in dogs?", options: ["Sunburn","Bacterial skin infection triggered by moisture/scratching","A fungal condition","Fleas only"], correct: 1, explanation: "Hot spots (acute moist dermatitis) occur when bacteria infect skin damaged by scratching, licking, or moisture." },
    ],
  },
  {
    id: "W48", title: "Multi-Pet Households 🏠", topic: "Behaviour & Care", difficulty: "medium",
    questions: [
      { q: "How should you introduce a new cat to an existing cat?", options: ["Just put them together","Gradual scent introduction, then visual meetings, then supervised interaction","Close them in a room together","Feed them from the same bowl immediately"], correct: 1, explanation: "Gradual introduction over 1–2 weeks reduces the chance of serious aggression between cats." },
      { q: "Do dogs and cats naturally get along?", options: ["Always","Never","It depends heavily on early socialisation and individual personalities","Only specific breeds"], correct: 2, explanation: "Dogs and cats can coexist peacefully, especially when introduced young or with proper desensitisation." },
      { q: "What is 'resource guarding' in pets?", options: ["Hiding toys","Aggressive behaviour to protect food, toys, or space","Being territorial around strangers only","A dominance display"], correct: 1, explanation: "Resource guarding involves growling, snapping, or biting to protect valued items — requires careful management in multi-pet homes." },
      { q: "Should multiple cats share one litter box?", options: ["Yes, they won't mind","No — the rule is one box per cat plus one extra","Two cats per box is fine","Cats prefer sharing"], correct: 1, explanation: "The golden rule is n+1 litter boxes (one per cat plus one extra) to prevent territorial conflict." },
      { q: "Which dog breed tends to have the highest prey drive toward small pets?", options: ["Labrador","Terrier breeds and sighthounds","Poodle","Golden Retriever"], correct: 1, explanation: "Terriers were bred to chase and kill small animals; sighthounds have strong visual prey drives — both require caution." },
    ],
  },
  {
    id: "W49", title: "Pet Social Media 📱", topic: "Fun & Digital", difficulty: "easy",
    questions: [
      { q: "Which platform is most popular for pet content?", options: ["LinkedIn","Instagram and TikTok","Twitter","Pinterest"], correct: 1, explanation: "Instagram and TikTok dominate pet content — 'petfluencers' with millions of followers are common." },
      { q: "What is a 'petfluencer'?", options: ["A pet behaviour app","A pet or pet owner with a large social media following","A pet training influencer","A vet on social media"], correct: 1, explanation: "A petfluencer is a pet (or their owner) who has built a large, engaged following on social media." },
      { q: "What is the most-liked photo category on Instagram historically?", options: ["Food","Sunsets","Pets/animals","Travel"], correct: 2, explanation: "Pets and animals consistently rank among the most-liked content categories on Instagram." },
      { q: "What is the annual global celebration 'World Pet Day'?", options: ["14 Feb","11 April","4 October — World Animal Day","1 June"], correct: 1, explanation: "World Pet Day is celebrated on 11 April each year to honour the joy pets bring to our lives." },
      { q: "Which cat was the most-followed animal on Twitter/X?", options: ["Grumpy Cat","Lil Bub","Nyan Cat","Colonel Meow"], correct: 0, explanation: "Grumpy Cat (Tardar Sauce) was the most famous internet cat, spawning memes worldwide." },
    ],
  },
  {
    id: "W50", title: "Climate & Pets ♻️", topic: "Environment", difficulty: "medium",
    questions: [
      { q: "What is the environmental impact of the pet food industry?", options: ["Negligible","Significant — it uses meat that contributes to carbon emissions","Positive — it uses food waste","Only impacts water use"], correct: 1, explanation: "The global pet food industry produces emissions equivalent to a small country due to meat ingredient production." },
      { q: "What is 'sustainable pet food'?", options: ["Expensive pet food","Food using lower carbon-footprint proteins like insect, fish, or plant-based","Organic food only","Homemade food"], correct: 1, explanation: "Sustainable pet food uses alternative proteins (insects, sustainably caught fish, plants) to reduce carbon footprint." },
      { q: "How can pet owners reduce their pet's carbon pawprint?", options: ["Give up pets","Reduce meat-based treats, buy sustainable food, use eco-friendly accessories","Feed less","Only walk locally"], correct: 1, explanation: "Small changes — sustainable food, eco toys, reducing waste — make a meaningful difference at scale." },
      { q: "What is 'invasive species' risk related to pets?", options: ["Pets becoming wild animals","Released/escaped exotic pets disrupting native ecosystems","Pets eating invasive plants","Climate change effects"], correct: 1, explanation: "Released exotic pets (red-eared sliders, Burmese pythons, red-vented bulbuls) have devastated native ecosystems worldwide." },
      { q: "What simple switch reduces plastic waste for pet owners?", options: ["Nothing works","Switching to bulk dry food, compostable waste bags, and refillable toys","Only buying local","Stopping pet ownership"], correct: 1, explanation: "Bulk purchasing, compostable poop bags, and durable refillable toys are easy, high-impact swaps." },
    ],
  },
  {
    id: "W51", title: "Year in Review 🎉", topic: "Fun Mixed", difficulty: "easy",
    questions: [
      { q: "Which vitamin do dogs get from sunlight, like humans?", options: ["Vitamin A","Vitamin C","Vitamin D","Vitamin B12"], correct: 2, explanation: "Dogs synthesize Vitamin D from sunlight exposure, though less efficiently than humans." },
      { q: "What is the average number of puppies in a Labrador litter?", options: ["2–3","5–10","12–15","1–2"], correct: 1, explanation: "Labradors typically have litters of 5–10 puppies, with 7–8 being the most common." },
      { q: "How do dogs detect cancer in humans?", options: ["By sight","Through their extraordinary sense of smell detecting volatile organic compounds","By behaviour","By MRI training"], correct: 1, explanation: "Dogs can detect cancer-associated volatile organic compounds (VOCs) in breath, urine, and blood with remarkable accuracy." },
      { q: "What is the term for a cat's heat cycle?", options: ["Rut","Estrus","Spawning","Diestrus"], correct: 1, explanation: "The feline heat cycle is called estrus — cats are induced ovulators who cycle repeatedly until mated." },
      { q: "How many pet dogs are estimated to live in India?", options: ["5 million","15 million","35 million","88 million"], correct: 3, explanation: "India is estimated to have approximately 88 million dogs — both owned and community animals." },
    ],
  },
  {
    id: "W52", title: "Ultimate Pet Challenge 🏆", topic: "Mixed — All Topics", difficulty: "hard",
    questions: [
      { q: "Which of the following is NOT a symptom requiring emergency vet care?", options: ["Bloated abdomen with distress","Occasional small yawn","Seizure lasting over 5 minutes","Pale or white gums"], correct: 1, explanation: "Occasional yawning is normal. The other three are genuine veterinary emergencies." },
      { q: "What connects all domestic dogs to grey wolves genetically?", options: ["25% shared DNA","They are the same species — Canis lupus familiaris","Dogs are a subspecies of wolf — Canis lupus familiaris","They share 90% DNA only"], correct: 2, explanation: "Domestic dogs are a subspecies of the grey wolf: Canis lupus familiaris." },
      { q: "Which statement about cats is FALSE?", options: ["Cats always land on their feet due to the righting reflex","Cats can be lactose intolerant","Female cats are called 'queens'","All tortoiseshell cats are female"], correct: 0, explanation: "Cats do NOT always land safely — falls from medium heights can injure them more than very high falls." },
      { q: "The 'socialization window' is critical because:", options: ["Puppies learn tricks faster then","Experiences during this period have a disproportionate, lasting effect on personality and fear responses","It's when vaccination starts","Kittens become social only then"], correct: 1, explanation: "The socialization window (3–14 weeks in dogs) shapes lifetime social competency and fear thresholds." },
      { q: "What makes Pawppy unique for Indian pet owners?", options: ["Global pet data","India-specific resources, vet connections, adoption listings, and community features","Only a quiz app","Only a social network"], correct: 1, explanation: "Pawppy combines India-specific pet care resources, adoption, vet finding, community challenges, and education in one platform." },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function nextTuesdayAt9(weeksFromNow = 0) {
  const d = new Date();
  const day = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const daysUntilTuesday = (2 - day + 7) % 7 || 7; // next Tuesday
  d.setDate(d.getDate() + daysUntilTuesday + weeksFromNow * 7);
  d.setHours(9, 0, 0, 0);
  return Timestamp.fromDate(d);
}

function nextMondayAt9(weeksFromNow = 0) {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = (1 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday + weeksFromNow * 7);
  d.setHours(9, 0, 0, 0);
  return Timestamp.fromDate(d);
}

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting full-year seed for project: sweekar-af756\n");

  // ── 1. challenges ── (write to /challenges/)
  console.log("📅 Seeding 52 challenges into /challenges/ ...");
  let challengeBatch = db.batch();
  let challengeCount = 0;
  for (let i = 0; i < 52; i++) {
    const tmpl = CHALLENGES[i % CHALLENGES.length];
    const weekNum = i + 1;
    const startTime = nextTuesdayAt9(i);
    // endTime = start + 6 days 23 hours 59 mins
    const endDate = startTime.toDate();
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 0);
    const endTime = Timestamp.fromDate(endDate);

    const docId = `challenge-${String(weekNum).padStart(2, "0")}`;
    const ref = db.collection("challenges").doc(docId);
    challengeBatch.set(ref, {
      theme: tmpl.theme,
      prompt: tmpl.prompt,
      weekNumber: weekNum,
      isActive: false, // check-and-notify activates automatically when startTime passes
      notificationSent: false,
      entryCount: 0,
      winnerId: null,
      startTime,
      endTime,
    });
    challengeCount++;
    // Firestore batch limit is 500
    if (challengeCount % 499 === 0) {
      await challengeBatch.commit();
      console.log(`  ✓ Committed ${challengeCount} challenges`);
      challengeBatch = db.batch();
    }
  }
  await challengeBatch.commit();
  console.log(`  ✓ All ${challengeCount} challenges written\n`);

  // ── 2. weeklyQuiz ── (write to /weeklyQuiz/)
  console.log("🧠 Seeding 52 quizzes into /weeklyQuiz/ ...");
  let quizBatch = db.batch();
  let quizCount = 0;
  for (let i = 0; i < 52; i++) {
    const quiz = QUIZZES[i % QUIZZES.length];
    const weekNum = i + 1;
    const wId = `${new Date().getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    const startTime = nextMondayAt9(i);
    const endDate = startTime.toDate();
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 0);
    const endTime = Timestamp.fromDate(endDate);

    const docId = `quiz-${String(weekNum).padStart(2, "0")}`;
    const ref = db.collection("weeklyQuiz").doc(docId);
    quizBatch.set(ref, {
      title: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questions: quiz.questions,
      weekNumber: weekNum,
      weekId: wId,
      isActive: false, // check-and-notify activates automatically when startTime passes
      notificationSent: false,
      startTime,
      endTime,
    });
    quizCount++;
    if (quizCount % 499 === 0) {
      await quizBatch.commit();
      console.log(`  ✓ Committed ${quizCount} quizzes`);
      quizBatch = db.batch();
    }
  }
  await quizBatch.commit();
  console.log(`  ✓ All ${quizCount} quizzes written\n`);

  console.log("✅ Seed complete!");
  console.log("\n📌 HOW IT WORKS:");
  console.log("  • All 52 challenges + quizzes are seeded with isActive=false");
  console.log("  • The Netlify check-and-notify function runs hourly and:");
  console.log("    - Activates any doc whose startTime has passed (sets isActive=true, sends push notification)");
  console.log("    - Deactivates any doc whose endTime has passed (sets isActive=false)");
  console.log("  • No manual activation needed — everything runs automatically\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
