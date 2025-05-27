import React from "react";
import {
  CalendarDays,
  Clock,
  ArrowLeft,
  PawPrint,
  MessageSquare,
  Share2,
  Dog,
  Cat,
  Activity,
  HeartPulse,
  Shield,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const blogPosts = [
  {
    slug: "introducing-new-pet-to-household",
    title: "How to Introduce a New Pet to Your Household",
    excerpt:
      "Learn the best practices for introducing a new furry friend to your existing pets and family members.",
    content: `
        <p class="mb-4">Introducing a new pet to your home can be both exciting and challenging. Whether you're bringing home a puppy, kitten, or an adult rescue, proper introduction is key to a harmonious household.</p>
        
        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Prepare Your Home</h3>
        <p class="mb-4">Before bringing your new pet home, make sure you have all the essentials: food and water bowls, bed, toys, and a safe space where they can retreat if feeling overwhelmed. This "safe zone" should be off-limits to other pets.</p>
        
        <div class="bg-lavender-50 p-4 rounded-lg my-6 border-l-4 border-lavender-300">
          <h4 class="font-medium text-lavender-800 mb-2">Pro Tip:</h4>
          <p class="text-lavender-700">Use baby gates to create separate spaces for pets to see and smell each other without direct contact initially. This helps them get accustomed to each other's presence safely.</p>
        </div>
        
        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">First Introductions</h3>
        <p class="mb-4">If you have existing pets, introduce them slowly and in a neutral space, like a room where the resident pet doesn't spend much time. Keep initial interactions short (5-10 minutes) and supervised. Reward calm behavior with treats and praise. Watch for signs of stress or aggression from either animal, such as hissing, growling, or flattened ears.</p>
        
        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Establishing Routine</h3>
        <p class="mb-4">Pets thrive on routine. Establish consistent feeding times, walk schedules, and quiet times to help your new pet adjust more quickly to their new environment. Feed pets in separate areas to prevent food aggression.</p>
        
        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Patience is Key</h3>
        <p class="mb-4">Remember that adjustment periods vary. Some pets may become fast friends within days, while others may take weeks or even months to feel completely at home and comfortable with each other. Don't force interactions and let their relationship develop at its own pace.</p>
      `,
    image:
      "https://images.unsplash.com/photo-1544568100-847a948585b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    author: "Sarah Johnson",
    authorBio:
      "Certified pet behaviorist with 10 years of experience helping families integrate new pets.",
    authorImage: "https://randomuser.me/api/portraits/women/44.jpg",
    date: "2023-05-15",
    readTime: "5 min read",
    category: "Pet Care",
    icon: <PawPrint className="h-5 w-5" />,
    comments: 12,
  },
  {
    slug: "ultimate-guide-to-pet-nutrition",
    title: "The Ultimate Guide to Pet Nutrition",
    excerpt:
      "Discover what your pet really needs in their diet and how to choose the right food for their age and breed.",
    content: `
        <p class="mb-4">Good nutrition is the foundation of your pet's health. This guide will help you understand the essentials of pet nutrition to make informed choices for your furry companion.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Understanding Pet Food Labels</h3>
        <p class="mb-4">Pet food labels can be confusing. Look for a statement from AAFCO (Association of American Feed Control Officials) which indicates the food is complete and balanced. The ingredient list is in descending order by weight, so the first few ingredients are the most important.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Key Nutrients for Pets</h3>
        <ul class="list-disc list-inside mb-4 pl-4">
            <li><strong>Protein:</strong> Essential for muscle development. Look for high-quality sources like chicken, beef, or fish.</li>
            <li><strong>Fats:</strong> Provide energy and support skin and coat health. Omega-3 and Omega-6 fatty acids are crucial.</li>
            <li><strong>Carbohydrates:</strong> A source of energy. Whole grains, potatoes, and peas are common sources.</li>
            <li><strong>Vitamins and Minerals:</strong> Important for various bodily functions, from immune response to bone health.</li>
        </ul>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Choosing the Right Food</h3>
        <p class="mb-4">Consider your pet's age, breed, size, and activity level. Puppies and kittens have different nutritional needs than adult or senior pets. Large breeds may require food formulated to support joint health.</p>
      `,
    image:
      "https://images.unsplash.com/photo-1591769225440-811ad7d6eab2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    author: "Dr. Michael Chen",
    authorBio:
      "A leading veterinarian specializing in animal nutrition with over 15 years of practice.",
    authorImage: "https://randomuser.me/api/portraits/men/32.jpg",
    date: "2023-04-28",
    readTime: "8 min read",
    category: "Nutrition",
    icon: <Dog className="h-5 w-5" />,
    comments: 25,
  },
  {
    slug: "signs-your-dog-needs-training",
    title: "5 Signs Your Dog Might Need Training",
    excerpt:
      "Recognize the behavioral cues that indicate your dog could benefit from professional training.",
    content: `
        <p class="mb-4">While all dogs can benefit from training, certain behaviors are clear indicators that it's time to seek professional help or dedicate more time to training at home.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">1. Excessive Barking or Whining</h3>
        <p class="mb-4">If your dog barks uncontrollably at every sound or whines constantly for attention, it could be a sign of anxiety or a lack of understanding of what's expected of them.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">2. Leash Pulling</h3>
        <p class="mb-4">Walks should be enjoyable for both you and your dog. If your dog is constantly pulling on the leash, it makes walks stressful and can be dangerous.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">3. Jumping on People</h3>
        <p class="mb-4">While often a sign of excitement, jumping on guests can be intimidating and unwelcome. Training can teach your dog more appropriate ways to greet people.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">4. Destructive Chewing</h3>
        <p class="mb-4">If your dog is chewing on furniture, shoes, or other inappropriate items, it could stem from boredom, anxiety, or teething in puppies. Training provides mental stimulation and teaches them what is and isn't a toy.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">5. Ignoring Commands</h3>
        <p class="mb-4">A reliable recall ("come") is crucial for your dog's safety. If your dog consistently ignores basic commands, it's a sign that your training foundation needs to be strengthened.</p>
      `,
    image:
      "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    author: "Robert Davis",
    authorBio:
      "A professional dog trainer and behaviorist with a passion for helping owners build strong bonds with their pets.",
    authorImage: "https://randomuser.me/api/portraits/men/45.jpg",
    date: "2023-04-10",
    readTime: "4 min read",
    category: "Training",
    icon: <Activity className="h-5 w-5" />,
    comments: 18,
  },
  {
    slug: "adoption-story-max",
    title: "Adoption Stories: How Max Found His Forever Home",
    excerpt:
      "Heartwarming story of Max the terrier mix and his journey from shelter dog to beloved family member.",
    content: `
        <p class="mb-4">Every shelter pet has a story. This is the story of Max, a scruffy terrier mix with a heart of gold, and his journey to finding a family to call his own.</p>
        
        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Max's Time at the Shelter</h3>
        <p class="mb-4">Max arrived at the shelter as a stray, scared and shy. For weeks, he would hide in the back of his kennel, avoiding eye contact with potential adopters. Volunteers worked patiently with him, slowly earning his trust with gentle words and tasty treats.</p>
        
        <div class="bg-lavender-50 p-4 rounded-lg my-6 italic">
          <p class="text-lavender-700">"We knew there was a loving dog in there," said one volunteer. "He just needed someone to give him a chance and see past his fear."</p>
        </div>
        
        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">The Day Everything Changed</h3>
        <p class="mb-4">One Saturday, the Wilson family came to the shelter. They weren't looking for a specific breed, just a companion. They saw Max huddled in his corner, and instead of passing him by, they sat on the floor and waited. After a few minutes, Max cautiously crept forward and nudged Mr. Wilson's hand.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">A New Beginning</h3>
        <p class="mb-4">That was the moment. Max went home with the Wilsons that day. The first few weeks were an adjustment, but with love and patience, Max blossomed. He's no longer the scared dog from the shelter; he's a confident, playful, and cherished member of the family. Adoption saves lives and creates beautiful stories like Max's.</p>
      `,
    image:
      "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    author: "Emma Wilson",
    authorBio:
      "A volunteer at the local animal shelter and a passionate advocate for pet adoption.",
    authorImage: "https://randomuser.me/api/portraits/women/55.jpg",
    date: "2023-03-22",
    readTime: "6 min read",
    category: "Adoption",
    icon: <HeartPulse className="h-5 w-5" />,
    comments: 32,
  },
  {
    slug: "cat-behavior-explained",
    title: "Understanding Your Cat's Behavior",
    excerpt:
      "Decode the mysteries behind common feline behaviors and what they're trying to tell you.",
    content: `
        <p class="mb-4">Cats communicate in subtle ways. Understanding their body language and behaviors is key to building a strong bond with your feline friend.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Purring: Not Always a Happy Sound</h3>
        <p class="mb-4">While cats often purr when they are content, they also purr to comfort themselves when they are stressed, in pain, or scared. Pay attention to the context and other body language cues.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Kneading: A Sign of Comfort</h3>
        <p class="mb-4">Often called "making biscuits," kneading is an instinctive behavior from kittenhood associated with nursing. When your cat kneads on you, it's a sign of affection and comfort.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Tail Language</h3>
        <ul class="list-disc list-inside mb-4 pl-4">
            <li><strong>Tail high:</strong> Confident and happy.</li>
            <li><strong>Tail puffed up:</strong> Scared or agitated.</li>
            <li><strong>Tail twitching:</strong> Excited or annoyed.</li>
            <li><strong>Tail wrapped around you:</strong> A sign of friendship and affection.</li>
        </ul>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">The Slow Blink</h3>
        <p class="mb-4">A slow blink from a cat is a sign of trust and affection, often referred to as a "kitty kiss." If a cat slow-blinks at you, try doing it back to show you are relaxed and not a threat.</p>
      `,
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    author: "Lisa Wong",
    authorBio:
      "A feline behavior consultant who helps cat owners understand their mysterious companions.",
    authorImage: "https://randomuser.me/api/portraits/women/68.jpg",
    date: "2023-03-15",
    readTime: "7 min read",
    category: "Behavior",
    icon: <Cat className="h-5 w-5" />,
    comments: 21,
  },
  {
    slug: "pet-safety-tips",
    title: "Essential Pet Safety Tips for New Owners",
    excerpt:
      "Must-know safety precautions to keep your pet out of harm's way in various situations.",
    content: `
        <p class="mb-4">Bringing a new pet home comes with the responsibility of keeping them safe. Here are some essential safety tips to protect your new companion.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Pet-Proofing Your Home</h3>
        <p class="mb-4">Just like with a toddler, you need to pet-proof your living space. Secure loose wires, put away cleaning supplies, and make sure toxic plants are out of reach. Common household plants like lilies, tulips, and aloe vera can be toxic to pets.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Common Household Dangers</h3>
        <div class="bg-red-50 p-4 rounded-lg my-6 border-l-4 border-red-300">
          <h4 class="font-medium text-red-800 mb-2">Warning: Toxic Foods</h4>
          <p class="text-red-700">Many human foods are dangerous for pets. Keep chocolate, grapes, raisins, onions, garlic, and anything containing the sweetener xylitol away from your pets.</p>
        </div>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Car Safety</h3>
        <p class="mb-4">Never leave your pet unattended in a car, as temperatures can rise to dangerous levels quickly. When traveling, secure your pet in a carrier or with a pet seatbelt for their safety and to prevent distracted driving.</p>

        <h3 class="text-xl font-semibold text-lavender-900 mt-6 mb-3">Identification is Key</h3>
        <p class="mb-4">Ensure your pet always wears a collar with an ID tag that has your current phone number. Microchipping is a reliable way to ensure you can be reunited with your pet if they get lost, even if their collar comes off.</p>
      `,
    image:
      "https://images.unsplash.com/photo-1554692918-08fa0fdc9db3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
    author: "David Miller",
    authorBio:
      "An emergency veterinarian with a focus on pet safety and preventative care.",
    authorImage: "https://randomuser.me/api/portraits/men/78.jpg",
    date: "2023-02-28",
    readTime: "5 min read",
    category: "Safety",
    icon: <Shield className="h-5 w-5" />,
    comments: 15,
  },
];

const BlogDetail = () => {
  const { slug } = useParams();

  const post = blogPosts.find((post) => post.slug === slug);

  if (!post) {
    return (
      <div className="bg-lavender-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-lavender-100 inline-flex p-4 rounded-full mb-4">
            <PawPrint className="h-12 w-12 text-lavender-700" />
          </div>
          <h1 className="text-4xl font-bold text-lavender-900 mb-4">
            Post Not Found
          </h1>
          <p className="text-lg text-lavender-700 mb-8">
            The blog post you're looking for doesn't exist or may have been
            moved.
          </p>
          <Link
            to="/blogs"
            className="bg-lavender-600 hover:bg-lavender-700 text-white px-6 py-3 rounded-full font-medium inline-flex items-center transition-colors shadow-soft-md hover:shadow-soft-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to All Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/blogs"
            className="inline-flex items-center text-lavender-600 hover:text-lavender-800 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Blogs
          </Link>
        </div>

        <article className="bg-white rounded-xl shadow-soft-lg p-6 sm:p-8 lg:p-10">
          <div className="mb-6">
            <span className="bg-lavender-100 text-lavender-800 text-sm font-semibold px-3 py-1 rounded-full inline-flex items-center">
              {post.icon}
              <span className="ml-2">{post.category}</span>
            </span>
          </div>

          <h1 className="text-3xl font-bold text-lavender-900 sm:text-4xl lg:text-5xl mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-lavender-600 mb-8 gap-4 sm:gap-6">
            <div className="flex items-center">
              <img
                src={post.authorImage}
                alt={post.author}
                className="h-10 w-10 rounded-full mr-3"
              />
              <div>
                <span className="font-semibold text-lavender-800">
                  {post.author}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-lavender-500">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-1.5" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5" />
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                <span>{post.comments} comments</span>
              </div>
            </div>
          </div>

          <img
            src={post.image}
            alt={post.title}
            className="w-full h-auto max-h-[500px] object-cover rounded-xl mb-8 shadow-md"
          />

          <div
            className="prose max-w-none text-lavender-800 leading-relaxed mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between mb-12 py-6 border-t border-b border-lavender-200 gap-4">
            <span className="text-lavender-700 font-medium">
              Share this article:
            </span>
            <div className="flex space-x-3">
              <button className="p-2 rounded-full bg-lavender-100 text-lavender-700 hover:bg-lavender-200 hover:text-lavender-900 transition-colors">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </button>
              <button className="p-2 rounded-full bg-lavender-100 text-lavender-700 hover:bg-lavender-200 hover:text-lavender-900 transition-colors">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </button>
              <button className="p-2 rounded-full bg-lavender-100 text-lavender-700 hover:bg-lavender-200 hover:text-lavender-900 transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="bg-lavender-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-lavender-900 mb-4">
              About the Author
            </h3>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <img
                src={post.authorImage}
                alt={post.author}
                className="h-24 w-24 rounded-full object-cover shadow-md"
              />
              <div>
                <h4 className="font-bold text-lavender-900 text-lg">
                  {post.author}
                </h4>
                <p className="text-lavender-600 mt-2">{post.authorBio}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogDetail;
