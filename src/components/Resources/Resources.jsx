import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaSearch,
    FaDog,
    FaCat,
    FaPaw,
    FaChevronLeft,
    FaChevronRight,
    FaFilter,
    FaSortAmountDown,
    FaChevronDown
} from "react-icons/fa";
import { MdOutlineLocalHospital, MdFastfood, MdMiscellaneousServices, MdShoppingCart } from "react-icons/md";
import { FaHotel, FaCut, FaHeart } from "react-icons/fa";
import ResourceCard from "./ResourceCard/ResourceCard";
import { useLocation } from "react-router-dom";

// --- CONSTANTS MOVED OUTSIDE THE COMPONENT ---

const dogBackground = "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2098&q=80";
const catBackground = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2043&q=80";
const allBackground = "https://media.istockphoto.com/id/1330020195/photo/banner-six-hungry-dogs-looking-up-begging-food-isolated-on-blue-background.jpg?b=1&s=612x612&w=0&k=20&c=ZfXBKWePlUoh6wE80IVF5F7iSrSsXt8iUZiB9BAs0gA=";

const mainCategories = [
    { id: "all", name: "All", icon: <FaPaw className="inline mr-2" />, background: allBackground, color: "from-purple-400 to-indigo-500" },
    { id: "dog", name: "Dog", icon: <FaDog className="inline mr-2" />, background: dogBackground, color: "from-violet-400 to-purple-500" },
    { id: "cat", name: "Cat", icon: <FaCat className="inline mr-2" />, background: catBackground, color: "from-indigo-400 to-violet-500" },
];

const subCategories = {
    dog: [
        { id: "dog_health", name: "Health & Wellness", icon: <MdOutlineLocalHospital /> },
        { id: "dog_nutrition", name: "Nutrition", icon: <MdFastfood /> },
        { id: "dog_services", name: "Services", icon: <MdMiscellaneousServices /> },
        { id: "dog_supplies", name: "Supplies", icon: <MdShoppingCart /> },
    ],
    cat: [
        { id: "cat_health", name: "Health & Wellness", icon: <MdOutlineLocalHospital /> },
        { id: "cat_nutrition", name: "Nutrition", icon: <MdFastfood /> },
        { id: "cat_services", name: "Services", icon: <MdMiscellaneousServices /> },
        { id: "cat_supplies", name: "Supplies", icon: <MdShoppingCart /> },
    ],
    general: [
        { id: "general_vets", name: "Veterinarians", mapsType: "veterinary_care", icon: <MdOutlineLocalHospital /> },
        { id: "general_adoption", name: "Adoption", mapsType: "animal_shelter", icon: <FaHeart /> },
        { id: "general_boarding", name: "Boarding", mapsType: "pet_boarding", icon: <FaHotel /> },
        { id: "general_grooming", name: "Grooming", mapsType: "pet_groomer", icon: <FaCut /> },
        { id: "general_stores", name: "Pet Stores", mapsType: "pet_store", icon: <MdShoppingCart /> }
    ]
};

const categoryKeywords = {
    dog_health: ["dog veterinarian", "emergency vet for dogs", "animal hospital 24/7", "canine dental care", "dog vaccination clinic", "flea and tick prevention for dogs", "heartworm treatment", "dog surgery", "holistic vet for dogs"],
    dog_nutrition: ["dog food store", "raw dog food supplier", "grain-free dog food", "prescription veterinary diet for dogs", "fresh pet food", "dog bakery", "organic dog treats", "puppy food", "senior dog nutrition"],
    dog_supplies: ["dog supply store", "dog collars and leashes", "dog harness", "orthopedic dog bed", "dog toys", "dog crates and kennels", "training collars", "smart feeders for dogs", "dog apparel"],
    dog_services: ["dog walker", "dog sitter", "dog groomer", "mobile dog grooming", "dog training school", "puppy classes", "dog behaviorist", "dog daycare", "dog park", "dog friendly hotel"],

    cat_health: ["cat veterinarian", "feline specialist", "emergency vet for cats", "24-hour animal hospital", "cat dental cleaning", "cat vaccination clinic", "flea and tick prevention for cats", "feline wellness center"],
    cat_nutrition: ["cat food store", "specialty cat food", "wet cat food", "dry cat food", "raw cat food diet", "prescription cat food", "natural cat treats", "kitten food", "grain-free cat food"],
    cat_supplies: ["cat supply store", "cat trees and condos", "cat scratching posts", "litter boxes", "cat litter", "cat toys", "cat carriers", "cat collars", "window perches for cats", "cat water fountain"],
    cat_services: ["cat sitter", "cat boarding", "cattery", "professional cat groomer", "mobile cat grooming", "cat behavior consultant", "in-home cat care"],

    general_vets: ["veterinary_care", "veterinarian", "animal hospital", "emergency vet", "vet clinic", "animal clinic"],
    general_adoption: ["animal_shelter", "pet adoption", "animal rescue", "dog adoption", "cat adoption", "adopt a pet", "humane society"],
    general_boarding: ["pet_boarding", "dog boarding", "kennels", "pet hotel", "dog daycare", "cattery", "pet resort"],
    general_grooming: ["pet_groomer", "dog groomer", "cat groomer", "mobile pet grooming", "pet spa", "dog washing"],
    general_stores: ["pet_store", "pet supplies", "pet food store", "aquarium store", "fish store"]
};

const ResourcesPage = () => {
    const location = useLocation();
    const { category, subCategory } = location.state || {};

    // State management
    const [activeMainCategory, setActiveMainCategory] = useState(category || "all");
    const [activeSubCategory, setActiveSubCategory] = useState(subCategory || "Health & Wellness");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedResource, setSelectedResource] = useState(null);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [isLocationLoading, setIsLocationLoading] = useState(true);
    const [sortBy, setSortBy] = useState("default"); // 'default', 'distance', 'rating'
    const [resourcesPerPage, setResourcesPerPage] = useState(6);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); // New combined state for mobile accordion

    const isInitialMount = useRef(true);

    // --- HOOKS & LOGIC (No changes in this section) ---
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                    setIsLocationLoading(false);
                },
                (err) => {
                    console.error("Error getting location:", err);
                    setUserLocation({ lat: 22.3072, lng: 73.1812 });
                    setIsLocationLoading(false);
                }
            );
        } else {
            setUserLocation({ lat: 22.3072, lng: 73.1812 });
            setIsLocationLoading(false);
        }
    }, []);
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); return R * c;
    };
    const fetchPlaceDetails = useCallback((service, place) => {
        return new Promise((resolve) => {
            const detailsRequest = { placeId: place.place_id, fields: ['name', 'formatted_address', 'rating', 'website', 'international_phone_number', 'opening_hours', 'photos', 'reviews', 'types', 'vicinity', 'place_id', 'geometry'] };
            service.getDetails(detailsRequest, (placeDetails, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                    let photoUrl = placeDetails.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 400 });
                    const distance = userLocation && placeDetails.geometry?.location ? getDistance(userLocation.lat, userLocation.lng, placeDetails.geometry.location.lat(), placeDetails.geometry.location.lng()) : null;
                    resolve({ place_id: placeDetails.place_id, name: placeDetails.name, formatted_address: placeDetails.formatted_address, vicinity: placeDetails.vicinity, rating: placeDetails.rating, website: placeDetails.website, phone: placeDetails.international_phone_number, hours: placeDetails.opening_hours?.weekday_text, isOpen: placeDetails.opening_hours?.isOpen(), reviews: placeDetails.reviews?.length, types: placeDetails.types, photoUrl: photoUrl, location: placeDetails.geometry?.location, distance: distance });
                } else { resolve(null); }
            });
        });
    }, [userLocation]);
    const fetchPlaces = useCallback(async (keywords) => {
        if (!userLocation || !window.google || keywords.length === 0) return [];
        const map = new window.google.maps.Map(document.createElement('div')); const service = new window.google.maps.places.PlacesService(map); const allResults = new Map();
        for (const keyword of keywords) {
            const request = { location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng), radius: 10000, keyword };
            const results = await new Promise((resolve) => service.nearbySearch(request, (r, s) => resolve(s === 'OK' ? r : [])));
            results.forEach(p => p && p.place_id && !allResults.has(p.place_id) && allResults.set(p.place_id, p));
        }
        const detailPromises = Array.from(allResults.values()).map(place => fetchPlaceDetails(service, place));
        return (await Promise.all(detailPromises)).filter(Boolean);
    }, [userLocation, fetchPlaceDetails]);
    const getResourceSubCategory = useCallback((resource) => {
        const text = `${resource.name.toLowerCase()} ${resource.types.join(' ')}`;
        if (text.includes('vet') || text.includes('animal hospital')) return 'Health & Wellness';
        if (text.includes('food') || text.includes('nutrition')) return 'Nutrition';
        if (text.includes('grooming') || text.includes('boarding') || text.includes('walker') || text.includes('sitter')) return 'Services';
        if (text.includes('store') || text.includes('supplies')) return 'Supplies';
        return 'General';
    }, []);
    useEffect(() => {
        let isMounted = true;
        const fetchAllResources = async () => {
            if (!userLocation || !window.google) return;
            setLoading(true); setError(null);
            try {
                const sourceSubCats = activeMainCategory === 'all' ? [...subCategories.dog, ...subCategories.cat, ...subCategories.general] : (subCategories[activeMainCategory] || []);
                let keywordsToSearch;
                if (activeSubCategory === "all") { keywordsToSearch = sourceSubCats.flatMap(subCat => categoryKeywords[subCat.id] || [subCat.mapsType]); }
                else { const matchingSubCats = sourceSubCats.filter(sc => sc.name === activeSubCategory); keywordsToSearch = matchingSubCats.flatMap(subCat => categoryKeywords[subCat.id] || [subCat.mapsType]); }
                const uniqueKeywords = [...new Set(keywordsToSearch.filter(Boolean))];
                if (uniqueKeywords.length > 0) {
                    const results = await fetchPlaces(uniqueKeywords);
                    if (isMounted) {
                        const augmented = results.map(res => ({ ...res, subCategory: getResourceSubCategory(res) }));
                        const uniqueResults = new Map(augmented.map(p => [p.place_id, p]));
                        setResources(Array.from(uniqueResults.values()));
                    }
                } else { if (isMounted) setResources([]); }
            } catch (err) { console.error("Fetching error:", err); if (isMounted) setError("An unexpected error occurred while fetching resources."); }
            finally { if (isMounted) setLoading(false); }
        };
        fetchAllResources();
        return () => { isMounted = false; };
    }, [activeMainCategory, activeSubCategory, userLocation, fetchPlaces, getResourceSubCategory]);
    const displayedSubCategories = useMemo(() => {
        if (activeMainCategory === 'all') {
            const all = [...subCategories.dog, ...subCategories.cat, ...subCategories.general];
            return Array.from(new Map(all.map(item => [item.name, item])).values());
        } return subCategories[activeMainCategory] || [];
    }, [activeMainCategory]);
    const processedResources = useMemo(() => {
        let filtered = resources.filter(resource => { return !searchTerm || resource.name?.toLowerCase().includes(searchTerm.toLowerCase()) || resource.vicinity?.toLowerCase().includes(searchTerm.toLowerCase()); });
        if (sortBy === 'distance') { filtered.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)); }
        else if (sortBy === 'rating') { filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); }
        return filtered;
    }, [resources, searchTerm, sortBy]);
    const totalPages = Math.ceil(processedResources.length / resourcesPerPage);
    const currentResources = processedResources.slice((currentPage - 1) * resourcesPerPage, currentPage * resourcesPerPage);
    useEffect(() => {
        if (isInitialMount.current) { isInitialMount.current = false; }
        else { setActiveSubCategory("all"); setCurrentPage(1); setIsMobileFilterOpen(false); }
    }, [activeMainCategory]);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, sortBy, activeSubCategory]);
    useEffect(() => {
        const handleClickOutside = (event) => { if (selectedResource && !event.target.closest('.modal-content')) { setSelectedResource(null); } };
        document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedResource]);
    const currentCategory = mainCategories.find(cat => cat.id === activeMainCategory);
    const headerBackground = currentCategory?.background;
    const categoryColor = currentCategory?.color || "from-violet-400 to-indigo-500";
    const Pagination = () => (<div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full"><div className="flex items-center gap-2"><span className="text-sm text-gray-600">Items per page:</span><select value={resourcesPerPage} onChange={(e) => { setResourcesPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-violet-50 border border-violet-200 text-violet-700 text-sm rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400"><option value="6">6</option><option value="10">10</option><option value="15">15</option><option value="20">20</option></select></div><div className="flex items-center gap-2"><button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={`p-2 rounded-lg ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}><FaChevronLeft /></button>{Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let pageNum; if (totalPages <= 5) { pageNum = i + 1; } else if (currentPage <= 3) { pageNum = i + 1; } else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; } else { pageNum = currentPage - 2 + i; } return (<button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentPage === pageNum ? `bg-gradient-to-r ${categoryColor} text-white shadow-md` : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>{pageNum}</button>); })}<button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className={`p-2 rounded-lg ${(currentPage === totalPages || totalPages === 0) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}><FaChevronRight /></button></div></div>);

    if (isLocationLoading) { return (<div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center"><div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg"><div className="flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mr-3"></div><p className="text-violet-700 font-medium">Getting your location...</p></div></div></div>); }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div className="absolute top-10 right-10 w-20 h-20 bg-violet-200 rounded-full opacity-20" animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
                <motion.div className="absolute bottom-20 left-5 w-16 h-16 bg-indigo-200 rounded-full opacity-25" animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div className="mb-4 rounded-3xl overflow-hidden relative py-4 shadow-xl" style={{ backgroundImage: `url(${headerBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40"></div>
                    <div className="relative z-10 p-4 sm:p-6 flex flex-col justify-center gap-4 sm:gap-7">
                        <motion.div className="relative w-full order-1 sm:order-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
                            <input type="text" placeholder={`Search ${activeMainCategory} resources...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 shadow-lg" />
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70" />
                        </motion.div>
                        <div className="flex flex-col lg:flex-row w-full justify-between items-center gap-4 order-2 sm:order-1">
                            <motion.h1 className="text-3xl md:text-4xl font-bold text-white capitalize text-center lg:text-left hidden sm:block" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>{activeMainCategory} Resources</motion.h1>
                            <motion.div className="flex flex-wrap gap-2 justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }}>
                                {mainCategories.map(cat => (<button key={cat.id} onClick={() => setActiveMainCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeMainCategory === cat.id ? 'bg-white text-slate-800 shadow-lg transform scale-105' : 'bg-white/20 text-white hover:bg-white/30 shadow-md border border-white/30'}`}>{cat.icon} {cat.name}</button>))}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>



                {/* Subcategories and Filters */}
                <motion.div className="mb-8 p-4 sm:p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-violet-100" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}>
                    {/* --- DESKTOP VIEW --- */}
                    <div className="hidden md:block">
                        <div className="flex flex-row items-center justify-between mb-4 ">
                            <h2 className="text-sm font-semibold text-violet-700 uppercase tracking-wider">Categories</h2>
                            <p className="text-center text-sm text-violet-600  hidden sm:block ">
                                The Resources are Located Within a 10KM Radius from your current Location.
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <select onChange={(e) => setSortBy(e.target.value)} value={sortBy} className="appearance-none bg-violet-50 border border-violet-200 text-violet-700 text-sm rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400">
                                        <option value="default">Best Match</option>
                                        <option value="distance">Distance</option>
                                        <option value="rating">Rating</option>
                                    </select>
                                    <FaSortAmountDown className="absolute left-2.5 top-1/2 -translate-y-1/2 text-violet-500" />
                                </div>
                            </div>
                        </div>


                        <div className="flex flex-wrap gap-2 py-2 -mx-1 w-full">
                            {displayedSubCategories.map(sub => (<button key={sub.id + sub.name} onClick={() => setActiveSubCategory(sub.name)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeSubCategory === sub.name ? `bg-gradient-to-r ${categoryColor} text-white shadow-lg transform scale-105` : 'bg-violet-100 text-violet-700 hover:bg-violet-200 shadow-md'}`}>{React.cloneElement(sub.icon, { className: "text-sm" })} {sub.name}</button>))}
                        </div>
                    </div>

                    {/* --- MOBILE VIEW: COMBINED ACCORDION --- */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="w-full flex justify-between items-center py-2 text-left text-violet-700 font-semibold">
                            <span className="flex items-center gap-2"><FaFilter /> Filters & Categories</span>
                            <motion.div animate={{ rotate: isMobileFilterOpen ? 180 : 0 }}><FaChevronDown /></motion.div>
                        </button>
                        <AnimatePresence>
                            {isMobileFilterOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                                    <div className="pt-2 pb-2 border-t border-violet-200">
                                        {/* Sort By Dropdown */}
                                        <div className="relative w-full my-3">
                                            <select onChange={(e) => setSortBy(e.target.value)} value={sortBy} className="w-full appearance-none bg-violet-50 border border-violet-200 text-violet-700 text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400">
                                                <option value="default">Sort by: Best Match</option>
                                                <option value="distance">Sort by: Distance</option>
                                                <option value="rating">Sort by: Rating</option>
                                            </select>
                                            <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500 text-sm" />
                                        </div>
                                        {/* Sub-Categories */}
                                        <div className="border-t border-violet-200 pt-3">
                                            <div className="flex flex-wrap gap-2 py-2 w-full">
                                                {displayedSubCategories.map(sub => (<button key={sub.id + sub.name} onClick={() => setActiveSubCategory(sub.name)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2 ${activeSubCategory === sub.name ? `bg-gradient-to-r ${categoryColor} text-white shadow-lg transform scale-105` : 'bg-violet-100 text-violet-700 hover:bg-violet-200 shadow-md'}`}>{React.cloneElement(sub.icon, { className: "text-xs" })} {sub.name}</button>))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>


                    </div>
                </motion.div>


                {/* NEW: Radius Message Moved Here */}
                <p className="text-center text-sm text-violet-600 mb-4 block md:hidden">
                    The Resources are Located Within a 10KM Radius from your current Location.
                </p>

                {/* Content Area */}
                {loading && (<div className="text-center p-8"><div className="flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mr-3"></div><p className="text-violet-700 font-medium">Loading resources...</p></div></div>)}
                {error && (<div className="bg-red-50 border border-red-200 text-red-700 p-6 text-center shadow-lg rounded-2xl"><div className="text-5xl mb-3">😥</div><h3 className="text-xl font-bold text-red-800 mb-2">Oops! Something went wrong.</h3><p className="text-red-600">{error}</p></div>)}
                {!loading && !error && (
                    <>
                        {currentResources.length > 0 ? (
                            <>
                                <motion.div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {currentResources.map((resource, index) => (
                                        <motion.div key={resource.place_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                            <ResourceCard resource={resource} onClick={() => setSelectedResource(resource)} userLocation={userLocation} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                                {totalPages > 1 && (
                                    <motion.div className="flex flex-col items-center mt-8 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <Pagination />
                                        <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
                                    </motion.div>
                                )}
                            </>
                        ) : (
                            <motion.div className="bg-white/90 p-8 text-center shadow-lg rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">No resources found</h3>
                                <p className="text-gray-600 mb-6">Try adjusting your filters or search term.</p>
                                <button onClick={() => { setSearchTerm(""); setActiveSubCategory("all"); setSortBy("default"); }} className={`bg-gradient-to-r ${categoryColor} hover:opacity-90 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all`}>Reset Filters</button>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedResource && (
                    <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full modal-content">
                            <h2 className="text-2xl font-bold mb-4">{selectedResource.name}</h2>
                            <p>{selectedResource.formatted_address}</p>
                            <button onClick={() => setSelectedResource(null)} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg">Close</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResourcesPage;