import { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Shield, Clock, Star, Search, PawPrint, Users, Home, Syringe, MessageCircle, MapPin } from 'lucide-react';

const FAQ = () => {
    const [openItems, setOpenItems] = useState({});
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const toggleItem = (categoryIndex, itemIndex) => {
        const key = `${categoryIndex}-${itemIndex}`;
        setOpenItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const categories = [
        {
            id: 'getting-started',
            name: 'Getting Started',
            icon: Home,
            color: 'violet',
            faqs: [
                {
                    question: "How do I create an account on Pawsitive?",
                    answer: "Creating an account is simple! Click the 'Sign Up' button on the homepage, then choose to register with your email and password or use Google Sign-In. After signing up, you'll receive a verification email. Click the link in the email to verify your account and you're all set!"
                },
                {
                    question: "How do I add my first pet?",
                    answer: "After logging in, go to your Profile page and click the '+ Add Pet' button. You'll be guided through a 6-step form where you'll enter: 1) Basic info (name, type, breed), 2) Birth date and gender, 3) Physical details (weight, size, colors), 4) Upload a photo, 5) Set availability for mating/adoption, and 6) Review and save. Each pet gets a unique shareable profile!"
                },
                {
                    question: "Can I install Pawsitive as an app on my phone?",
                    answer: "Yes! Pawsitive is a Progressive Web App (PWA). On iPhone: Open in Safari, tap the Share button, then 'Add to Home Screen'. On Android: Open in Chrome, tap the menu (3 dots), then 'Add to Home Screen' or 'Install App'. You'll get an app icon on your home screen with offline support and push notifications!"
                },
                {
                    question: "What pet types are supported?",
                    answer: "Pawsitive supports all major pet types including Dogs, Cats, Birds, Rabbits, Hamsters, Fish, and Other. We have breed databases with 150+ dog breeds and 100+ cat breeds. For each pet type, we provide species-specific features like age calculators, health templates, and care tips."
                },
                {
                    question: "Is my data safe and private?",
                    answer: "Absolutely! We use Firebase Authentication with industry-standard encryption. All data is stored securely in Firebase's cloud infrastructure. You control your pet profile visibility (Public/Private). We never share your personal information with third parties. Read our Privacy Policy for complete details."
                }
            ]
        },
        {
            id: 'pet-profiles',
            name: 'Pet Profiles & Management',
            icon: PawPrint,
            color: 'purple',
            faqs: [
                {
                    question: "How do I edit my pet's profile?",
                    answer: "Go to your Profile page, find the pet card, and click the 'Edit' button (pencil icon). You can update any information including name, photo, weight, and availability status. Changes are saved instantly to Firebase and reflected across all features."
                },
                {
                    question: "Can I have multiple pets on one account?",
                    answer: "Yes! There's no limit to the number of pets you can add. Each pet gets its own profile, health records, expense tracker, and social feed. You can easily switch between pets using the pet selector on your Profile page."
                },
                {
                    question: "What is a pet slug and how do shareable links work?",
                    answer: "A pet slug is a unique URL-friendly identifier (like 'buddy-abc123') created from your pet's name and ID. Your pet's profile is accessible at pawppy.in/pet/buddy-abc123. You can share this link with anyone, even if they don't have an account. The profile visibility depends on your Public/Private setting."
                },
                {
                    question: "How do I generate and share a QR code for my pet?",
                    answer: "On your pet's profile page, click the 'Share' button, then select 'Generate QR Code'. A QR code will be created instantly. You can download it as an image to print on pet tags, collars, or posters. Anyone scanning the code will be directed to your pet's profile with contact information."
                },
                {
                    question: "Can I delete a pet profile?",
                    answer: "Yes. On your Profile page, click the pet card, then click the 'Delete' button (trash icon). You'll be asked to confirm. Note: This permanently deletes all associated data including health records, posts, events, and expenses. This action cannot be undone."
                },
                {
                    question: "What does 'Available for Mating' or 'Available for Adoption' mean?",
                    answer: "These are toggle switches that make your pet discoverable in the respective features. 'Available for Mating' shows your pet in the Nearby Mates section where other pet owners can send mating requests. 'Available for Adoption' lists your pet in the Adopt Pets section. Turn these off to remove your pet from these listings."
                }
            ]
        },
        {
            id: 'health-tracking',
            name: 'Health & Medical Records',
            icon: Syringe,
            color: 'pink',
            faqs: [
                {
                    question: "How do I add vaccination records?",
                    answer: "On your pet's profile, click 'Vaccinations', then '+ Add Vaccination'. Choose from our pre-loaded list (Rabies, DHPP, FVRCP, etc.) or add a custom vaccine. Enter the last given date and next due date. The system validates that dates are after your pet's birth date and automatically calculates status (Up-to-date, Due Soon, Overdue). You'll receive email reminders 30 days before the due date!"
                },
                {
                    question: "What vaccinations are pre-loaded in the system?",
                    answer: "For Dogs: Rabies, DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza), Bordetella, Leptospirosis, Canine Influenza, Lyme Disease, and more. For Cats: FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia), FeLV (Feline Leukemia), Rabies, Bordetella, Chlamydia. You can also add custom vaccinations for any pet type."
                },
                {
                    question: "How does the vaccination reminder system work?",
                    answer: "Our system automatically checks your pets' vaccination records daily. If a vaccination is due within 30 days or overdue, you'll receive an email reminder with pet details, vaccine name, due date, and importance. A scheduled Netlify function runs at 9 AM IST daily to send these reminders. You can manage notification preferences in your profile settings."
                },
                {
                    question: "Can I track medications for my pet?",
                    answer: "Yes! Click 'Medications' on your pet's profile. Add current medications with name (choose from 13+ pre-loaded options like Heartgard, Frontline, Apoquel), dosage, frequency (once-daily, twice-daily, weekly, etc.), start date, and optional end date. The system will send medication reminders based on the schedule you set."
                },
                {
                    question: "How do I record allergies and medical conditions?",
                    answer: "Click 'Medical History' on your pet's profile. You can add: 1) Allergies - choose from 15+ common allergens (chicken, beef, dairy, grains, pollen, etc.) or add custom ones, 2) Chronic conditions and illnesses, 3) Past surgeries and procedures, 4) Special dietary requirements, 5) Vet visit history and medical notes. This information is displayed when sharing your pet's profile for mating or adoption."
                },
                {
                    question: "Why can't I set a vaccination date before my pet's birth date?",
                    answer: "This is a validation feature to prevent data entry errors. If you try to enter a vaccination date earlier than your pet's date of birth, you'll see an error message. If you need to update your pet's birth date, edit the pet profile first, then update vaccination records."
                }
            ]
        },
        {
            id: 'tracking-features',
            name: 'Weight & Expense Tracking',
            icon: Star,
            color: 'indigo',
            faqs: [
                {
                    question: "How does the weight tracker work?",
                    answer: "Navigate to your pet's profile and click 'Weight Tracker'. Click '+ Add Weight Entry' to log weight with date and optional notes. The system displays: 1) Interactive line chart showing weight trends over time, 2) Ideal weight range based on breed, 3) Trend indicators (gaining/losing/stable), 4) Historical data table with edit/delete options. Great for monitoring health, growth, or diet effectiveness!"
                },
                {
                    question: "How do I track pet expenses?",
                    answer: "Go to your pet's profile and click 'Expense Tracker'. Add expenses by clicking '+ Add Expense'. Choose from 7 categories: Food 🍖, Veterinary 🏥, Grooming ✂️, Toys 🧸, Supplies 🛒, Medical 💊, or Other 📦. Enter amount, date, and optional notes. View spending with: 1) Pie chart breakdown by category, 2) Time filters (All Time, Monthly, Yearly), 3) Statistics (total spent, average expense, count), 4) Category-wise analysis."
                },
                {
                    question: "Can I export my expense data?",
                    answer: "Currently, you can view all expense history in the app with detailed breakdowns. While direct export isn't available yet, you can take screenshots of your expense reports. We're planning to add CSV/PDF export in a future update!"
                },
                {
                    question: "How do I compare multiple pets?",
                    answer: "Use the 'Multi-Pet Compare' feature! Select up to 4 pets from your profile. The comparison shows: 1) Overview (age, weight, breed, gender, size), 2) Health status (vaccinations up-to-date, medications count, allergies, conditions), 3) Expenses (total spending, average expense, category breakdown), 4) Winner highlights for metrics (oldest pet, highest expenses, etc.), 5) Quick insights and recommendations."
                }
            ]
        },
        {
            id: 'age-calculator',
            name: 'Pet Age Calculator',
            icon: Clock,
            color: 'blue',
            faqs: [
                {
                    question: "How does the pet age calculator work?",
                    answer: "Our calculator uses species-specific formulas to convert your pet's age to human years. For Dogs: Year 1 = 15 human years, Year 2 = 9 human years, then 4.5 years per year after. For Cats: Year 1 = 15, Year 2 = 9, then 4 years per year. Simply enter your pet's date of birth (or select from your registered pets), and get instant results with life stage, care tips, and milestone predictions!"
                },
                {
                    question: "What are life stages and why do they matter?",
                    answer: "Life stages help you understand your pet's developmental phase and needs. Stages include: Puppy/Kitten (0-1 year) - rapid growth, socialization; Young (1-3 years) - high energy, training; Adult (3-7 years) - prime health; Mature (7-10 years) - slowing down; Senior (10+ years) - extra care needed; Geriatric (15+ years for dogs, 18+ for cats) - specialized senior care. Each stage includes specific care tips, health recommendations, and what to expect."
                },
                {
                    question: "What are milestones and how are they predicted?",
                    answer: "Milestones are significant life events your pet will experience. The calculator shows: 1) Past milestones - what your pet has already achieved (first year, adulthood, etc.), 2) Current stage - detailed tips for this phase, 3) Future predictions - upcoming milestones with approximate dates, 4) Age conversion reference chart. This helps you prepare for age-related changes and health needs."
                }
            ]
        },
        {
            id: 'social-features',
            name: 'Social Features (Posts & Events)',
            icon: Users,
            color: 'rose',
            faqs: [
                {
                    question: "How do I create posts for my pet?",
                    answer: "On your pet's profile page, go to the 'Posts' tab and click '+ Create Post'. You can: 1) Write text updates, 2) Upload photos or videos (multiple files supported), 3) Add captions and hashtags. Posts appear on your pet's timeline in chronological order. Other users can like and comment on public pet posts!"
                },
                {
                    question: "Can I edit or delete posts?",
                    answer: "Yes! On each post, you'll see a menu button (three dots). Click it to: 1) Edit - modify text or add/remove media, 2) Delete - permanently remove the post. Only you (the pet owner) can edit or delete your pet's posts."
                },
                {
                    question: "What are pet events and how do I add them?",
                    answer: "Pet events are special moments in your pet's life timeline. Click the 'Events' tab on your pet's profile, then '+ Create Event'. Choose event type: Birthday 🎂, Vet Visit 🏥, Grooming ✂️, Training 🎓, Milestone 🏆, or Other 📅. Add title, description, date, and optional photos. Events display on a beautiful visual timeline with date markers and icons!"
                },
                {
                    question: "How does the like and comment system work?",
                    answer: "On any public pet post, click the heart icon to like (unlike by clicking again). The like count updates in real-time. Click 'Comment' to add your thoughts - comments show your name and timestamp. This creates engagement within the Pawsitive community!"
                },
                {
                    question: "Can others see my pet's posts and events?",
                    answer: "This depends on your pet's privacy setting. If set to 'Public', anyone with the profile link can view posts and events. If 'Private', only you can see them. Change this in your pet's profile settings under Privacy Options."
                }
            ]
        },
        {
            id: 'nearby-mates',
            name: 'Finding Nearby Mates',
            icon: Heart,
            color: 'red',
            faqs: [
                {
                    question: "How do I find mating partners for my pet?",
                    answer: "1) First, mark your pet as 'Available for Mating' in their profile. 2) Go to 'Nearby Mates' from the dashboard. 3) Allow location access when prompted. 4) Use filters to narrow search: Pet Type, Gender (opposite of your pet), Age Range (0-20 years), Size (Small/Medium/Large), Breed, and Distance (5-50 km radius). The system shows compatible pets sorted by distance with health verification badges!"
                },
                {
                    question: "How does the matching algorithm work?",
                    answer: "Our smart algorithm filters pets based on: 1) Species compatibility - same pet type, 2) Opposite gender matching, 3) 'Available for Mating' flag must be ON, 4) Location-based filtering using Haversine formula for accurate distance calculation, 5) Health verification - displays vaccination status. You'll see pet cards with photo, name, breed, age (in human years), distance, and health badges."
                },
                {
                    question: "How do I send a mating request?",
                    answer: "Click on a pet card to view their full profile. Review their health records, vaccinations, and details. Click 'Send Mating Request' and write a personalized message explaining why your pets would be a good match. The request is sent to the pet owner who can Accept or Decline. You'll receive email and push notifications when they respond!"
                },
                {
                    question: "Where can I see mating requests I've received?",
                    answer: "Go to your Profile page and click the 'Requests' tab. You'll see two sections: 'Received Requests' (incoming) and 'Sent Requests' (outgoing). Each request shows: sender's profile, their pet's details, custom message, timestamp, and Accept/Decline buttons. Accepting a request automatically creates a conversation for you to discuss further!"
                },
                {
                    question: "What happens after accepting a mating request?",
                    answer: "Once accepted: 1) Both users receive notifications, 2) A conversation is automatically created in the 'Messages' tab, 3) You can chat in real-time to coordinate meeting, health checks, and breeding details, 4) The request status changes to 'Accepted', 5) Either party can message anytime through the conversation thread."
                },
                {
                    question: "Why am I not seeing any nearby mates?",
                    answer: "Check these: 1) Location permission - ensure browser/app has location access, 2) Your pet's 'Available for Mating' must be ON, 3) Increase search radius if in a less populated area, 4) Adjust filters - try 'All Ages' or 'All Sizes', 5) Verify there are other users with available pets in your area. The feature requires at least 2 users with available pets within the search radius."
                }
            ]
        },
        {
            id: 'adoption',
            name: 'Pet Adoption',
            icon: Home,
            color: 'green',
            faqs: [
                {
                    question: "How do I list my pet for adoption?",
                    answer: "In your pet's profile, toggle ON the 'Available for Adoption' switch. Your pet will immediately appear in the 'Adopt Pets' section for other users to discover. Make sure to: 1) Upload clear, recent photos, 2) Complete health records (vaccinations, medical history), 3) Add a detailed description, 4) Set profile to 'Public' so potential adopters can view full details."
                },
                {
                    question: "How do I browse pets available for adoption?",
                    answer: "Click 'Adopt a Pet' from your dashboard. Use filters to find your perfect match: 1) Location (5-50 km radius from you), 2) Pet Type, 3) Breed preferences, 4) Age range, 5) Size category, 6) Gender. Browse pet cards showing photos, current location, distance from you, health status, and owner information. Click any card to view complete details including health records!"
                },
                {
                    question: "How do I inquire about adopting a pet?",
                    answer: "1) Click on a pet you're interested in, 2) Review all details including health records, vaccinations, and medical history, 3) Click 'Contact Owner' or 'Send Adoption Inquiry', 4) Write a personalized message introducing yourself, explaining why you'd be a great pet parent, and any questions you have, 5) The message goes directly to the current owner who can respond via the Messages tab."
                },
                {
                    question: "What information should I include in an adoption inquiry?",
                    answer: "Be thorough and genuine: 1) Introduce yourself and your family, 2) Describe your living situation (house/apartment, yard, etc.), 3) Pet ownership experience, 4) Why you want to adopt this specific pet, 5) How you'll care for the pet (time, resources, commitment), 6) Questions about the pet's behavior, preferences, health needs. Current owners appreciate detailed, thoughtful inquiries!"
                },
                {
                    question: "What is the adoption process?",
                    answer: "After sending an inquiry: 1) Current owner reviews and responds via Messages, 2) You chat to discuss pet details, compatibility, and answer questions, 3) Arrange a meet-and-greet (virtual or in-person), 4) If both parties agree, coordinate adoption logistics, 5) Complete any necessary paperwork offline, 6) The current owner can transfer or delete the pet profile once adoption is finalized. Pawsitive facilitates connection; the adoption agreement happens between parties."
                },
                {
                    question: "Can I remove my pet from adoption listings?",
                    answer: "Yes! Simply go to your pet's profile and toggle OFF 'Available for Adoption'. Your pet will immediately be removed from the adoption section. You can toggle it back ON anytime if circumstances change."
                }
            ]
        },
        {
            id: 'lost-found',
            name: 'Lost & Found Pets',
            icon: MapPin,
            color: 'orange',
            faqs: [
                {
                    question: "How do I report a lost pet?",
                    answer: "1) Click 'Lost & Found' from dashboard, then 'Report Lost Pet'. 2) Complete the 6-step form: Step 1 - Pet type, name, age, gender; Step 2 - Physical description (breed, colors, size, weight, distinctive features like scars, collar); Step 3 - Last seen date, time, and location (use Google Maps to pinpoint exact spot); Step 4 - Upload up to 5 clear photos; Step 5 - Microchip info and medical needs; Step 6 - Your contact details and reward info. Submit and our matching algorithm runs instantly!"
                },
                {
                    question: "What is the smart matching algorithm and how does it work?",
                    answer: "Our 100-point confidence scoring system compares lost pets with found pet reports: Pet Type Match (30 pts), Breed Match (20 pts - recognizes similar breeds like 'Lab' and 'Labrador Retriever'), Color Match (15 pts - primary + secondary), Location & Time Proximity (15 pts - closer distance & recent reports score higher), Size Match (10 pts), Gender Match (10 pts), Distinctive Features Bonus (10 pts), and MICROCHIP MATCH (instant 100% if numbers match). Results show match percentage with color coding: Green >70%, Yellow 40-70%, Red <40%."
                },
                {
                    question: "How do I report a found pet?",
                    answer: "Click 'Lost & Found', then 'Report Found Pet'. Fill the 6-step form: Step 1 - Pet type, approximate age, gender if known; Step 2 - Physical description (approximate breed, colors, size, distinctive features); Step 3 - Found date, time, location (GPS coordinates); Step 4 - Upload photos showing the pet's current condition; Step 5 - Identification check (did you find a microchip? collar? tag? name?); Step 6 - Your contact info and where pet is currently staying. The system suggests potential matches immediately!"
                },
                {
                    question: "How do I browse lost pet reports?",
                    answer: "Go to 'Lost & Found' → 'Browse Lost Pets'. Use filters: Pet Type, Date Reported (last 7/30/90 days), Distance from your location, Status (Lost/Reunited). Sort by: Newest, Distance, or Date Last Seen. Each report shows photos, description, last seen info, and contact button. Click any report for full details including all photos, physical characteristics, location map, microchip info, and contact details."
                },
                {
                    question: "What should I do if I find a match?",
                    answer: "1) Review the match score and detailed comparison, 2) Click 'Contact Owner' or 'Contact Finder', 3) This opens a direct message thread, 4) Share specific details to verify (distinctive features, collar description, behavior), 5) Arrange a safe meeting in a public place if details match, 6) Verify identity with microchip scan if available, 5) Once reunited, update the report status to 'Reunited' so others know the happy ending!"
                },
                {
                    question: "Can I view lost and found reports on a map?",
                    answer: "Yes! Go to 'Lost & Found' → 'Map View'. You'll see Google Maps with color-coded markers: Red markers 🔴 for lost pets, Green markers 🟢 for found pets. Click any marker to see a summary popup with pet photo, basic info, and 'View Details' button. Use the filter to show only lost, only found, or both. This visual view helps identify patterns and proximity!"
                },
                {
                    question: "What if my pet is microchipped?",
                    answer: "Microchip info is CRITICAL! In the report form, indicate 'Yes' for microchipped and enter the number. In our matching algorithm, matching microchip numbers give an instant 100% confidence score - a guaranteed match! Even if you don't remember the number, indicate it's microchipped so finders know to check. Most vets and shelters can scan for free."
                },
                {
                    question: "How long do reports stay active?",
                    answer: "Reports remain active indefinitely until you mark them as 'Reunited' or delete them. We recommend updating status promptly so the community knows the outcome. Active reports continue to be matched against new submissions automatically."
                },
                {
                    question: "Can I edit a lost/found report after submitting?",
                    answer: "Yes! Open the report details and click 'Edit' (if you're the original reporter). You can update any information, add more photos, or change contact details. You can also change the status to 'Reunited' or delete the report entirely."
                }
            ]
        },
        {
            id: 'resources',
            name: 'Pet Resources & Services',
            icon: MapPin,
            color: 'teal',
            faqs: [
                {
                    question: "What pet services are available in the Resources section?",
                    answer: "We've curated 150+ pet services across categories: DOG SERVICES - Health & Wellness (vets, hospitals, emergency care), Training & Behavior (obedience schools, behavior consultants), Grooming & Spa (full-service, mobile groomers), Supplies & Stores (food, toys, accessories); CAT SERVICES - Health & Wellness (feline-only clinics), Grooming & Care, Supplies (litter, furniture, toys); GENERAL - Pet Boarding, Pet Hotels, Emergency Vets, Adoption Centers. Each listing includes address, phone, website, hours, services, and ratings!"
                },
                {
                    question: "How do I find pet services near me?",
                    answer: "1) Go to 'Resources' from dashboard, 2) Allow location access for distance-based results, 3) Choose category tab (Dog Services, Cat Services, General), 4) Select subcategory filter (Health, Training, Grooming, etc.), 5) Use search bar for keywords (e.g., '24-hour vet'), 6) Filter by: Distance, Rating, Open Now. Services are displayed as cards with photos, ratings, distance from you, and quick contact buttons (Call, Website, Directions)."
                },
                {
                    question: "How do I contact a service provider?",
                    answer: "Each service card has quick action buttons: 📞 Call - opens phone dialer with number, 🌐 Website - opens their website in new tab, 🗺️ Directions - opens Google Maps with navigation to location. Click the card for full details including business hours, complete service list, reviews, photo gallery, and pricing if available."
                },
                {
                    question: "Can I leave reviews for services?",
                    answer: "Review functionality for service providers is currently in development! We're planning to add: star ratings, written reviews, photo uploads, and helpful/not helpful voting. This will help the community make informed decisions. Stay tuned for updates!"
                },
                {
                    question: "How do I add a new service to the directory?",
                    answer: "Service provider listings are currently curated by our team to ensure quality and accuracy. If you know a great pet service that should be listed, use the 'Contact Us' page to submit their details. We'll review and add qualifying services to help grow the community resource!"
                }
            ]
        },
        {
            id: 'pet-friendly-places',
            name: 'Pet-Friendly Places',
            icon: MapPin,
            color: 'lime',
            faqs: [
                {
                    question: "What are Pet-Friendly Places and why tag them?",
                    answer: "Pet-Friendly Places is a community-driven map where users tag locations that welcome pets! Tag places in 8 categories: Parks 🌳 (dog parks, walking trails), Shelters 🏠, Veterinary Clinics 🏥, Pet Stores 🛍️, Pet-Friendly Cafes ☕, Grooming Services ✂️, Pet Hospitals ⚕️, and Other 📍. This crowdsourced map helps pet owners discover new places to visit with their furry friends!"
                },
                {
                    question: "How do I tag a new pet-friendly place?",
                    answer: "1) Go to 'Pet-Friendly Places' from dashboard, 2) Click '+ Tag New Place', 3) Search for the location using Google Places API (auto-suggests as you type), 4) Select from suggestions - name, address, and coordinates auto-fill, 5) Choose category (Parks, Cafes, etc.), 6) Rate pet-friendliness (1-5 stars), 7) Upload photos showing why it's pet-friendly, 8) Add description/comment (e.g., 'Has water bowls and shade!'), 9) Submit! The place appears on the map instantly."
                },
                {
                    question: "How do I view tagged places on the map?",
                    answer: "The map shows color-coded markers by category: 🟢 Green - Parks, 🔵 Blue - Vet Clinics, 🟠 Orange - Pet Stores, 🟣 Purple - Cafes, 🔴 Red - Emergency Hospitals, ⚫ Black - Shelters, 🟡 Yellow - Grooming, ⚪ Gray - Other. Click any marker to see an info window with: place name, category, pet-friendly rating, user comment, who tagged it, and 'View Details' button. Use category filters to show/hide specific types!"
                },
                {
                    question: "Can I see who tagged a place?",
                    answer: "Yes! Each tagged place shows the user who added it (their email/name). This creates accountability and allows you to thank community members for helpful contributions. If you have questions about a place, you could potentially reach out to the tagger."
                },
                {
                    question: "What if a place is no longer pet-friendly?",
                    answer: "Use the 'Report Incorrect Information' feature (coming soon) or contact us via the Contact Us page. We'll review and update or remove the listing. Community accuracy is important to us!"
                },
                {
                    question: "Can I search for specific places or filter by category?",
                    answer: "Yes! The map interface includes: 1) Search bar - find places by name, 2) Category filters - show only Parks, or only Cafes, etc., 3) Nearby filter - show places within X km of current location, 4) Distance display - see how far each place is from you. This makes it easy to find exactly what you're looking for!"
                }
            ]
        },
        {
            id: 'messaging',
            name: 'Messaging & Communication',
            icon: MessageCircle,
            color: 'cyan',
            faqs: [
                {
                    question: "How does the messaging system work?",
                    answer: "Pawsitive has real-time in-app messaging! Conversations are created automatically when: 1) You accept a mating request, 2) Someone responds to your adoption inquiry, 3) You contact a lost/found pet reporter, 4) Direct messages from pet profiles (if enabled). Go to Profile → Messages tab to see all conversations. Messages update in real-time using Firebase listeners - no need to refresh!"
                },
                {
                    question: "Where can I view my messages?",
                    answer: "All messages are in one place: Your Profile page → 'Messages' tab. You'll see: 1) Conversation list with user avatars, 2) Last message preview, 3) Unread indicators (bold text + count), 4) Timestamp ('2h ago', 'Yesterday'), 5) Pet context (which pet the conversation is about). Click any conversation to open the message thread and chat in real-time!"
                },
                {
                    question: "How do I send a message?",
                    answer: "1) Open a conversation from your Messages tab, 2) Type your message in the input box at the bottom, 3) Press Enter or click Send. Your message appears instantly on both sides using Firebase real-time sync. You'll see: your message, timestamp, and read status (planned feature)."
                },
                {
                    question: "Will I get notified of new messages?",
                    answer: "Yes! When you receive a message: 1) Push notification (if you've allowed notifications), 2) Email notification (if enabled in preferences), 3) Badge counter on app icon increases, 4) Red dot on Messages tab, 5) Unread count in conversation list. Click the conversation to mark messages as read and clear notifications."
                },
                {
                    question: "Can I search my conversations?",
                    answer: "A search feature for conversations is planned! Currently, you can scroll through your conversation list. Most recent messages appear at the top. We're working on adding search by user name, pet name, or message content."
                },
                {
                    question: "How do I block or report someone?",
                    answer: "User safety features including block and report are in development. If you experience harassment or inappropriate behavior, please contact us immediately via the Contact Us page with conversation details. We take community safety seriously."
                }
            ]
        },
        {
            id: 'notifications',
            name: 'Notifications & Reminders',
            icon: Shield,
            color: 'amber',
            faqs: [
                {
                    question: "What types of notifications will I receive?",
                    answer: "You'll receive notifications for: 1) HEALTH REMINDERS - Vaccinations due within 30 days, Medication schedules, Overdue health checkups; 2) SOCIAL - New mating requests, Mating request responses, Adoption inquiries, New messages; 3) MILESTONES - Pet birthdays (3 days before), Age milestone achievements; 4) LOST & FOUND - Potential matches for your reports. Notifications come via Email, Push (if enabled), and In-App."
                },
                {
                    question: "How do email reminders work?",
                    answer: "A scheduled function runs daily at 9:00 AM IST checking all pets: 1) Scans vaccination records for due dates within 30 days or overdue, 2) Checks for upcoming birthdays (3 days before), 3) Identifies health checkups overdue by 6+ months, 4) Sends beautiful HTML email with pet photo, specific details, and importance explanation. Emails use EmailJS service and include direct links to update records or book appointments!"
                },
                {
                    question: "Can I customize notification preferences?",
                    answer: "Yes! Go to Profile → Settings (coming soon). You'll be able to control: 1) Email notifications ON/OFF for each type (mating requests, adoption inquiries, messages, vaccinations, nearby mates), 2) Push notifications ON/OFF per type, 3) Notification frequency (instant, daily digest, weekly), 4) Quiet hours (no notifications during sleep time). Default is all notifications enabled."
                },
                {
                    question: "What is the app badge counter?",
                    answer: "If you've installed Pawsitive as a PWA, you'll see a red badge with a number on the app icon showing unread notifications. This uses the Badge API. The counter increases with: new messages, mating requests, adoption inquiries. View your notifications to clear the badge. The service worker keeps this updated even when the app is closed!"
                },
                {
                    question: "Why didn't I receive a notification?",
                    answer: "Check these: 1) Notification preferences - ensure they're enabled, 2) Email - check spam/junk folders, add notifications@pawsitive.in to contacts, 3) Push - allow notification permission in browser/app settings, 4) Internet connection - offline status delays notifications, 5) EmailJS limits - free tier has 200 emails/month. Contact support if issues persist."
                },
                {
                    question: "How do I turn off all notifications?",
                    answer: "You can disable: 1) Email - go to Profile → Settings → Notifications → toggle OFF all email types, 2) Push - revoke notification permission in browser settings (Settings → Privacy → Notifications → find pawppy.in → Block), 3) Badge - disable in browser settings or uninstall PWA. Note: You'll still see in-app notifications when you open the app."
                }
            ]
        },
        {
            id: 'technical',
            name: 'Technical & Troubleshooting',
            icon: Shield,
            color: 'gray',
            faqs: [
                {
                    question: "What browsers are supported?",
                    answer: "Pawsitive works best on modern browsers: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+. For the best experience with PWA features (install, offline support, push notifications), we recommend Chrome on Android and Safari on iOS. Internet Explorer is NOT supported."
                },
                {
                    question: "Why is the app asking for location permission?",
                    answer: "Location is needed for: 1) Nearby Mates - find local mating partners within your radius, 2) Adopt Pets - discover adoptable pets near you, 3) Lost & Found - accurate location reporting and distance calculation, 4) Resources - find nearest pet services, 5) Pet-Friendly Places - tag and discover local spots. You can deny permission, but these features won't work. We never track or store your location continuously - only when you use these features!"
                },
                {
                    question: "How do I clear my browser cache?",
                    answer: "If experiencing issues: Chrome - Settings → Privacy and Security → Clear Browsing Data → select Cached images and files → Clear data. Safari - Preferences → Privacy → Manage Website Data → find pawppy.in → Remove. Firefox - Settings → Privacy & Security → Cookies and Site Data → Clear Data. Then refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)."
                },
                {
                    question: "Why are my photos not uploading?",
                    answer: "Check: 1) File size - max 5MB per image, compress large photos first, 2) File type - only JPG, JPEG, PNG allowed, 3) Internet connection - stable connection required, 4) Browser permissions - allow file uploads in browser settings, 5) Firebase Storage quota - unlikely but possible. If issues persist, try a different browser or device."
                },
                {
                    question: "The app is loading slowly. What can I do?",
                    answer: "Speed tips: 1) Check internet connection - minimum 3G recommended, 2) Clear browser cache (see above), 3) Close other browser tabs to free memory, 4) Update browser to latest version, 5) If using PWA, reinstall it, 6) Disable browser extensions that might interfere, 7) Try incognito/private mode to rule out extension conflicts. Our servers (Netlify + Firebase) are optimized for speed!"
                },
                {
                    question: "I forgot my password. How do I reset it?",
                    answer: "On the login page, click 'Forgot Password?' below the password field. Enter your registered email and click 'Send Reset Link'. Check your email (including spam folder) for a password reset link from Firebase. Click the link, enter a new password (min 6 characters), and confirm. You can now log in with your new password!"
                },
                {
                    question: "Can I change my email address?",
                    answer: "Email address change is managed through Firebase Authentication. Currently, you'd need to: 1) Create a new account with the desired email, 2) Manually recreate pet profiles, or 3) Contact our support team who can help migrate your data. We're working on adding email change functionality directly in the app!"
                },
                {
                    question: "How do I delete my account?",
                    answer: "Account deletion is permanent and removes ALL data including pets, posts, messages, and records. To delete: 1) Contact us via Contact Us page requesting account deletion, 2) Verify your identity via email, 3) We'll process deletion within 7 days, 4) You'll receive confirmation email. This complies with GDPR right to erasure. Alternatively, self-service deletion is coming to Profile → Settings."
                },
                {
                    question: "Is my data backed up?",
                    answer: "Yes! All data is stored on Firebase Cloud infrastructure with: 1) Automatic daily backups, 2) 99.95% uptime SLA, 3) Geographic redundancy across multiple data centers, 4) Point-in-time recovery capabilities. Your pet profiles, health records, photos (Firebase Storage), and messages are safe. We recommend periodically taking screenshots of important records for your personal files!"
                },
                {
                    question: "Why can't I access certain features?",
                    answer: "Features may be unavailable if: 1) You're not logged in (most features require authentication), 2) Your profile is incomplete (add at least one pet), 3) Network issues (check connection), 4) Browser compatibility (update browser), 5) Feature is in development (check roadmap). Protected routes redirect to login if not authenticated. If blocked unexpectedly, try logging out and back in."
                }
            ]
        }
    ];

    // Filter categories based on search query
    const filteredCategories = categories.map(category => ({
        ...category,
        faqs: category.faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => 
        activeCategory === 'all' 
            ? category.faqs.length > 0 
            : category.id === activeCategory
    );

    const totalFAQs = categories.reduce((sum, cat) => sum + cat.faqs.length, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-lavender-50 to-violet-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white py-8 md:py-16">
                <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
                    <div className="flex justify-center mb-3 md:mb-4">
                        <Heart className="w-8 h-8 md:w-12 md:h-12 text-pink-200" />
                    </div>
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-sm md:text-xl text-purple-100 max-w-2xl mx-auto mb-4 md:mb-8 px-2">
                        Everything you need to know about using Pawsitive
                    </p>
                    
                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto relative">
                        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 text-sm md:text-base rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Banner */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100">
                <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 text-center">
                        <div className="flex flex-col items-center">
                            <Shield className="w-6 h-6 md:w-10 md:h-10 text-purple-600 mb-1 md:mb-3" />
                            <h3 className="font-semibold text-purple-900 mb-0.5 md:mb-1 text-xs md:text-base">{totalFAQs} Questions</h3>
                            <p className="text-purple-600 text-xs md:text-sm hidden md:block">Comprehensive guides</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <Clock className="w-6 h-6 md:w-10 md:h-10 text-purple-600 mb-1 md:mb-3" />
                            <h3 className="font-semibold text-purple-900 mb-0.5 md:mb-1 text-xs md:text-base">12 Categories</h3>
                            <p className="text-purple-600 text-xs md:text-sm hidden md:block">Organized topics</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <Star className="w-6 h-6 md:w-10 md:h-10 text-purple-600 mb-1 md:mb-3" />
                            <h3 className="font-semibold text-purple-900 mb-0.5 md:mb-1 text-xs md:text-base">Step-by-Step</h3>
                            <p className="text-purple-600 text-xs md:text-sm hidden md:block">Detailed instructions</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <Search className="w-6 h-6 md:w-10 md:h-10 text-purple-600 mb-1 md:mb-3" />
                            <h3 className="font-semibold text-purple-900 mb-0.5 md:mb-1 text-xs md:text-base">Searchable</h3>
                            <p className="text-purple-600 text-xs md:text-sm hidden md:block">Find answers fast</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Pills */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-3 md:px-6 py-3 md:py-4">
                    {/* Mobile: Dropdown Select */}
                    <div className="md:hidden">
                        <label className="sr-only">Select Category</label>
                        <select
                            value={activeCategory}
                            onChange={(e) => setActiveCategory(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-purple-200 text-purple-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a855f7'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '1.25rem 1.25rem',
                                paddingRight: '2.5rem'
                            }}
                        >
                            <option value="all">📚 All Topics ({totalFAQs})</option>
                            {categories.map((category) => {
                                const count = category.faqs.filter(faq =>
                                    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
                                ).length;
                                
                                if (searchQuery && count === 0) return null;
                                
                                const emoji = {
                                    'getting-started': '🏠',
                                    'pet-profiles': '🐾',
                                    'health-tracking': '💉',
                                    'tracking-features': '⭐',
                                    'age-calculator': '⏰',
                                    'social-features': '👥',
                                    'nearby-mates': '❤️',
                                    'adoption': '🏡',
                                    'lost-found': '📍',
                                    'resources': '🗺️',
                                    'pet-friendly-places': '🌳',
                                    'messaging': '💬',
                                    'notifications': '🔔',
                                    'technical': '🛡️'
                                }[category.id] || '📋';
                                
                                return (
                                    <option key={category.id} value={category.id}>
                                        {emoji} {category.name} ({count})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    
                    {/* Desktop: Pills */}
                    <div className="hidden md:flex flex-wrap gap-2 justify-center">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeCategory === 'all'
                                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg'
                                    : 'bg-white/70 text-purple-700 hover:bg-purple-100'
                            }`}
                        >
                            All Topics
                        </button>
                        {categories.map((category) => {
                            const Icon = category.icon;
                            const count = category.faqs.filter(faq =>
                                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length;
                            
                            if (searchQuery && count === 0) return null;
                            
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                        activeCategory === category.id
                                            ? `bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 text-white shadow-lg`
                                            : 'bg-white/70 text-purple-700 hover:bg-purple-100'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {category.name}
                                    {searchQuery && count > 0 && (
                                        <span className="ml-1 px-2 py-0.5 rounded-full bg-white/30 text-xs">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* FAQ Sections */}
            <div className="max-w-6xl mx-auto px-3 md:px-6 py-6 md:py-12">
                {searchQuery && filteredCategories.every(cat => cat.faqs.length === 0) && (
                    <div className="text-center py-12 md:py-16">
                        <Search className="w-12 h-12 md:w-16 md:h-16 text-purple-300 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-xl md:text-2xl font-bold text-purple-900 mb-2">No results found</h3>
                        <p className="text-sm md:text-base text-purple-600 mb-4 md:mb-6 px-4">
                            Try different keywords or browse categories
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-sm md:text-base"
                        >
                            Clear Search
                        </button>
                    </div>
                )}

                {filteredCategories.map((category, categoryIndex) => {
                    if (category.faqs.length === 0) return null;
                    
                    const Icon = category.icon;
                    
                    return (
                        <div key={category.id} className="mb-8 md:mb-12">
                            {/* Category Header */}
                            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-${category.color}-400 to-${category.color}-600 flex items-center justify-center shadow-lg flex-shrink-0`}>
                                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg md:text-2xl font-bold text-purple-900">{category.name}</h2>
                                    <p className="text-purple-600 text-xs md:text-sm">{category.faqs.length} questions</p>
                                </div>
                            </div>

                            {/* FAQ Items */}
                            <div className="space-y-3 md:space-y-4">
                                {category.faqs.map((item, itemIndex) => {
                                    const key = `${categoryIndex}-${itemIndex}`;
                                    const isOpen = openItems[key];
                                    
                                    // Highlight search terms
                                    const highlightText = (text) => {
                                        if (!searchQuery) return text;
                                        const regex = new RegExp(`(${searchQuery})`, 'gi');
                                        const parts = text.split(regex);
                                        return parts.map((part, i) => 
                                            regex.test(part) ? 
                                                <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
                                                part
                                        );
                                    };
                                    
                                    return (
                                        <div
                                            key={itemIndex}
                                            className="bg-white/70 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-md md:shadow-lg border border-purple-100 overflow-hidden transition-all duration-300 hover:shadow-xl"
                                        >
                                            <button
                                                onClick={() => toggleItem(categoryIndex, itemIndex)}
                                                className={`w-full px-4 md:px-8 py-4 md:py-6 text-left flex justify-between items-start gap-3 md:gap-4 transition-all duration-300 ${
                                                    isOpen 
                                                        ? 'bg-gradient-to-r from-purple-100 to-violet-100' 
                                                        : 'bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100'
                                                }`}
                                            >
                                                <h3 className="text-sm md:text-lg font-semibold text-purple-900 flex-1 leading-snug">
                                                    {highlightText(item.question)}
                                                </h3>
                                                <div className="flex-shrink-0 mt-0.5 md:mt-1">
                                                    {isOpen ? (
                                                        <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                                                    )}
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="px-4 md:px-8 py-4 md:py-6 bg-white/50">
                                                    <p className="text-purple-800 leading-relaxed text-sm md:text-base">
                                                        {highlightText(item.answer)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Contact Support Section */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white py-12 md:py-16">
                <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
                    <MessageCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-purple-200" />
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Still have questions?</h2>
                    <p className="text-base md:text-xl text-purple-100 mb-6 md:mb-8 px-2">
                        Can't find the answer? Our support team is here to help!
                    </p>
                    <a
                        href="/contact-us"
                        className="inline-block px-6 md:px-8 py-3 md:py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105 text-sm md:text-base"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FAQ;