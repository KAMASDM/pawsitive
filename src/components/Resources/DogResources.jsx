import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiMap,
  FiSearch,
  FiX,
} from "react-icons/fi";
import SkeletonLoader from "../Loaders/SkeletonLoader";

const style = document.createElement("style");
style.textContent = `
  .border-l-3 {
    border-left-width: 3px;
  }
`;
document.head.appendChild(style);

const dogResourceCategories = [
  {
    id: "dog_health",
    name: "Health & Wellness",
    icon: "🏥",
    description:
      "Veterinarians, emergency care, grooming, dental care, and preventative treatments.",
    examples: [
      "Veterinarians",
      "Emergency clinics",
      "Dental care",
      "Grooming",
      "Preventative care",
    ],
  },
  {
    id: "dog_nutrition",
    name: "Nutrition",
    icon: "🍖",
    description:
      "Pet food stores, specialty foods, treats, and water supplies for your dog.",
    examples: [
      "Pet food stores",
      "Online retailers",
      "Treat suppliers",
      "Fresh water solutions",
    ],
  },
  {
    id: "dog_supplies",
    name: "Supplies & Equipment",
    icon: "🧶",
    description:
      "Collars, leashes, carriers, beds, bowls, toys, and grooming supplies.",
    examples: [
      "Collars & leashes",
      "Carriers & crates",
      "Beds & bowls",
      "Toys",
      "Grooming tools",
    ],
  },
  {
    id: "dog_services",
    name: "Services",
    icon: "🦮",
    description:
      "Dog walkers, pet sitters, trainers, boarding facilities, and daycares.",
    examples: ["Dog walking", "Pet sitting", "Training", "Boarding", "Daycare"],
  },
  {
    id: "dog_information",
    name: "Information & Support",
    icon: "📚",
    description:
      "Online resources, breed info, animal shelters, pet communities, and helplines.",
    examples: [
      "Online resources",
      "Breed guides",
      "Shelters & rescues",
      "Community groups",
      "Helplines",
    ],
  },
  {
    id: "dog_legal",
    name: "Legal & Identification",
    icon: "🏷️",
    description:
      "Microchipping, ID tags, licensing, and local animal regulations.",
    examples: ["Microchipping", "ID tags", "Licensing", "Local regulations"],
  },
];

const CategoryCard = ({ category }) => {
  const navigate = useNavigate();
  return (
    <div
      className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300"
      onClick={() => navigate(`/resources/${category.id}`)}
    >
      <div className="flex items-center p-4 border-b border-lavender-100">
        <div className="bg-lavender-100 rounded-full p-3 mr-4">
          <span className="text-3xl">{category.icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-lavender-900">
          {category.name}
        </h3>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">{category.description}</p>

        <div className="mb-4">
          <h4 className="text-xs font-medium text-lavender-800 mb-2">
            Common services:
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {category.examples.map((example, index) => (
              <span
                key={index}
                className="text-xs bg-lavender-50 text-lavender-700 px-2 py-0.5 rounded-full border border-lavender-200"
              >
                {example}
              </span>
            ))}
          </div>
        </div>
        <button className="w-full bg-lavender-600 text-white py-2 rounded-md text-sm font-medium hover:bg-lavender-700 transition-colors duration-300 mt-2">
          View Resources
        </button>
      </div>
    </div>
  );
};

const MobileCategorySelector = ({ categories, onSelect, activeCategory }) => {
  return (
    <div className="overflow-x-auto pb-2 -mx-6 px-6">
      <div className="flex space-x-2" style={{ minWidth: "max-content" }}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`flex flex-col items-center px-4 py-2 rounded-lg text-center ${
              activeCategory === category.id
                ? "bg-lavender-600 text-white"
                : "bg-white text-lavender-900 border border-lavender-200"
            }`}
          >
            <span className="text-2xl mb-1">{category.icon}</span>
            <span className="text-xs font-medium whitespace-nowrap">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const DogResources = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMobileCategory, setActiveMobileCategory] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const filteredCategories = searchTerm
    ? dogResourceCategories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          category.examples.some((ex) =>
            ex.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    : activeMobileCategory && isMobile
    ? dogResourceCategories.filter(
        (category) => category.id === activeMobileCategory
      )
    : dogResourceCategories;

  if (loading) {
    return (
      <div className="min-h-screen bg-lavender-50 p-6">
        <div className="max-w-7xl mx-auto">
          <SkeletonLoader type="list" count={9} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50 relative">
      <header className="sticky top-16 z-40 bg-lavender-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-lavender-100 rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-lavender-100 mt-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="mr-3 p-2 hover:bg-lavender-200 rounded-full transition-colors text-lavender-700 hover:text-lavender-900"
                    aria-label="Go back"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-lg font-bold text-lavender-900">
                    Dog Resources
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-lavender-900 text-center sm:text-left">
                  Find everything your canine companion needs
                </p>
              </div>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setActiveMobileCategory(null);
                    }}
                    className="w-full py-2 pl-10 pr-10 rounded-full border border-lavender-300 bg-lavender-50 text-lavender-900 focus:ring-2 focus:ring-lavender-500 focus:border-transparent focus:outline-none"
                    aria-label="Search dog resources"
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {isMobile && !searchTerm && (
        <div className="sticky top-24 z-30 bg-lavender-50 pt-2 pb-2 px-4 border-b border-lavender-200 shadow-sm">
          <MobileCategorySelector
            categories={dogResourceCategories}
            onSelect={(id) =>
              setActiveMobileCategory(id === activeMobileCategory ? null : id)
            }
            activeCategory={activeMobileCategory}
          />
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-4">
        <section className="py-6">
          {!isMobile && (
            <h2 className="text-xl font-bold text-lavender-900 mb-6">
              Resource Categories
            </h2>
          )}
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-5xl mb-4">🐕</div>
              <h3 className="text-xl font-semibold text-lavender-900 mb-2">
                No categories found
              </h3>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setActiveMobileCategory(null);
                }}
                className="bg-lavender-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-lavender-700 transition-colors"
                aria-label="Clear search"
              >
                Clear Search
              </button>
            </div>
          )}
        </section>
        <section className="bg-lavender-100/50 py-8 rounded-xl">
          <div className="px-4 sm:px-6">
            <h2 className="text-xl font-bold text-lavender-900 mb-6">
              Featured Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-4 border-l-4 border-lavender-500 flex-grow">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🏥</span>
                    <h3 className="text-lg font-semibold text-lavender-900">
                      City Pet Hospital
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    Comprehensive veterinary care for dogs of all breeds and
                    ages.
                  </p>
                  <p className="text-xs text-gray-500">
                    Near Police Parade Ground, Vadodara
                  </p>
                </div>
                <div className="px-4 py-3 bg-lavender-50 border-t border-lavender-100 mt-auto">
                  <button
                    onClick={() => navigate("/resources/dog_health")}
                    className="text-lavender-700 font-medium text-xs hover:text-lavender-900 flex items-center"
                    aria-label="Find vet clinics"
                  >
                    Find Vet Clinics
                    <FiArrowRight className="ml-1" />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-4 border-l-4 border-lavender-500 flex-grow">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🍖</span>
                    <h3 className="text-lg font-semibold text-lavender-900">
                      Pet Food Emporium
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    Premium dog foods, treats, and specialty nutrition products.
                  </p>
                  <p className="text-xs text-gray-500">Karelibaug, Vadodara</p>
                </div>
                <div className="px-4 py-3 bg-lavender-50 border-t border-lavender-100 mt-auto">
                  <button
                    onClick={() => navigate("/resources/dog_nutrition")}
                    className="text-lavender-700 font-medium text-xs hover:text-lavender-900 flex items-center"
                    aria-label="Find pet food"
                  >
                    Find Pet Food
                    <FiArrowRight className="ml-1" />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
                <div className="p-4 border-l-4 border-lavender-500 flex-grow">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🦮</span>
                    <h3 className="text-lg font-semibold text-lavender-900">
                      Paws & Learn Training
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    Professional dog training and behavioral solutions.
                  </p>
                  <p className="text-xs text-gray-500">Fatehgunj, Vadodara</p>
                </div>
                <div className="px-4 py-3 bg-lavender-50 border-t border-lavender-100 mt-auto">
                  <button
                    onClick={() => navigate("/resources/dog_services")}
                    className="text-lavender-700 font-medium text-xs hover:text-lavender-900 flex items-center"
                    aria-label="Find training services"
                  >
                    Find Training Services
                    <FiArrowRight className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col md:flex-row items-center border border-lavender-200">
            <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
              <h2 className="text-xl font-semibold text-lavender-900 mb-3">
                Find Dog Resources Near You
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Use our location-based search to discover dog-friendly services,
                stores, and facilities in your neighborhood.
              </p>
              <button
                onClick={() => navigate("/map/dog_resources")}
                className="bg-lavender-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-lavender-700 transition-colors flex items-center"
                aria-label="Open map view"
              >
                Open Map View
                <FiMap className="ml-2" />
              </button>
            </div>
            <div className="md:w-1/3 flex justify-center">
              <div className="relative w-40 h-40 md:w-48 md:h-48 bg-lavender-100 rounded-full flex items-center justify-center">
                <span className="text-5xl">🗺️</span>
                <div className="absolute bottom-2 right-2 h-10 w-10 md:h-12 md:w-12 bg-lavender-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-xl">🐕</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DogResources;
