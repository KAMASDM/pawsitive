import { getISOWeek, getISOWeekYear } from "date-fns";

/**
 * Returns an ISO week string like "2026-W16"
 */
export function getWeekId(date = new Date()) {
  const week = getISOWeek(date);
  const year = getISOWeekYear(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Returns the Monday of the ISO week for a given weekId string.
 */
export function mondayOfWeek(weekId) {
  const [year, wStr] = weekId.split("-W");
  const week = parseInt(wStr, 10);
  // Jan 4 is always in week 1
  const jan4 = new Date(parseInt(year, 10), 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // make Sunday = 7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (dayOfWeek - 1) + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
