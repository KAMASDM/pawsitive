import React from "react";
import {
  CalendarDays,
  User,
  PawPrint,
  Dog,
  Cat,
  Activity,
  HeartPulse,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

const blogPosts = [
  {
    slug: "introducing-new-pet-to-household",
    title: "How to Introduce a New Pet to Your Household",
    excerpt:
      "Learn the best practices for introducing a new furry friend to your existing pets and family members.",
    image:
      "https://images.unsplash.com/photo-1544568100-847a948585b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    author: "Sarah Johnson",
    date: "2023-05-15",
    readTime: "5 min read",
    category: "Pet Care",
    icon: <PawPrint className="h-5 w-5" />,
  },
  {
    slug: "ultimate-guide-to-pet-nutrition",
    title: "The Ultimate Guide to Pet Nutrition",
    excerpt:
      "Discover what your pet really needs in their diet and how to choose the right food for their age and breed.",
    image:
      "https://images.unsplash.com/photo-1591769225440-811ad7d6eab2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    author: "Dr. Michael Chen",
    date: "2023-04-28",
    readTime: "8 min read",
    category: "Nutrition",
    icon: <Dog className="h-5 w-5" />,
  },
  {
    slug: "signs-your-dog-needs-training",
    title: "5 Signs Your Dog Might Need Training",
    excerpt:
      "Recognize the behavioral cues that indicate your dog could benefit from professional training.",
    image:
      "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    author: "Robert Davis",
    date: "2023-04-10",
    readTime: "4 min read",
    category: "Training",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    slug: "adoption-story-max",
    title: "Adoption Stories: How Max Found His Forever Home",
    excerpt:
      "Heartwarming story of Max the terrier mix and his journey from shelter dog to beloved family member.",
    image:
      "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    author: "Emma Wilson",
    date: "2023-03-22",
    readTime: "6 min read",
    category: "Adoption",
    icon: <HeartPulse className="h-5 w-5" />,
  },
  {
    slug: "cat-behavior-explained",
    title: "Understanding Your Cat's Behavior",
    excerpt:
      "Decode the mysteries behind common feline behaviors and what they're trying to tell you.",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    author: "Lisa Wong",
    date: "2023-03-15",
    readTime: "7 min read",
    category: "Behavior",
    icon: <Cat className="h-5 w-5" />,
  },
  {
    slug: "pet-safety-tips",
    title: "Essential Pet Safety Tips for New Owners",
    excerpt:
      "Must-know safety precautions to keep your pet out of harm's way in various situations.",
    image:
      "https://images.unsplash.com/photo-1554692918-08fa0fdc9db3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    author: "David Miller",
    date: "2023-02-28",
    readTime: "5 min read",
    category: "Safety",
    icon: <Shield className="h-5 w-5" />,
  },
];

const Blogs = () => {
  return (
    <div className="bg-lavender-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-lavender-900 sm:text-4xl">
            <PawPrint className="inline mr-2 h-8 w-8 text-lavender-700" />
            Pawppy Blogs
          </h2>
          <p className="mt-4 text-lg text-lavender-700 max-w-3xl mx-auto">
            Expert advice, heartwarming stories, and the latest in pet care from
            our community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <div
              key={post.slug}
              className="bg-white rounded-xl shadow-soft-md hover:shadow-soft-lg transition-shadow overflow-hidden flex flex-col h-full"
            >
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center mb-3">
                  <span className="bg-lavender-100 text-lavender-800 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center">
                    {post.icon}
                    <span className="ml-1">{post.category}</span>
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-lavender-900 mb-2">
                  {post.title}
                </h3>
                <p className="text-lavender-700 mb-4 flex-grow">
                  {post.excerpt}
                </p>
                <div className="flex items-center text-sm text-lavender-600 mt-auto">
                  <div className="flex items-center mr-4">
                    <User className="h-4 w-4 mr-1" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    <span>{post.date}</span>
                  </div>
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center text-lavender-600 font-medium hover:text-lavender-800 transition-colors group"
                >
                  Read more
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blogs;
