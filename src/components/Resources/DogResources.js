import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen bg-lavender-50">
      <div className="bg-lavender-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center mb-3">
            <button
              onClick={() => navigate("/")}
              className="mr-4 text-white hover:text-lavender-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold">Dog Resources</h1>
          </div>
          <p className="text-lg text-lavender-100">
            Find everything your canine companion needs
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for dog resources..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveMobileCategory(null);
              }}
              className="w-full py-2 pl-10 pr-4 rounded-lg border border-lavender-200 focus:outline-none focus:ring-2 focus:ring-lavender-500 focus:border-transparent text-sm"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-lavender-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-lavender-400 hover:text-lavender-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {isMobile && !searchTerm && (
        <div className="sticky top-14 z-10 bg-lavender-50 pt-4 pb-2 px-6 -mx-6">
          <MobileCategorySelector
            categories={dogResourceCategories}
            onSelect={(id) =>
              setActiveMobileCategory(id === activeMobileCategory ? null : id)
            }
            activeCategory={activeMobileCategory}
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {!isMobile && (
          <h2 className="text-xl font-bold text-lavender-900 mb-6">
            Resource Categories
          </h2>
        )}

        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <p className="text-gray-600 mb-4">Try adjusting your search term</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveMobileCategory(null);
              }}
              className="bg-lavender-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-lavender-700"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      <div className="bg-lavender-100/50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xl font-bold text-lavender-900 mb-6">
            Featured Resources
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-4 border-l-3 border-lavender-500 flex-grow">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">🏥</span>
                  <h3 className="text-lg font-semibold text-lavender-900">
                    City Pet Hospital
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  Comprehensive veterinary care for dogs of all breeds and ages.
                </p>
                <p className="text-xs text-gray-500">
                  Near Police Parade Ground, Vadodara
                </p>
              </div>
              <div className="px-4 py-3 bg-lavender-50 border-t border-lavender-100 mt-auto">
                <button
                  onClick={() => navigate("/resources/dog_health")}
                  className="text-lavender-700 font-medium text-xs hover:text-lavender-900 flex items-center"
                >
                  Find Vet Clinics
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-4 border-l-3 border-lavender-500 flex-grow">
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
                >
                  Find Pet Food
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-4 border-l-3 border-lavender-500 flex-grow">
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
                >
                  Find Training Services
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 ml-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
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
              className="bg-lavender-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-lavender-700 transition-colors duration-300"
            >
              Open Map View
            </button>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <div className="relative w-48 h-48 bg-lavender-100 rounded-full flex items-center justify-center">
              <span className="text-6xl">🗺️</span>
              <div className="absolute bottom-2 right-2 h-12 w-12 bg-lavender-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-2xl">🐕</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DogResources;
