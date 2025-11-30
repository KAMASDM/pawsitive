// Utility function to calculate matching score between lost and found pets
// Returns a confidence score between 0-100

export const calculateMatchScore = (lostPet, foundPet) => {
  let score = 0;
  const weights = {
    petType: 30,
    breed: 20,
    color: 15,
    size: 10,
    gender: 10,
    location: 15
  };

  // Pet Type Match (30 points)
  if (lostPet.petType === foundPet.petType) {
    score += weights.petType;
  }

  // Breed Match (20 points)
  if (lostPet.breed && foundPet.approximateBreed) {
    const lostBreed = lostPet.breed.toLowerCase();
    const foundBreed = foundPet.approximateBreed.toLowerCase();
    
    if (lostBreed === foundBreed) {
      score += weights.breed;
    } else if (lostBreed.includes(foundBreed) || foundBreed.includes(lostBreed)) {
      score += weights.breed * 0.7;
    } else if (areSimilarBreeds(lostBreed, foundBreed)) {
      score += weights.breed * 0.5;
    }
  }

  // Color Match (15 points)
  if (lostPet.primaryColor && foundPet.primaryColor) {
    const lostColor = lostPet.primaryColor.toLowerCase();
    const foundColor = foundPet.primaryColor.toLowerCase();
    
    if (lostColor === foundColor) {
      score += weights.color;
    } else if (areSimilarColors(lostColor, foundColor)) {
      score += weights.color * 0.6;
    }

    // Secondary color bonus
    if (lostPet.secondaryColor && foundPet.secondaryColor) {
      const lostSecondary = lostPet.secondaryColor.toLowerCase();
      const foundSecondary = foundPet.secondaryColor.toLowerCase();
      if (lostSecondary === foundSecondary) {
        score += 5;
      }
    }
  }

  // Size Match (10 points)
  if (lostPet.size === foundPet.size) {
    score += weights.size;
  } else if (areSimilarSizes(lostPet.size, foundPet.size)) {
    score += weights.size * 0.5;
  }

  // Gender Match (10 points)
  if (lostPet.gender && foundPet.gender) {
    if (lostPet.gender === foundPet.gender) {
      score += weights.gender;
    }
  }

  // Location & Time Proximity (15 points)
  if (lostPet.lastSeenLatitude && lostPet.lastSeenLongitude &&
      foundPet.foundLatitude && foundPet.foundLongitude) {
    
    const distance = calculateDistance(
      lostPet.lastSeenLatitude,
      lostPet.lastSeenLongitude,
      foundPet.foundLatitude,
      foundPet.foundLongitude
    );

    // Distance scoring (closer is better)
    if (distance < 1) { // Within 1 mile
      score += weights.location;
    } else if (distance < 5) { // Within 5 miles
      score += weights.location * 0.8;
    } else if (distance < 10) { // Within 10 miles
      score += weights.location * 0.5;
    } else if (distance < 20) { // Within 20 miles
      score += weights.location * 0.3;
    }

    // Time proximity bonus (found soon after lost)
    const timeDiff = Math.abs(foundPet.createdAt - lostPet.createdAt);
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 1) {
      score += 5;
    } else if (daysDiff < 3) {
      score += 3;
    } else if (daysDiff < 7) {
      score += 1;
    }
  }

  // Distinctive Features Match (bonus points)
  if (lostPet.distinctiveFeatures && foundPet.distinctiveFeatures) {
    const lostFeatures = lostPet.distinctiveFeatures.toLowerCase();
    const foundFeatures = foundPet.distinctiveFeatures.toLowerCase();
    
    if (hasCommonFeatures(lostFeatures, foundFeatures)) {
      score += 10; // Bonus for matching distinctive features
    }
  }

  // Microchip Match (highest priority)
  if (lostPet.microchipped && foundPet.microchipFound) {
    if (lostPet.microchipNumber && foundPet.microchipNumber &&
        lostPet.microchipNumber === foundPet.microchipNumber) {
      return 100; // Perfect match with microchip
    }
  }

  return Math.min(Math.round(score), 100);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Check if breeds are similar (e.g., "labrador" and "lab retriever")
const areSimilarBreeds = (breed1, breed2) => {
  const similarBreeds = {
    'labrador': ['lab', 'labrador retriever', 'lab retriever'],
    'german shepherd': ['shepherd', 'gsd', 'alsatian'],
    'golden retriever': ['golden', 'retriever'],
    'poodle': ['toy poodle', 'miniature poodle', 'standard poodle'],
    'bulldog': ['english bulldog', 'british bulldog'],
    'husky': ['siberian husky', 'alaskan husky'],
    'pitbull': ['pit bull', 'american pitbull', 'staffordshire'],
    'chihuahua': ['chi'],
    'dachshund': ['weiner dog', 'wiener dog', 'doxie']
  };

  for (const [key, variants] of Object.entries(similarBreeds)) {
    if ((breed1.includes(key) || variants.some(v => breed1.includes(v))) &&
        (breed2.includes(key) || variants.some(v => breed2.includes(v)))) {
      return true;
    }
  }

  return false;
};

// Check if colors are similar
const areSimilarColors = (color1, color2) => {
  const similarColors = {
    'brown': ['tan', 'chocolate', 'coffee', 'chestnut'],
    'black': ['dark', 'charcoal'],
    'white': ['cream', 'ivory', 'off-white'],
    'gray': ['grey', 'silver', 'slate'],
    'yellow': ['golden', 'blonde', 'cream'],
    'orange': ['ginger', 'red', 'rust']
  };

  for (const [key, variants] of Object.entries(similarColors)) {
    if ((color1.includes(key) || variants.some(v => color1.includes(v))) &&
        (color2.includes(key) || variants.some(v => color2.includes(v)))) {
      return true;
    }
  }

  return false;
};

// Check if sizes are similar
const areSimilarSizes = (size1, size2) => {
  const sizeOrder = ['Small', 'Medium', 'Large', 'X-Large'];
  const index1 = sizeOrder.indexOf(size1);
  const index2 = sizeOrder.indexOf(size2);
  
  if (index1 !== -1 && index2 !== -1) {
    return Math.abs(index1 - index2) === 1; // Adjacent sizes
  }
  
  return false;
};

// Check if distinctive features have common keywords
const hasCommonFeatures = (features1, features2) => {
  const keywords = [
    'scar', 'spot', 'patch', 'marking', 'stripe', 'white',
    'black', 'brown', 'eye', 'ear', 'tail', 'paw', 'collar',
    'tag', 'chip', 'injury', 'limp', 'missing'
  ];

  let matches = 0;
  keywords.forEach(keyword => {
    if (features1.includes(keyword) && features2.includes(keyword)) {
      matches++;
    }
  });

  return matches >= 2;
};

// Get confidence level label
export const getConfidenceLevel = (score) => {
  if (score >= 80) return { level: 'High', color: 'green', label: 'Very Likely Match' };
  if (score >= 60) return { level: 'Medium', color: 'yellow', label: 'Potential Match' };
  if (score >= 40) return { level: 'Low', color: 'orange', label: 'Possible Match' };
  return { level: 'Very Low', color: 'gray', label: 'Unlikely Match' };
};

// Find matches for a lost pet in found pets database
export const findMatches = (lostPet, foundPetsArray) => {
  const matches = foundPetsArray.map(foundPet => {
    const score = calculateMatchScore(lostPet, foundPet);
    return {
      ...foundPet,
      matchScore: score,
      confidence: getConfidenceLevel(score)
    };
  });

  // Filter and sort by score
  return matches
    .filter(match => match.matchScore >= 40) // Only show matches with 40% or higher
    .sort((a, b) => b.matchScore - a.matchScore);
};

// Find matches for a found pet in lost pets database
export const findLostPetMatches = (foundPet, lostPetsArray) => {
  const matches = lostPetsArray.map(lostPet => {
    const score = calculateMatchScore(lostPet, foundPet);
    return {
      ...lostPet,
      matchScore: score,
      confidence: getConfidenceLevel(score)
    };
  });

  return matches
    .filter(match => match.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore);
};
