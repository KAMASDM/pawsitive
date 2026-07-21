import { describe, expect, it } from "vitest";
import { calculateMatchScore, findMatches, getConfidenceLevel } from "../src/utils/matchingAlgorithm";
import { calculateCatAge, calculateDogAge } from "../src/utils/petAgeCalculator";
import { quizStars, quizXP, XP } from "../src/utils/xpSystem";
import { getWeekId, mondayOfWeek } from "../src/utils/getWeekId";

describe("pet age calculations", () => {
  it("keeps the published dog and cat age formulas stable", () => {
    expect(calculateDogAge(1)).toBe(15);
    expect(calculateDogAge(2)).toBe(24);
    expect(calculateCatAge(3)).toBe(28);
  });
});

describe("lost and found matching", () => {
  const lostPet = {
    petType: "dog",
    breed: "Labrador",
    primaryColor: "brown",
    size: "Large",
    gender: "male",
    microchipped: true,
    microchipNumber: "CHIP-123",
    createdAt: 1_700_000_000_000,
  };

  it("treats an exact microchip match as definitive", () => {
    expect(calculateMatchScore(lostPet, {
      petType: "dog",
      approximateBreed: "Labrador",
      primaryColor: "brown",
      size: "Large",
      gender: "male",
      microchipFound: true,
      microchipNumber: "CHIP-123",
      createdAt: lostPet.createdAt,
    })).toBe(100);
  });

  it("filters weak candidates and orders viable matches", () => {
    const matches = findMatches(lostPet, [
      { id: "weak", petType: "cat" },
      { id: "strong", petType: "dog", approximateBreed: "lab retriever", primaryColor: "tan", size: "Large", gender: "male" },
    ]);
    expect(matches.map((match) => match.id)).toEqual(["strong"]);
    expect(getConfidenceLevel(matches[0].matchScore).level).not.toBe("Very Low");
  });
});

describe("quiz progression", () => {
  it("awards the perfect-score bonus only for a perfect result", () => {
    expect(quizXP(4)).toBe(XP.QUIZ_COMPLETED);
    expect(quizXP(5)).toBe(XP.QUIZ_COMPLETED + XP.QUIZ_PERFECT);
    expect(quizStars(5)).toBe(3);
    expect(quizStars(3)).toBe(2);
  });

  it("uses stable ISO week identifiers", () => {
    expect(getWeekId(new Date("2026-01-05T12:00:00Z"))).toBe("2026-W02");
    expect(mondayOfWeek("2026-W02").getDay()).toBe(1);
  });
});
