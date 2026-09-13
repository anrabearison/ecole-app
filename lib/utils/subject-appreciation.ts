import type { SubjectLanguage } from "@prisma/client"

// Appreciation thresholds for subject appreciation
const APPRECIATION_THRESHOLDS = {
  VERY_GOOD: 16,
  GOOD: 14,
  FAIRLY_GOOD: 12,
  SATISFACTORY: 10,
  INSUFFICIENT_UPPER: 9,
  INSUFFICIENT_LOWER: 7,
  POOR_UPPER: 7,
  POOR_LOWER: 5,
} as const

// Translations by language
const APPRECIATION_TRANSLATIONS: Record<SubjectLanguage, Record<string, string>> = {
  FRENCH: {
    VERY_GOOD: "Très bien",
    GOOD: "Bien",
    FAIRLY_GOOD: "Assez bien",
    SATISFACTORY: "Passable",
    INSUFFICIENT: "Insuffisant",
    POOR: "Faible",
    VERY_POOR: "Médiocre",
  },
  ENGLISH: {
    VERY_GOOD: "Very Good",
    GOOD: "Good",
    FAIRLY_GOOD: "Fairly Good",
    SATISFACTORY: "Satisfactory",
    INSUFFICIENT: "Insufficient",
    POOR: "Poor",
    VERY_POOR: "Very Poor",
  },
  MALAGASY: {
    VERY_GOOD: "Tsara be",
    GOOD: "Tena Tsara",
    FAIRLY_GOOD: "Tsara",
    SATISFACTORY: "Antonony",
    INSUFFICIENT: "Tsy ampy",
    POOR: "Ratsy",
    VERY_POOR: "Tenaratsy",
  },
  SPANISH: {
    VERY_GOOD: "Muy Bien",
    GOOD: "Bien",
    FAIRLY_GOOD: "Bastante Bien",
    SATISFACTORY: "Suficiente",
    INSUFFICIENT: "Insuficiente",
    POOR: "Mal",
    VERY_POOR: "Muy Mal",
  },
  GERMAN: {
    VERY_GOOD: "Sehr Gut",
    GOOD: "Gut",
    FAIRLY_GOOD: "Befriedigend",
    SATISFACTORY: "Ausreichend",
    INSUFFICIENT: "Mangelhaft",
    POOR: "Ungenügend",
    VERY_POOR: "Unzureichend",
  },
}

/**
 * Calculate subject appreciation based on average and subject language
 * Uses 7-level scale for subject appreciation
 * Returns translated text based on subject language
 */
export function calculateSubjectAppreciation(
  average: number,
  language: SubjectLanguage = "FRENCH"
): string {
  // Determine appreciation level
  let level: string
  if (average > APPRECIATION_THRESHOLDS.VERY_GOOD) level = "VERY_GOOD"
  else if (average >= APPRECIATION_THRESHOLDS.GOOD) level = "GOOD"
  else if (average >= APPRECIATION_THRESHOLDS.FAIRLY_GOOD) level = "FAIRLY_GOOD"
  else if (average >= APPRECIATION_THRESHOLDS.SATISFACTORY) level = "SATISFACTORY"
  else if (average >= APPRECIATION_THRESHOLDS.INSUFFICIENT_LOWER) level = "INSUFFICIENT"
  else if (average >= APPRECIATION_THRESHOLDS.POOR_LOWER) level = "POOR"
  else level = "VERY_POOR"

  // Return translated appreciation
  return APPRECIATION_TRANSLATIONS[language][level]
}
