/**
 * Pet Age Calculator Utility
 * Calculates pet age in human years and determines life stage with milestones
 */

/**
 * Calculate dog age in human years
 * Formula: First 2 years = 10.5 human years each, then 4 years per year after
 * @param {number} ageInYears - Dog's age in years
 * @param {number} ageInMonths - Additional months
 * @returns {number} Age in human years
 */
export const calculateDogAge = (ageInYears, ageInMonths = 0) => {
  const totalMonths = (ageInYears * 12) + ageInMonths;
  const totalYears = totalMonths / 12;

  if (totalYears <= 1) {
    // First year: 15 human years
    return Math.round(totalYears * 15);
  } else if (totalYears <= 2) {
    // Second year: 9 human years
    return Math.round(15 + ((totalYears - 1) * 9));
  } else {
    // After 2 years: 4-5 human years per year (average 4.5)
    return Math.round(24 + ((totalYears - 2) * 4.5));
  }
};

/**
 * Calculate cat age in human years
 * Formula: First year = 15, second year = 9, then 4 years per year after
 * @param {number} ageInYears - Cat's age in years
 * @param {number} ageInMonths - Additional months
 * @returns {number} Age in human years
 */
export const calculateCatAge = (ageInYears, ageInMonths = 0) => {
  const totalMonths = (ageInYears * 12) + ageInMonths;
  const totalYears = totalMonths / 12;

  if (totalYears <= 1) {
    // First year: 15 human years
    return Math.round(totalYears * 15);
  } else if (totalYears <= 2) {
    // Second year: 9 human years
    return Math.round(15 + ((totalYears - 1) * 9));
  } else {
    // After 2 years: 4 human years per year
    return Math.round(24 + ((totalYears - 2) * 4));
  }
};

/**
 * Get dog life stage based on age
 * @param {number} ageInYears - Dog's age in years
 * @returns {object} Life stage info
 */
export const getDogLifeStage = (ageInYears) => {
  if (ageInYears < 0.5) {
    return {
      stage: 'Puppy',
      emoji: '🐕',
      color: 'from-blue-400 to-cyan-400',
      description: 'Rapid growth and development phase',
      tips: [
        'Start socialization and basic training',
        'Frequent vet checkups for vaccinations',
        'High-energy puppy food required',
        'Puppy-proof your home'
      ]
    };
  } else if (ageInYears < 1) {
    return {
      stage: 'Young Puppy',
      emoji: '🐕',
      color: 'from-blue-400 to-indigo-400',
      description: 'Learning and socializing',
      tips: [
        'Continue training and socialization',
        'Complete vaccination series',
        'Begin leash training',
        'Establish routines'
      ]
    };
  } else if (ageInYears < 3) {
    return {
      stage: 'Adolescent',
      emoji: '🐶',
      color: 'from-indigo-400 to-violet-400',
      description: 'High energy and playful',
      tips: [
        'Continue obedience training',
        'Provide plenty of exercise',
        'Consider spaying/neutering',
        'Regular dental care'
      ]
    };
  } else if (ageInYears < 7) {
    return {
      stage: 'Adult',
      emoji: '🦮',
      color: 'from-violet-400 to-purple-400',
      description: 'Prime of life, fully mature',
      tips: [
        'Maintain regular exercise routine',
        'Annual vet checkups',
        'Monitor weight and diet',
        'Continue mental stimulation'
      ]
    };
  } else if (ageInYears < 10) {
    return {
      stage: 'Mature Adult',
      emoji: '🐕‍🦺',
      color: 'from-purple-400 to-pink-400',
      description: 'Slowing down slightly',
      tips: [
        'Watch for signs of aging',
        'Adjust exercise as needed',
        'Senior wellness exams',
        'Joint health supplements'
      ]
    };
  } else {
    return {
      stage: 'Senior',
      emoji: '🦴',
      color: 'from-orange-400 to-amber-400',
      description: 'Golden years - extra care needed',
      tips: [
        'Bi-annual vet checkups',
        'Senior-specific diet',
        'Gentle exercise',
        'Monitor for age-related issues',
        'Extra comfort and love'
      ]
    };
  }
};

/**
 * Get cat life stage based on age
 * @param {number} ageInYears - Cat's age in years
 * @returns {object} Life stage info
 */
export const getCatLifeStage = (ageInYears) => {
  if (ageInYears < 0.5) {
    return {
      stage: 'Kitten',
      emoji: '🐱',
      color: 'from-pink-400 to-rose-400',
      description: 'Playful and curious',
      tips: [
        'Provide safe toys and environment',
        'Start litter training',
        'Kitten vaccination series',
        'High-protein kitten food'
      ]
    };
  } else if (ageInYears < 1) {
    return {
      stage: 'Young Kitten',
      emoji: '🐱',
      color: 'from-pink-400 to-purple-400',
      description: 'Growing and exploring',
      tips: [
        'Complete vaccination schedule',
        'Begin grooming routine',
        'Provide scratching posts',
        'Socialization training'
      ]
    };
  } else if (ageInYears < 3) {
    return {
      stage: 'Junior',
      emoji: '😺',
      color: 'from-violet-400 to-indigo-400',
      description: 'Active and playful',
      tips: [
        'Maintain play and exercise',
        'Consider spaying/neutering',
        'Dental care routine',
        'Regular vet checkups'
      ]
    };
  } else if (ageInYears < 7) {
    return {
      stage: 'Prime',
      emoji: '😸',
      color: 'from-indigo-400 to-blue-400',
      description: 'Peak physical condition',
      tips: [
        'Annual health screenings',
        'Maintain healthy weight',
        'Interactive play sessions',
        'Monitor behavior changes'
      ]
    };
  } else if (ageInYears < 11) {
    return {
      stage: 'Mature',
      emoji: '😺',
      color: 'from-purple-400 to-violet-400',
      description: 'Middle-aged, still active',
      tips: [
        'Watch for early aging signs',
        'Senior wellness checks',
        'Adjust diet if needed',
        'Monitor for common issues'
      ]
    };
  } else if (ageInYears < 15) {
    return {
      stage: 'Senior',
      emoji: '🐈',
      color: 'from-orange-400 to-yellow-400',
      description: 'Slowing down, needs care',
      tips: [
        'Bi-annual vet visits',
        'Senior cat food',
        'Watch for arthritis',
        'Keep litter box accessible',
        'Extra warmth and comfort'
      ]
    };
  } else {
    return {
      stage: 'Geriatric',
      emoji: '🐈‍⬛',
      color: 'from-amber-400 to-orange-400',
      description: 'Golden years - special care',
      tips: [
        'Frequent vet monitoring',
        'Easy access to food/water',
        'Soft bedding',
        'Manage chronic conditions',
        'Lots of gentle affection'
      ]
    };
  }
};

/**
 * Calculate pet age from date of birth
 * @param {string} dateOfBirth - ISO date string
 * @returns {object} Age object with years and months
 */
export const calculateAgeFromDOB = (dateOfBirth) => {
  if (!dateOfBirth) return { years: 0, months: 0 };

  const dob = new Date(dateOfBirth);
  const today = new Date();
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Adjust if day hasn't occurred yet this month
  if (today.getDate() < dob.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  
  return { years, months };
};

/**
 * Main function to get complete age information
 * @param {string} petType - 'dog' or 'cat'
 * @param {string} dateOfBirth - ISO date string
 * @returns {object} Complete age info
 */
export const getPetAgeInfo = (petType, dateOfBirth) => {
  const age = calculateAgeFromDOB(dateOfBirth);
  const isPet = petType?.toLowerCase();
  
  let humanAge, lifeStage;
  
  if (isPet === 'dog') {
    humanAge = calculateDogAge(age.years, age.months);
    lifeStage = getDogLifeStage(age.years + (age.months / 12));
  } else if (isPet === 'cat') {
    humanAge = calculateCatAge(age.years, age.months);
    lifeStage = getCatLifeStage(age.years + (age.months / 12));
  } else {
    // Default to dog calculation for other pets
    humanAge = calculateDogAge(age.years, age.months);
    lifeStage = {
      stage: 'Unknown',
      emoji: '🐾',
      color: 'from-gray-400 to-gray-500',
      description: 'Pet age information',
      tips: []
    };
  }
  
  return {
    actualAge: age,
    humanAge,
    lifeStage,
    formattedAge: age.years > 0 
      ? `${age.years} year${age.years !== 1 ? 's' : ''}${age.months > 0 ? `, ${age.months} month${age.months !== 1 ? 's' : ''}` : ''}`
      : `${age.months} month${age.months !== 1 ? 's' : ''}`
  };
};
