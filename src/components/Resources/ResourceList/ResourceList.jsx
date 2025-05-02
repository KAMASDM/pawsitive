import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, get } from "firebase/database";
import { db, database } from "../../../firebase";
import Googlemap from "../../GoogleMap/GoogleMap";
import ResourceCard from "../ResourceCard/ResourceCard";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiRefreshCw,
  FiX,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import SkeletonLoader from "../../Loaders/SkeletonLoader";

const ResourceList = () => {
  const itemsPerPage = 9;
  const navigate = useNavigate();
  const { category } = useParams();
  const mapComponentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mapResources, setMapResources] = useState([]);
  const [webResources, setWebResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchWebResources = useCallback(async () => {
    try {
      try {
        const resourcesRef = ref(database, "resources");
        const snapshot = await get(resourcesRef);

        if (snapshot.exists()) {
          const resourcesData = snapshot.val();
          const resourcesArray = [];

          for (const key in resourcesData) {
            if (resourcesData[key].category === category) {
              resourcesArray.push({
                ...resourcesData[key],
                id: key,
                type: "web",
              });
            }
          }
          setWebResources(resourcesArray);
          setLoading(false);
          return;
        }
      } catch (rtdbError) {
        console.warn("Realtime DB fetch failed, trying Firestore:", rtdbError);
      }

      const q = query(
        collection(db, "webResources"),
        where("category", "==", category)
      );
      const querySnapshot = await getDocs(q);
      const resources = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        type: "web",
      }));
      setWebResources(resources);
    } catch (error) {
      setWebResources([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchWebResources();
  }, [fetchWebResources]);

  const handleMapResourcesFetched = useCallback(
    (resources) => {
      const formattedResources = resources.map((resource) => ({
        ...resource,
        type: "map",
        category: resource.category || category,
      }));
      setMapResources(formattedResources);
      setMapLoading(false);
    },
    [category]
  );

  useEffect(() => {
    const allResources = [...mapResources, ...webResources];
    const filtered = allResources.filter(
      (resource) =>
        resource.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        resource.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResources(filtered);
    setCurrentPage(1);
  }, [searchTerm, mapResources, webResources]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const displayedResources = filteredResources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleResourceUpdated = (id, newLikes) => {
    setFilteredResources((prevResources) =>
      prevResources.map((resource) =>
        resource.id === id ? { ...resource, likes: newLikes } : resource
      )
    );
  };

  const isPetType = (type) => {
    return category?.startsWith(type);
  };

  const isDogCategory = isPetType("dog_");
  const isCatCategory = isPetType("cat_");

  const themeColor = isDogCategory
    ? "lavender"
    : isCatCategory
      ? "lavender"
      : "lavender";

  const getCategoryName = () => {
    let name = category?.replace(/^(dog_|cat_)/, "").replace(/_/g, " ");
    if (name) {
      name = name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    return isDogCategory ? `Dog ${name}` : isCatCategory ? `Cat ${name}` : name;
  };

  const PaginationControls = () => (
    <div className="flex justify-center items-center space-x-4">
      <button
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-full bg-lavender-100 text-lavender-600 hover:bg-lavender-200 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
      >
        <FiChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-lavender-800 font-medium">
        {currentPage} / {totalPages || 1}
      </span>
      <button
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-2 rounded-full bg-lavender-100 text-lavender-600 hover:bg-lavender-200 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
      >
        <FiChevronRight className="h-5 w-5" />
      </button>
    </div>
  );

  const refreshMapData = () => {
    setMapLoading(true);
    if (mapComponentRef.current && mapComponentRef.current.requestLocation) {
      mapComponentRef.current.requestLocation();
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-lavender-50 relative pb-16">
      <header className="sticky top-16 z-40 bg-lavender-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-lavender-100 rounded-2xl shadow-md p-4 sm:p-6 mb-6 border border-lavender-100 mt-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <button
                    onClick={() =>
                      navigate(
                        isDogCategory
                          ? "/dog-resources"
                          : isCatCategory
                            ? "/cat-resources"
                            : "/dashboard"
                      )
                    }
                    className="mr-3 p-2 hover:bg-lavender-200 rounded-full transition-colors text-lavender-700 hover:text-lavender-900"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-bold text-lavender-900 flex items-center">
                    {getCategoryName()} Resources
                  </h2>
                </div>
              </div>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full py-2 pl-10 pr-10 rounded-full border border-lavender-300 bg-lavender-50 text-lavender-900 focus:ring-2 focus:ring-lavender-500 focus:border-transparent focus:outline-none"
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
      <div className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 pt-0">
        <div className="hidden">
          <Googlemap
            ref={mapComponentRef}
            category={category}
            onResourcesFetched={handleMapResourcesFetched}
          />
        </div>
        {loading || mapLoading ? (
          <div className="bg-lavender-50 p-6">
            <div className="max-w-7xl mx-auto">
              <SkeletonLoader type="list" count={9} />
            </div>
          </div>
        ) : (
          <div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {displayedResources.length > 0 ? (
                displayedResources.map((resource, index) => (
                  <ResourceCardWrapper
                    key={index}
                    resource={resource}
                    onResourceUpdated={handleResourceUpdated}
                    themeColor={themeColor}
                  />
                ))
              ) : (
                <div className="col-span-full bg-white rounded-2xl shadow-md p-6 sm:p-8 text-center border border-lavender-100">
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 bg-lavender-100 rounded-full flex items-center justify-center mb-4">
                      {isDogCategory ? "🐕" : isCatCategory ? "😿" : "🔍"}
                    </div>
                    <h3 className="text-xl font-bold text-lavender-900 mb-2">
                      {searchTerm
                        ? `No resources found matching "${searchTerm}"`
                        : `No ${getCategoryName()} resources found`}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      Try adjusting your search or check back later
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <button
                        onClick={refreshMapData}
                        className="px-6 py-3 bg-lavender-600 hover:bg-lavender-700 text-white rounded-full transition-colors duration-300"
                      >
                        <FiRefreshCw className="mr-1.5 inline-block" />
                        Refresh Resources
                      </button>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors duration-300"
                        >
                          <FiX className="mr-1.5 inline-block" /> Clear Search
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            {displayedResources.length > 0 && totalPages > 1 && (
              <div
                className={`mt-8 ${isMobile
                  ? "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-md z-20"
                  : ""
                  }`}
              >
                <PaginationControls />
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
};

const ResourceCardWrapper = ({ resource, onResourceUpdated }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="pet-card-shadow"
    >
      <ResourceCard resource={resource} onResourceUpdated={onResourceUpdated} />
    </motion.div>
  );
};

export default ResourceList;
