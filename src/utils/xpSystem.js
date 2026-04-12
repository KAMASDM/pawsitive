/**
 * XP values for every user action.
 */
export const XP = {
  QUIZ_COMPLETED: 15,
  QUIZ_PERFECT: 10,          // bonus on top of QUIZ_COMPLETED
  CHALLENGE_SUBMITTED: 20,
  CHALLENGE_VOTE_RECEIVED: 2,
  CHALLENGE_WON: 100,
  SHARE_CARD: 5,
};

/**
 * Calculate XP for a quiz result.
 */
export function quizXP(score) {
  let xp = XP.QUIZ_COMPLETED;
  if (score === 5) xp += XP.QUIZ_PERFECT;
  return xp;
}

/**
 * Returns star count (1–3) for a quiz score out of 5.
 */
export function quizStars(score) {
  if (score === 5) return 3;
  if (score >= 3) return 2;
  return 1;
}

/**
 * Returns star label for a quiz star count.
 */
export const STAR_LABELS = {
  3: "Pawfect Score!",
  2: "Great Job!",
  1: "Keep Practising!",
};
