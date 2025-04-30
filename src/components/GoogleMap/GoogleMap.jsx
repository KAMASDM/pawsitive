import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useParams, useNavigate } from "react-router-dom";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const libraries = ["places"];

const categoryKeywords = {
  dog_health: [
    "veterinarian for dogs",
    "emergency vet clinic",
    "dog groomer",
    "pet dental care",
    "flea tick prevention dogs",
    "heartworm prevention dogs",
    "pet insurance for dogs",
    "dog vaccination clinic",
    "canine healthcare",
    "dog wellness",
  ],

  dog_nutrition: [
    "pet food store",
    "dog food specialty",
    "online pet food retailer",
    "dog treats supplier",
    "raw dog food",
    "fresh dog food",
    "grain free dog food",
    "prescription dog food",
    "puppy food",
  ],

  dog_supplies: [
    "dog collar and leash",
    "dog harness",
    "dog carrier",
    "dog bed",
    "dog bowls",
    "dog toys",
    "poop bags",
    "dog grooming supplies",
    "dog crate",
    "dog kennels",
  ],

  dog_services: [
    "dog walker",
    "pet sitter",
    "professional dog groomer",
    "dog trainer",
    "dog behaviorist",
    "pet boarding facility",
    "dog kennels",
    "dog daycare",
    "dog park",
    "dog obedience school",
  ],

  dog_information: [
    "pet resources",
    "dog breed information",
    "animal shelter dogs",
    "dog rescue",
    "dog owner community",
    "veterinary helpline",
    "online vet consultation",
    "dog adoption center",
    "dog breeder",
    "canine behavior specialist",
  ],

  cat_health: [
    "veterinarian for cats",
    "emergency vet clinic cats",
    "cat groomer",
    "cat dental care",
    "flea tick prevention cats",
    "cat vaccination clinic",
    "cat healthcare",
    "feline wellness",
    "cat healthcare specialist",
    "pet insurance for cats",
  ],

  cat_nutrition: [
    "cat food store",
    "specialty cat food",
    "online cat food retailer",
    "cat treats",
    "wet cat food",
    "dry cat food",
    "raw cat food",
    "grain free cat food",
    "kitten food",
    "senior cat food",
  ],

  cat_supplies: [
    "cat collar",
    "cat harness",
    "cat carrier",
    "cat bed",
    "cat bowls",
    "cat toys",
    "scratching post",
    "litter box",
    "cat litter",
    "cat grooming supplies",
    "cat trees",
    "cat furniture",
  ],

  cat_services: [
    "cat sitter",
    "cat groomer",
    "cat behaviorist",
    "cat boarding facility",
    "cattery",
    "professional cat grooming",
    "mobile cat groomer",
    "cat daycare",
  ],

  cat_information: [
    "cat resources",
    "cat breed information",
    "animal shelter cats",
    "cat rescue",
    "cat owner community",
    "feline behavior specialist",
    "cat adoption center",
    "cat breeder",
    "online vet for cats",
  ],

  pet_emergency_24_7: ["24/7 pet emergency "],

  adoption: ["pet adoption center"],
};

const categoryTypes = {
  dog_health: ["veterinary_care", "pet_store", "health"],
  dog_nutrition: ["pet_store", "store", "establishment"],
  dog_supplies: ["pet_store", "store", "establishment"],
  dog_services: ["pet_store", "establishment", "park"],
  dog_information: ["establishment", "library", "pet_store"],

  cat_health: ["veterinary_care", "pet_store", "health"],
  cat_nutrition: ["pet_store", "store", "establishment"],
  cat_supplies: ["pet_store", "store", "establishment"],
  cat_services: ["pet_store", "establishment"],
  cat_information: ["establishment", "library", "pet_store"],
};

const mockResources = {
  dog_health: [
    {
      id: "mock-dog-vet-1",
      name: "City Pet Hospital",
      address: "123 Main Street, Vadodara, Gujarat",
      lat: 22.3072,
      lng: 73.1812,
      phone: "+91 98765 43210",
      website: "https://example.com/citypethospital",
      status: "Open",
      hours: ["Monday-Friday: 9AM-7PM", "Saturday: 10AM-4PM", "Sunday: Closed"],
      photoUrl: "https://via.placeholder.com/400x300?text=City+Pet+Hospital",
      rating: 4.7,
      userRatingsTotal: 156,
      category: "dog_health",
      type: "Veterinarian",
    },
    {
      id: "mock-dog-vet-2",
      name: "Emergency Pet Clinic",
      address: "456 Hospital Road, Vadodara, Gujarat",
      lat: 22.3229,
      lng: 73.2124,
      phone: "+91 98765 12345",
      website: "https://example.com/emergencypetclinic",
      status: "Open 24 Hours",
      hours: ["Open 24 Hours"],
      photoUrl: "https://via.placeholder.com/400x300?text=Emergency+Pet+Clinic",
      rating: 4.5,
      userRatingsTotal: 98,
      category: "dog_health",
      type: "Emergency Clinic",
    },
  ],
  dog_nutrition: [
    {
      id: "mock-dog-food-1",
      name: "Premium Pet Foods",
      address: "789 Market Street, Vadodara, Gujarat",
      lat: 22.3126,
      lng: 73.1905,
      phone: "+91 98765 67890",
      website: "https://example.com/premiumpetfoods",
      status: "Open",
      hours: ["Monday-Saturday: 10AM-8PM", "Sunday: 11AM-5PM"],
      photoUrl: "https://via.placeholder.com/400x300?text=Premium+Pet+Foods",
      rating: 4.3,
      userRatingsTotal: 87,
      category: "dog_nutrition",
      type: "Pet Food Store",
    },
  ],
  dog_services: [
    {
      id: "mock-dog-walker-1",
      name: "Professional Dog Walking Service",
      address: "223 Walker Street, Vadodara, Gujarat",
      lat: 22.3158,
      lng: 73.1845,
      phone: "+91 98765 54321",
      website: "https://example.com/dogwalking",
      status: "Open",
      hours: ["Monday-Friday: 8AM-6PM", "Saturday: 9AM-4PM", "Sunday: Closed"],
      photoUrl: "https://via.placeholder.com/400x300?text=Dog+Walking+Service",
      rating: 4.6,
      userRatingsTotal: 75,
      category: "dog_services",
      type: "Dog Walker",
    },
    {
      id: "mock-dog-trainer-1",
      name: "Canine Training Academy",
      address: "450 Training Lane, Vadodara, Gujarat",
      lat: 22.3198,
      lng: 73.1965,
      phone: "+91 98765 87654",
      website: "https://example.com/dogtraining",
      status: "Open",
      hours: ["Monday-Saturday: 10AM-7PM", "Sunday: By appointment"],
      photoUrl: "https://via.placeholder.com/400x300?text=Canine+Training",
      rating: 4.8,
      userRatingsTotal: 112,
      category: "dog_services",
      type: "Dog Trainer",
    },
  ],
  cat_health: [
    {
      id: "mock-cat-vet-1",
      name: "Feline Wellness Center",
      address: "101 Cat Street, Vadodara, Gujarat",
      lat: 22.3189,
      lng: 73.1765,
      phone: "+91 98765 98765",
      website: "https://example.com/felinewellness",
      status: "Open",
      hours: ["Monday-Friday: 9AM-6PM", "Saturday: 10AM-3PM", "Sunday: Closed"],
      photoUrl:
        "https://via.placeholder.com/400x300?text=Feline+Wellness+Center",
      rating: 4.8,
      userRatingsTotal: 112,
      category: "cat_health",
      type: "Veterinarian",
    },
  ],
  cat_services: [
    {
      id: "mock-cat-sitter-1",
      name: "Professional Cat Sitting Services",
      address: "187 Feline Avenue, Vadodara, Gujarat",
      lat: 22.3175,
      lng: 73.1832,
      phone: "+91 98765 23456",
      website: "https://example.com/catsitting",
      status: "Open",
      hours: ["Monday-Sunday: 8AM-8PM"],
      photoUrl: "https://via.placeholder.com/400x300?text=Cat+Sitting+Services",
      rating: 4.7,
      userRatingsTotal: 89,
      category: "cat_services",
      type: "Cat Sitter",
    },
  ],
};

const Googlemap = React.forwardRef(
  (
    {
      onResourcesFetched = () => {},
      center,
      viewMode = "map",
      directions = false,
      destination = null,
      onMapLoaded = () => {},
    },
    ref
  ) => {
    const { category } = useParams();
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [nearbyResources, setNearbyResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(true);
    const [resourcesError, setResourcesError] = useState(null);
    const [mapsError, setMapsError] = useState(null);
    const [locationRequested, setLocationRequested] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchedPlaces = useRef(new Set());

    const googleMapsApiKey =
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE";

    useEffect(() => {
      const maskedKey =
        googleMapsApiKey?.substring(0, 4) +
        "..." +
        googleMapsApiKey?.substring(googleMapsApiKey.length - 4);
      console.log("Using Google Maps API Key (masked):", maskedKey);
      if (!googleMapsApiKey || googleMapsApiKey === "YOUR_API_KEY_HERE") {
        console.warn(
          "⚠️ No Google Maps API key found in environment variables. Map functionality will be limited."
        );
        setMapsError("API key missing or invalid");
      }
    }, [googleMapsApiKey]);

    const { isLoaded, loadError } = useLoadScript({
      googleMapsApiKey: googleMapsApiKey,
      libraries: libraries,
    });

    useEffect(() => {
      console.log(
        "Google Maps loading status:",
        isLoaded ? "Loaded" : "Loading..."
      );
      if (loadError) {
        console.error("Google Maps load error:", loadError);
        setMapsError(loadError.message);
      }
    }, [isLoaded, loadError]);

    const calculateRelevanceScore = useCallback((place, keyword) => {
      let score = 0;

      const placeName = place.name.toLowerCase();
      const keywordLower = keyword.toLowerCase();

      if (searchQuery && searchQuery.trim() !== "") {
        const searchTerms = searchQuery.toLowerCase().split(/\s+/);

        if (searchTerms.every((term) => placeName.includes(term))) {
          score += 50;
        }

        searchTerms.forEach((term) => {
          if (placeName.includes(term)) {
            score += 10;
          }
        });
      }

      if (placeName === keywordLower) {
        score += 30;
      } else if (placeName.includes(keywordLower)) {
        score += 15;
      }

      if (searchQuery) {
        const searchQueryLower = searchQuery.toLowerCase();

        if (
          searchQueryLower.includes("trainer") ||
          searchQueryLower.includes("training")
        ) {
          if (
            placeName.includes("trainer") ||
            placeName.includes("training") ||
            placeName.includes("obedience") ||
            placeName.includes("school")
          ) {
            score += 40;
          } else {
            score -= 20;
          }
        }

        if (
          searchQueryLower.includes("walker") ||
          searchQueryLower.includes("walking")
        ) {
          if (placeName.includes("walker") || placeName.includes("walking")) {
            score += 40;
          } else {
            score -= 20;
          }
        }

        if (searchQueryLower.includes("groom")) {
          if (placeName.includes("groom")) {
            score += 40;
          } else {
            score -= 20;
          }
        }

        if (
          searchQueryLower.includes("vet") ||
          searchQueryLower.includes("clinic") ||
          searchQueryLower.includes("hospital") ||
          searchQueryLower.includes("doctor")
        ) {
          if (
            placeName.includes("vet") ||
            placeName.includes("clinic") ||
            placeName.includes("hospital") ||
            placeName.includes("doctor") ||
            placeName.includes("medical")
          ) {
            score += 40;
          } else {
            score -= 20;
          }
        }
      }

      if (
        category === "dog_services" &&
        (placeName.includes("walker") ||
          placeName.includes("walking") ||
          placeName.includes("daycare") ||
          placeName.includes("boarding") ||
          placeName.includes("trainer") ||
          placeName.includes("training"))
      ) {
        score += 20;
      }

      if (
        category === "cat_services" &&
        (placeName.includes("sitter") ||
          placeName.includes("sitting") ||
          placeName.includes("boarding") ||
          placeName.includes("groomer") ||
          placeName.includes("grooming"))
      ) {
        score += 20;
      }

      if (
        category?.includes("_health") &&
        (placeName.includes("vet") ||
          placeName.includes("clinic") ||
          placeName.includes("hospital") ||
          placeName.includes("doctor") ||
          placeName.includes("emergency"))
      ) {
        score += 20;
      }

      if (place.rating) {
        score += place.rating * 2;
      }

      if (place.user_ratings_total) {
        score += Math.min(place.user_ratings_total / 50, 10);
      }

      return score;
    },[category, searchQuery]);

    const fetchPlaceDetails = useCallback(async (service, place) => {
      return new Promise((resolve) => {
        const detailsRequest = {
          placeId: place.place_id,
          fields: [
            "name",
            "vicinity",
            "geometry",
            "formatted_phone_number",
            "business_status",
            "opening_hours",
            "photos",
            "types",
            "rating",
            "user_ratings_total",
            "website",
            "formatted_address",
            "international_phone_number",
          ],
        };

        service.getDetails(detailsRequest, (placeDetails, detailsStatus) => {
          if (
            detailsStatus === window.google.maps.places.PlacesServiceStatus.OK
          ) {
            const photoUrl = placeDetails.photos?.[0]?.getUrl({
              maxHeight: 300,
              maxWidth: 400,
            });

            let resourceType = "Establishment";
            const name = placeDetails.name.toLowerCase();
            const types = placeDetails.types || [];

            if (searchQuery) {
              const searchQueryLower = searchQuery.toLowerCase();
              if (
                searchQueryLower.includes("trainer") ||
                searchQueryLower.includes("training")
              ) {
                if (
                  name.includes("train") ||
                  name.includes("obedience") ||
                  name.includes("school")
                ) {
                  resourceType = "Dog Trainer";
                }
              } else if (
                searchQueryLower.includes("walker") ||
                searchQueryLower.includes("walking")
              ) {
                if (name.includes("walk")) {
                  resourceType = "Dog Walker";
                }
              } else if (searchQueryLower.includes("groom")) {
                if (name.includes("groom")) {
                  resourceType = category?.startsWith("dog")
                    ? "Dog Groomer"
                    : "Cat Groomer";
                }
              } else if (
                searchQueryLower.includes("vet") ||
                searchQueryLower.includes("clinic") ||
                searchQueryLower.includes("hospital")
              ) {
                if (
                  name.includes("vet") ||
                  name.includes("clinic") ||
                  name.includes("hospital") ||
                  name.includes("doctor") ||
                  name.includes("care")
                ) {
                  resourceType = "Veterinarian";
                }
              }
            }

            if (resourceType === "Establishment") {
              if (
                types.includes("veterinary_care") ||
                name.includes("vet") ||
                name.includes("clinic") ||
                name.includes("hospital")
              ) {
                resourceType = "Veterinarian";
              } else if (category === "dog_services") {
                if (name.includes("walk") || name.includes("walker")) {
                  resourceType = "Dog Walker";
                } else if (
                  name.includes("train") ||
                  name.includes("obedience")
                ) {
                  resourceType = "Dog Trainer";
                } else if (
                  name.includes("daycare") ||
                  name.includes("boarding")
                ) {
                  resourceType = "Pet Boarding";
                } else if (name.includes("groom")) {
                  resourceType = "Pet Groomer";
                } else if (types.includes("park") || name.includes("park")) {
                  resourceType = "Dog Park";
                }
              } else if (category === "cat_services") {
                if (name.includes("sit") || name.includes("sitter")) {
                  resourceType = "Cat Sitter";
                } else if (name.includes("groom")) {
                  resourceType = "Cat Groomer";
                } else if (name.includes("board") || name.includes("hotel")) {
                  resourceType = "Cat Boarding";
                }
              } else if (category?.includes("_nutrition")) {
                resourceType = "Pet Food Store";
              } else if (category?.includes("_supplies")) {
                resourceType = "Pet Supplies";
              }
            }

            const formattedResource = {
              id: place.place_id,
              name: placeDetails.name,
              address: placeDetails.formatted_address || placeDetails.vicinity,
              lat: placeDetails.geometry.location.lat(),
              lng: placeDetails.geometry.location.lng(),
              phone:
                placeDetails.international_phone_number ||
                placeDetails.formatted_phone_number ||
                "N/A",
              website: placeDetails.website || "N/A",
              status:
                placeDetails.business_status === "OPERATIONAL"
                  ? "Open"
                  : "Closed",
              hours: placeDetails.opening_hours?.weekday_text || "N/A",
              photoUrl,
              types: placeDetails.types || [],
              rating: placeDetails.rating || 0,
              userRatingsTotal: placeDetails.user_ratings_total || 0,
              category: category,
              type: resourceType,
            };

            resolve(formattedResource);
          } else {
            console.warn("Place details fetch failed:", detailsStatus);
            resolve(null);
          }
        });
      });
    },[category, searchQuery]);

    const performSearch = useCallback(async (service, location, keyword) => {
      return new Promise((resolve) => {
        let type =
          categoryTypes[category?.toLowerCase()]?.[0] || "establishment";

        if (searchQuery) {
          const searchQueryLower = searchQuery.toLowerCase();
          if (
            searchQueryLower.includes("vet") ||
            searchQueryLower.includes("clinic")
          ) {
            type = "veterinary_care";
          } else if (searchQueryLower.includes("park")) {
            type = "park";
          }
        }

        const request = {
          location: new window.google.maps.LatLng(location.lat, location.lng),
          radius: 10000,
          keyword: keyword,
          type: type,
        };

        service.nearbySearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            console.log(
              `Found ${results.length} results for keyword "${keyword}"`
            );
            resolve(results);
          } else {
            console.warn(`Search failed for keyword ${keyword}:`, status);
            resolve([]);
          }
        });
      });
    },[category, searchQuery]);

    const filterBySearchQuery = (resources, query) => {
      if (!query || query.trim() === "") {
        return resources;
      }

      const queryTerms = query.toLowerCase().trim().split(/\s+/);

      const exactTypeMatches = resources.filter((resource) => {
        const type = resource.type.toLowerCase();
        return (
          queryTerms.join(" ") === type || type.includes(queryTerms.join(" "))
        );
      });

      if (exactTypeMatches.length > 0) {
        return exactTypeMatches;
      }

      return resources.filter((resource) => {
        const name = resource.name.toLowerCase();
        const type = resource.type.toLowerCase();
        const address = resource.address.toLowerCase();

        return queryTerms.every(
          (term) =>
            name.includes(term) || type.includes(term) || address.includes(term)
        );
      });
    };

    const fetchNearbyPlaces = useCallback(
      async (location, keywords) => {
        setLoadingResources(true);
        setResourcesError(null);

        if (!window.google || !window.google.maps) {
          console.error("Google Maps not loaded");
          setResourcesError(
            "Google Maps failed to load. Please refresh the page and try again."
          );
          setLoadingResources(false);

          const mockData = mockResources[category?.toLowerCase()] || [];

          const filteredMockData =
            searchQuery && searchQuery.trim() !== ""
              ? filterBySearchQuery(mockData, searchQuery)
              : mockData;

          onResourcesFetched(filteredMockData);
          setNearbyResources(filteredMockData);
          return;
        }

        const service = new window.google.maps.places.PlacesService(
          document.createElement("div")
        );

        const allResults = new Map();
        searchedPlaces.current.clear();

        try {
          let searchKeywords;
          if (searchQuery && searchQuery.trim() !== "") {
            searchKeywords = [searchQuery];

            const searchQueryLower = searchQuery.toLowerCase();
            if (
              searchQueryLower.includes("trainer") ||
              searchQueryLower.includes("training")
            ) {
              searchKeywords.push(
                "dog trainer",
                "dog training",
                "obedience training",
                "puppy training"
              );
            } else if (
              searchQueryLower.includes("walker") ||
              searchQueryLower.includes("walking")
            ) {
              searchKeywords.push(
                "dog walker",
                "dog walking",
                "pet walking service"
              );
            } else if (
              searchQueryLower.includes("vet") ||
              searchQueryLower.includes("clinic")
            ) {
              searchKeywords.push(
                "veterinarian",
                "animal hospital",
                "pet clinic"
              );
            } else if (searchQueryLower.includes("groom")) {
              searchKeywords.push(
                "pet groomer",
                "dog grooming",
                "cat grooming"
              );
            } else {
              searchKeywords = [...searchKeywords, ...keywords];
            }
          } else {
            searchKeywords = keywords;
          }

          for (const keyword of searchKeywords) {
            const results = await performSearch(service, location, keyword);

            for (const place of results) {
              if (!searchedPlaces.current.has(place.place_id)) {
                searchedPlaces.current.add(place.place_id);

                const relevanceScore = calculateRelevanceScore(place, keyword);

                if (
                  !allResults.has(place.place_id) ||
                  allResults.get(place.place_id).relevanceScore < relevanceScore
                ) {
                  allResults.set(place.place_id, {
                    place,
                    relevanceScore,
                    keyword,
                  });
                }
              }
            }
          }

          const sortedResults = Array.from(allResults.values())
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 20);

          console.log(
            `Found ${sortedResults.length} unique places after processing`
          );

          const detailedResources = await Promise.all(
            sortedResults.map(({ place }) => fetchPlaceDetails(service, place))
          );

          const validResources = detailedResources.filter(
            (resource) => resource !== null
          );

          if (validResources.length === 0) {
            console.log(
              "No resources found, using mock data for this category"
            );
            const mockData = mockResources[category?.toLowerCase()] || [];

            const filteredMockData =
              searchQuery && searchQuery.trim() !== ""
                ? filterBySearchQuery(mockData, searchQuery)
                : mockData;

            onResourcesFetched(filteredMockData);
            setNearbyResources(filteredMockData);
          } else {
            const filteredResources =
              searchQuery && searchQuery.trim() !== ""
                ? filterBySearchQuery(validResources, searchQuery)
                : validResources;

            onResourcesFetched(filteredResources);
            setNearbyResources(filteredResources);
          }
        } catch (error) {
          console.error("Error in fetchNearbyPlaces:", error);
          setResourcesError("Failed to fetch resources. " + error.message);

          const mockData = mockResources[category?.toLowerCase()] || [];

          const filteredMockData =
            searchQuery && searchQuery.trim() !== ""
              ? filterBySearchQuery(mockData, searchQuery)
              : mockData;

          onResourcesFetched(filteredMockData);
          setNearbyResources(filteredMockData);
        } finally {
          setLoadingResources(false);
        }
      },
      [
        calculateRelevanceScore,
        category,
        fetchPlaceDetails,
        onResourcesFetched,
        performSearch,
        searchQuery,
      ]
    );

    const requestLocation = useCallback(() => {
      setLocationRequested(true);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(userPos);

            const keywords = categoryKeywords[category?.toLowerCase()] || [
              "pet store",
            ];
            fetchNearbyPlaces(userPos, keywords);
          },
          (error) => {
            console.error("Geolocation error:", error);
            setResourcesError(
              `Location permission denied: ${error.message}. Using default location.`
            );
            setUserLocation(defaultCenter);

            const keywords = categoryKeywords[category?.toLowerCase()] || [
              "pet store",
            ];
            fetchNearbyPlaces(defaultCenter, keywords);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      } else {
        console.warn("Geolocation not supported by this browser");
        setResourcesError(
          "Geolocation is not supported by your browser. Using default location."
        );
        setUserLocation(defaultCenter);

        const keywords = categoryKeywords[category?.toLowerCase()] || [
          "pet store",
        ];
        fetchNearbyPlaces(defaultCenter, keywords);
      }
    }, [category, fetchNearbyPlaces]);
    const handleMarkerClick = (resource) => {
      setSelectedMarker(resource);
    };
    const handleMapClick = () => {
      setSelectedMarker(null);
    };
    const handleMarkerClose = () => {
      setSelectedMarker(null);
    };
    const handleSearch = (event) => {
      setSearchQuery(event.target.value);
    };
    const handleSearchSubmit = (event) => {
      event.preventDefault();
      if (userLocation) {
        const keywords = categoryKeywords[category?.toLowerCase()] || [
          "pet store",
        ];
        fetchNearbyPlaces(userLocation, keywords);
      }
    };

    const handleViewModeChange = useCallback((mode) => {
      navigate(`/map/${category}/${mode}`);
    },[category, navigate]);
    
    const handleDirectionsClick = useCallback(() => {
      if (destination) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`,
          "_blank"
        );
      }
    },[destination]);

    const handleMapLoad = (map) => {
      onMapLoaded(map);
    };

    useEffect(() => {
      if (isLoaded && !locationRequested) {
        requestLocation();
      }
    }, [isLoaded, locationRequested, requestLocation]);

    useEffect(() => {
      if (mapsError) {
        console.error("Maps error:", mapsError);
      }
    }, [mapsError]);

    useEffect(() => {
      if (loadingResources) {
        console.log("Loading resources...");
      } else {
        console.log("Resources loaded");
      }
    }, [loadingResources]);

    useEffect(() => {
      if (resourcesError) {
        console.error("Resources error:", resourcesError);
      }
    }, [resourcesError]);

    useEffect(() => {
      if (userLocation) {
        console.log("User location updated");
      }
    }, [userLocation]);

    useEffect(() => {
      if (nearbyResources.length > 0) {
        console.log("Nearby resources updated:");
      }
    }, [nearbyResources]);

    useEffect(() => {
      if (selectedMarker) {
        console.log("Selected marker:");
      }
    }, [selectedMarker]);

    useEffect(() => {
      if (searchQuery) {
        console.log("Search query updated:");
      }
    }, [searchQuery]);

    useEffect(() => {
      if (viewMode) {
        console.log("View mode changed:");
      }
    }, [viewMode]);

    useEffect(() => {
      if (directions) {
        console.log("Directions mode enabled");
      }
    }, [directions]);

    useEffect(() => {
      if (destination) {
        console.log("Destination set:");
      }
    }, [destination]);

    useEffect(() => {
      if (category) {
        console.log("Category changed:");
      }
    }, [category]);

    useEffect(() => {
      if (ref) {
        ref.current = {
          requestLocation,
          fetchNearbyPlaces,
          handleViewModeChange,
          handleDirectionsClick,
        };
      }
    }, [
      ref,
      requestLocation,
      fetchNearbyPlaces,
      handleViewModeChange,
      handleDirectionsClick,
    ]);

    if (mapsError) {
      return <div>Error loading map: {mapsError}</div>;
    }

    if (!isLoaded) {
      return <div>Loading map...</div>;
    }

    return (
      <div className="relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={userLocation || center || defaultCenter}
          zoom={10}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
        >
          {userLocation && <Marker position={userLocation} />}
          {nearbyResources.map((resource) => (
            <Marker
              key={resource.id}
              position={{ lat: resource.lat, lng: resource.lng }}
              onClick={() => handleMarkerClick(resource)}
            />
          ))}
          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={handleMarkerClose}
            >
              <div>
                <h2>{selectedMarker.name}</h2>
                <p>{selectedMarker.address}</p>
                <p>{selectedMarker.phone}</p>
                <p>{selectedMarker.website}</p>
                <p>{selectedMarker.status}</p>
                <p>{selectedMarker.hours.join(", ")}</p>
                {selectedMarker.photoUrl && (
                  <img
                    src={selectedMarker.photoUrl}
                    alt={selectedMarker.name}
                  />
                )}
                {directions && (
                  <button onClick={handleDirectionsClick}>
                    Get Directions
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
        {viewMode === "list" && (
          <div className="absolute top-0 left-0 p-4 bg-white shadow-lg z-10">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search for resources..."
              />
              <button type="submit">Search</button>
            </form>
            {loadingResources ? (
              <p>Loading resources...</p>
            ) : (
              nearbyResources.map((resource) => (
                <div key={resource.id}>
                  <h3>{resource.name}</h3>
                  <p>{resource.address}</p>
                  {directions && (
                    <button onClick={() => handleDirectionsClick(resource)}>
                      Get Directions
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
);
Googlemap.displayName = "Googlemap";
export default Googlemap;
