import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, get } from "firebase/database";
import { db, database } from "../../../firebase";
import Googlemap from "../../GoogleMap/GoogleMap";
import ResourceCard from "../ResourceCard/ResourceCard";
import { SkeletonLoader } from "../../Loaders";

const ResourceList = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const itemsPerPage = 9;
  const [mapResources, setMapResources] = useState([]);
  const [webResources, setWebResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const mapComponentRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    console.log("Current category:", category);
  }, [category]);

  const fetchWebResources = useCallback(async () => {
    try {
      console.log("Fetching web resources for category:", category);

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

          console.log(
            `Found ${resourcesArray.length} web resources in Realtime DB`
          );
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
      console.log(`Found ${resources.length} web resources in Firestore`);
      setWebResources(resources);
    } catch (error) {
      console.error("Error fetching web resources:", error);
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
      console.log(`Received ${resources.length} resources from Google Maps`);
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
    console.log(
      `Combining resources: ${mapResources.length} map resources + ${webResources.length} web resources`
    );

    const filtered = allResources.filter(
      (resource) =>
        resource.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        resource.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log(
      `After filtering by "${searchTerm}": ${filtered.length} resources`
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
    ? "blue"
    : isCatCategory
    ? "amber"
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
        className={`p-2 rounded-full bg-${themeColor}-100 text-${themeColor}-600 hover:bg-${themeColor}-200 disabled:opacity-50 transition-colors duration-200`}
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <span className={`text-${themeColor}-800 font-medium`}>
        {currentPage} / {totalPages || 1}
      </span>
      <button
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
        className={`p-2 rounded-full bg-${themeColor}-100 text-${themeColor}-600 hover:bg-${themeColor}-200 disabled:opacity-50 transition-colors duration-200`}
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );

  const refreshMapData = () => {
    setMapLoading(true);
    if (mapComponentRef.current && mapComponentRef.current.requestLocation) {
      mapComponentRef.current.requestLocation();
    }
  };

  return (
    <div
      className={`min-h-screen bg-${themeColor}-50 p-4 sm:p-6 pb-16 sm:pb-6`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() =>
              navigate(
                isDogCategory
                  ? "/dog-resources"
                  : isCatCategory
                  ? "/cat-resources"
                  : "/"
              )
            }
            className={`flex items-center text-${themeColor}-600 hover:text-${themeColor}-800 transition-colors duration-300 mb-4`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </button>

          <h1
            className={`text-3xl sm:text-4xl font-bold text-${themeColor}-900 mb-2`}
          >
            {getCategoryName()} Resources
          </h1>

          <p className={`text-${themeColor}-700`}>
            Find the best {getCategoryName().toLowerCase()} resources for your
            pet
          </p>
        </div>

        <div
          className={`bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-4 justify-between items-center`}
        >
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid"
                  ? `bg-${themeColor}-100 text-${themeColor}-600`
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`p-2 rounded ${
                viewMode === "map"
                  ? `bg-${themeColor}-100 text-${themeColor}-600`
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </button>

            <button
              onClick={refreshMapData}
              className={`p-2 rounded bg-${themeColor}-500 text-white hover:bg-${themeColor}-600`}
              title="Refresh map data"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={`w-full py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-${themeColor}-300 focus:border-${themeColor}-500`}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
        </div>

        <div className="hidden">
          <Googlemap
            ref={mapComponentRef}
            category={category}
            onResourcesFetched={handleMapResourcesFetched}
          />
        </div>

        {loading || mapLoading ? (
          <div className="min-h-screen bg-gradient-to-b from-lavender-50 to-white p-6">
            <div className="max-w-7xl mx-auto">
              <SkeletonLoader type="list" count={9} />
            </div>
          </div>
        ) : (
          <>
            {viewMode === "map" ? (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="h-96">
                  <Googlemap
                    ref={mapComponentRef}
                    category={category}
                    onResourcesFetched={handleMapResourcesFetched}
                  />
                </div>
                <p className="text-center mt-4 text-gray-500 text-sm">
                  Showing {mapResources.length} resources on the map
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {displayedResources.length > 0 ? (
                  displayedResources.map((resource) => (
                    <ResourceCard
                      key={resource.id || `${resource.name}-${Math.random()}`}
                      resource={resource}
                      onResourceUpdated={handleResourceUpdated}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <div className="text-6xl mb-4">
                      {isDogCategory ? "🐕" : isCatCategory ? "😿" : "🔍"}
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                      {searchTerm
                        ? `No resources found matching "${searchTerm}"`
                        : `No ${getCategoryName()} resources found`}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your search or check back later
                    </p>
                    <button
                      onClick={refreshMapData}
                      className={`bg-${themeColor}-500 text-white px-6 py-2 rounded-full hover:bg-${themeColor}-600 transition-colors duration-300 mr-4`}
                    >
                      Refresh Resources
                    </button>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className={`bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition-colors duration-300`}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {viewMode === "grid" &&
              displayedResources.length > 0 &&
              totalPages > 1 && (
                <div
                  className={`mt-8 ${
                    isMobile
                      ? "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 shadow-md"
                      : ""
                  }`}
                >
                  <PaginationControls />
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResourceList;
