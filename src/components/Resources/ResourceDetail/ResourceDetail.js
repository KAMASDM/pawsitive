import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database, auth } from "../../../firebase";
import Googlemap from "../../GoogleMap/GoogleMap";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiClock,
  FiShare2,
  FiNavigation,
  FiAlertCircle,
} from "react-icons/fi";
import { FaStar, FaRegStar } from "react-icons/fa";

const ResourceDetail = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [resource, setResource] = useState(
    location.state?.resourceData || null
  );
  const [loading, setLoading] = useState(!location.state?.resourceData);
  const [error, setError] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {});
    return () => unsubscribe();
  }, []);

  const fetchResourceDetails = useCallback(async () => {
    if (!resourceId) {
      setError("No resource ID found.");
      setLoading(false);
      return;
    }
    if (resource) {
      setLoading(false);
      return;
    }

    console.log("Fetching resource details from DB (fallback):", resourceId);
    setLoading(true);
    setError(null);
    try {
      const resourceRef = ref(database, `resources/${resourceId}`);
      const snapshot = await get(resourceRef);
      if (snapshot.exists()) {
        setResource({ ...snapshot.val(), id: resourceId });
      } else {
        const webResourceRef = ref(database, `webResources/${resourceId}`);
        const webSnapshot = await get(webResourceRef);
        if (webSnapshot.exists()) {
          setResource({ ...webSnapshot.val(), id: resourceId });
        } else {
          setError("Resource not found in database.");
        }
      }
    } catch (fetchError) {
      console.error("Error fetching resource:", fetchError);
      setError(`Error fetching resource: ${fetchError.message}`);
    } finally {
      setLoading(false);
    }
  }, [resourceId, resource]);

  useEffect(() => {
    if (!resource) {
      fetchResourceDetails();
    }
  }, [resource, fetchResourceDetails]);

  const handleMapLoaded = () => {
    setMapLoading(false);
  };

  const muiTheme = {
    primary: {
      main: "#9D84B7",
      light: "#E5D9F2",
      lighter: "#F5F0FA",
      dark: "#7A5BA1",
    },
    secondary: { main: "#F26B5B", light: "#FFE4E0", dark: "#D84836" },
  };

  const theme = {
    bgBase: `bg-[${muiTheme.primary.main}]`,
    bgHover: `hover:bg-[${muiTheme.primary.dark}]`,
    textBase: `text-[${muiTheme.primary.main}]`,
    textHover: `hover:text-[${muiTheme.primary.dark}]`,
    bgLight: `bg-[${muiTheme.primary.light}]`,
    bgLighter: `bg-[${muiTheme.primary.lighter}]`,
    border: `border-[${muiTheme.primary.main}]`,
    textDark: `text-[${muiTheme.primary.dark}]`,
    textMedium: `text-[${muiTheme.primary.main}]`,
    ring: `focus:ring-[${muiTheme.primary.main}]`,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div
          className={`animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 ${theme.border}`}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-xl shadow-md p-8 text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-3">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full transition-colors inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-lg w-full bg-yellow-50 border border-yellow-200 rounded-xl shadow-md p-8 text-center">
          <FiAlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-700 mb-3">
            Resource Not Found
          </h2>
          <p className="text-yellow-600 mb-6">
            The requested resource data could not be loaded.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded-full transition-colors inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen  bg-lavender-50 p-4 sm:p-8 py-4`}
    >
      <div className="max-w-5xl mx-auto ">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center text-sm font-medium ${theme.textBase} ${theme.textHover} transition-colors group`}
          >
            <FiArrowLeft className="w-4 h-4 mr-1.5 transform group-hover:-translate-x-1 transition-transform" />
            Back to Resources
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className={`p-6 sm:p-8 bg-lavender-500 text-white`}>
            <h1 className={`text-3xl sm:text-4xl font-bold mb-2 text-white`}>
              {resource.name}
            </h1>
          </div>

          {resource.photoUrl && (
            <div className="w-full h-64 md:h-80 bg-gray-200">
              <img
                src={resource.photoUrl}
                alt={resource.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://via.placeholder.com/800x400?text=Image+Not+Available";
                }}
              />
            </div>
          )}

          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                  Information
                </h2>
                <div className="space-y-5 text-sm">
                  <div className="flex items-start">
                    <FiMapPin
                      className={`w-5 h-5 ${theme.textBase} mr-3 mt-0.5 flex-shrink-0`}
                    />
                    <div>
                      <p className="font-medium text-gray-500 uppercase text-xs tracking-wider">
                        Address
                      </p>
                      <p className="text-gray-700">
                        {resource.address ||
                          resource.vicinity ||
                          "No address available"}
                      </p>
                    </div>
                  </div>
                  {resource.phone && resource.phone !== "N/A" && (
                    <div className="flex items-start">
                      <FiPhone
                        className={`w-5 h-5 ${theme.textBase} mr-3 mt-0.5 flex-shrink-0`}
                      />
                      <div>
                        <p className="font-medium text-gray-500 uppercase text-xs tracking-wider">
                          Phone
                        </p>
                        <a
                          href={`tel:${resource.phone}`}
                          className={`text-gray-700 ${theme.textHover}`}
                        >
                          {resource.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {resource.email && (
                    <div className="flex items-start">
                      <FiMail
                        className={`w-5 h-5 ${theme.textBase} mr-3 mt-0.5 flex-shrink-0`}
                      />
                      <div>
                        <p className="font-medium text-gray-500 uppercase text-xs tracking-wider">
                          Email
                        </p>
                        <a
                          href={`mailto:${resource.email}`}
                          className={`text-gray-700 ${theme.textHover} break-all`}
                        >
                          {resource.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {resource.website && resource.website !== "N/A" && (
                    <div className="flex items-start">
                      <FiGlobe
                        className={`w-5 h-5 ${theme.textBase} mr-3 mt-0.5 flex-shrink-0`}
                      />
                      <div>
                        <p className="font-medium text-gray-500 uppercase text-xs tracking-wider">
                          Website
                        </p>
                        <a
                          href={
                            resource.website.startsWith("http")
                              ? resource.website
                              : `http://${resource.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${theme.textBase} ${theme.textHover} hover:underline break-all`}
                        >
                          {resource.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {(resource.hours || resource.time) && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                    Operating Hours
                  </h2>
                  <div className="flex items-start text-sm">
                    <FiClock
                      className={`w-5 h-5 ${theme.textBase} mr-3 mt-0.5 flex-shrink-0`}
                    />
                    <div className="text-gray-700 space-y-1">
                      {resource.hours ? (
                        Array.isArray(resource.hours) ? (
                          resource.hours.map((day, index) => (
                            <p key={index}>{day}</p>
                          ))
                        ) : (
                          <p>{resource.hours}</p>
                        )
                      ) : resource.time ? (
                        resource.time
                          .split(", ")
                          .map((day, index) => <p key={index}>{day}</p>)
                      ) : (
                        <p className="text-gray-500 italic">Not available</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {resource.rating > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                    Rating
                  </h2>
                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {[...Array(5)].map((_, i) =>
                        i < Math.round(resource.rating) ? (
                          <FaStar key={i} className="text-yellow-400 w-5 h-5" />
                        ) : (
                          <FaRegStar
                            key={i}
                            className="text-gray-300 w-5 h-5"
                          />
                        )
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {resource.rating.toFixed(1)} (
                      {resource.userRatingsTotal || 0} reviews)
                    </span>
                  </div>
                </section>
              )}

              {resource.description && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                    About
                  </h2>
                  <div className={`p-4 rounded-xl ${theme.bgLight}`}>
                    <p
                      className={`text-sm ${theme.textMedium} leading-relaxed`}
                    >
                      {resource.description}
                    </p>
                  </div>
                </section>
              )}
            </div>

            <div className="lg:col-span-1 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                  Location
                </h2>
                <div className="h-64 sm:h-80 rounded-xl overflow-hidden border border-gray-200 relative shadow-sm">
                  {mapLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      {" "}
                      <div
                        className={`animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 ${theme.border}`}
                      ></div>{" "}
                    </div>
                  )}
                  {resource.lat && resource.lng ? (
                    <Googlemap
                      center={{ lat: resource.lat, lng: resource.lng }}
                      resources={[resource]}
                      category={resource.category}
                      onMapLoaded={handleMapLoaded}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                      {" "}
                      <FiMapPin className="w-8 h-8 mb-2" />{" "}
                      <p>Location data not available</p>{" "}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                  Actions
                </h2>
                <div className="space-y-3">
                  {resource.lat && resource.lng && (
                    <button
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${resource.lat},${resource.lng}`,
                          "_blank"
                        )
                      }
                      className={`w-full bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors duration-300 flex items-center justify-center shadow hover:shadow-lg transform hover:-translate-y-px`}
                    >
                      <FiNavigation className="w-5 h-5 mr-2" /> Get Directions
                    </button>
                  )}
                  {resource.phone && resource.phone !== "N/A" && (
                    <button
                      onClick={() =>
                        window.open(`tel:${resource.phone}`, "_self")
                      }
                      className="w-full bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors duration-300 flex items-center justify-center shadow hover:shadow-lg transform hover:-translate-y-px"
                    >
                      <FiPhone className="w-5 h-5 mr-2" /> Call Now
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      const detailUrl = window.location.href;
                      const shareData = {
                        title: resource.name,
                        text: `Check out: ${resource.name} - ${
                          resource.address || ""
                        }`,
                        url: detailUrl,
                      };
                      try {
                        if (navigator.share) {
                          await navigator.share(shareData);
                          console.log("Shared successfully");
                        } else {
                          await navigator.clipboard.writeText(
                            `${shareData.text}\n${shareData.url}`
                          );
                          alert("Resource info copied to clipboard!");
                        }
                      } catch (err) {
                        console.error("Share/Copy failed:", err);
                        alert("Could not share or copy the information.");
                      }
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors duration-300 flex items-center justify-center shadow hover:shadow-lg transform hover:-translate-y-px"
                  >
                    <FiShare2 className="w-5 h-5 mr-2" /> Share
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceDetail;
