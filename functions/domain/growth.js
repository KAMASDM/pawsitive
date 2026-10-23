const { randomBytes } = require('node:crypto');
const ID = /^[a-zA-Z0-9_-]{1,128}$/;
const TOKEN = /^[a-zA-Z0-9_-]{43}$/;
const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const token = () => randomBytes(32).toString('base64url');
const photo = value => typeof value === 'string' && value.length <= 350000 && /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(value) ? value : '';
const phone = value => { const result = text(value, 30); if (result && !/^\+?[\d ()-]{6,30}$/.test(result)) throw new Error('Enter a valid contact number.'); return result; };
function safetyCard(input, pet, previous = {}) {
  if (typeof input.enabled !== 'boolean' || typeof input.sharePhoto !== 'boolean' || typeof input.shareBreed !== 'boolean') throw new Error('Review the safety card sharing choices.');
  const contactPhone = phone(input.phone);
  const email = text(input.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid contact email.');
  if (input.enabled && !contactPhone && !email) throw new Error('Choose a phone number or email so a finder can contact you.');
  const config = { revision: Number.isSafeInteger(previous.revision) ? previous.revision + 1 : 1, token: TOKEN.test(previous.token || '') ? previous.token : token(), enabled: input.enabled, phone: contactPhone, email, contactName: text(input.contactName, 60), message: text(input.message, 500), sharePhoto: input.sharePhoto, shareBreed: input.shareBreed };
  // This projection is intentionally independent of the social profile's visibility.
  const card = { name: text(pet.name, 60) || 'A much-loved pet', type: text(pet.type, 30), contactName: config.contactName, phone: contactPhone, email, message: config.message };
  if (config.shareBreed) card.breed = text(pet.breed, 80);
  if (config.sharePhoto && (photo(pet.image) || (typeof pet.image === 'string' && pet.image.length <= 2048 && /^https:\/\//.test(pet.image)))) card.image = pet.image;
  return { config, card };
}
function publicWeek(input, pet, events, days, endDate) {
  if (typeof input.includeCareCount !== 'boolean') throw new Error('Review the care-count sharing choice.');
  if (!Array.isArray(input.milestoneIds) || input.milestoneIds.length > 5 || input.milestoneIds.some(id => !ID.test(id))) throw new Error('Choose up to five milestones.');
  const startDate = new Date(Date.parse(`${endDate}T12:00:00Z`) - 6 * 86400000).toISOString().slice(0, 10);
  const types = new Set(['birthday', 'adoption', 'achievement', 'milestone', 'grooming', 'training']);
  const milestones = [...new Set(input.milestoneIds)].map(id => events?.[id]).filter(event => event && types.has(event.type) && typeof event.date === 'string' && event.date.slice(0, 10) >= startDate && event.date.slice(0, 10) <= endDate).map(event => text(event.title, 100));
  const result = { name: text(pet.name, 60) || 'My pet', caption: text(input.caption, 280), startDate, endDate, milestones };
  if (input.photo && !photo(input.photo)) throw new Error('Choose a smaller JPEG, PNG or WebP photo.');
  if (input.photo) result.photo = input.photo;
  if (input.includeCareCount) result.careCount = Object.entries(days || {}).filter(([date]) => date >= startDate && date <= endDate).reduce((total, [, records]) => total + Object.values(records || {}).filter(record => record?.petId === input.petId && record.status === 'done').length, 0);
  return result;
}
module.exports = { ID, TOKEN, token, safetyCard, publicWeek, photo };
