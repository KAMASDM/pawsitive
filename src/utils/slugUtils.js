/**
 * Utility functions for generating and managing pet profile slugs
 */

import { ref, get, set, remove } from 'firebase/database';

/**
 * Generate a URL-friendly slug from pet name
 * @param {string} name - Pet name
 * @returns {string} - URL-friendly slug
 */
export const generateSlugFromName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Check if slug exists in database
 * @param {object} database - Firebase database reference
 * @param {string} slug - Slug to check
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
export const slugExists = async (database, slug) => {
  try {
    const slugRef = ref(database, `petSlugs/${slug}`);
    const snapshot = await get(slugRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking slug:', error);
    return false;
  }
};

/**
 * Generate unique slug by appending number if duplicate exists
 * @param {object} database - Firebase database reference
 * @param {string} baseName - Pet name to create slug from
 * @param {string} petId - Pet ID (to skip checking against itself)
 * @returns {Promise<string>} - Unique slug
 */
export const generateUniqueSlug = async (database, baseName, petId = null) => {
  const baseSlug = generateSlugFromName(baseName);
  let slug = baseSlug;
  let counter = 2;
  
  while (await slugExists(database, slug)) {
    // Check if this slug belongs to the current pet (editing existing pet)
    const slugRef = ref(database, `petSlugs/${slug}`);
    const snapshot = await get(slugRef);
    
    if (snapshot.exists() && snapshot.val() === petId) {
      // This slug already belongs to this pet, we can use it
      break;
    }
    
    // Generate new slug with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

/**
 * Save slug to Firebase (creates index for fast lookups)
 * @param {object} database - Firebase database reference
 * @param {string} slug - Slug to save
 * @param {string} petId - Pet ID
 * @returns {Promise<void>}
 */
export const saveSlugToDatabase = async (database, slug, petId) => {
  try {
    const slugRef = ref(database, `petSlugs/${slug}`);
    await set(slugRef, petId);
  } catch (error) {
    console.error('Error saving slug:', error);
    throw error;
  }
};

/**
 * Get pet ID from slug
 * @param {object} database - Firebase database reference
 * @param {string} slug - Slug to lookup
 * @returns {Promise<string|null>} - Pet ID or null if not found
 */
export const getPetIdFromSlug = async (database, slug) => {
  try {
    const slugRef = ref(database, `petSlugs/${slug}`);
    const snapshot = await get(slugRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting pet ID from slug:', error);
    return null;
  }
};

/**
 * Delete slug from database
 * @param {object} database - Firebase database reference
 * @param {string} slug - Slug to delete
 * @returns {Promise<void>}
 */
export const deleteSlug = async (database, slug) => {
  try {
    const slugRef = ref(database, `petSlugs/${slug}`);
    await remove(slugRef);
  } catch (error) {
    console.error('Error deleting slug:', error);
    throw error;
  }
};
