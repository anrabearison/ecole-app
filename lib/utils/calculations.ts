import type { SubjectAverage } from "@/lib/actions/average"

/**
 * Calculate appreciation based on average thresholds
 * - EXCELLENT: >= 16
 * - HONOR_ROLL: ]14 - 16]
 * - ENCOURAGEMENT: ]10 - 14]
 * - INSUFFICIENT: ]8 - 10]
 * - WARNING: ]6 - 8]
 * - BLAME: <= 6
 */
export function calculateAppreciation(average: number): string {
  if (average >= 16) return "EXCELLENT"
  if (average > 14) return "HONOR_ROLL"
  if (average > 10) return "ENCOURAGEMENT"
  if (average > 8) return "INSUFFICIENT"
  if (average > 6) return "WARNING"
  return "BLAME"
}

/**
 * Calculate total of weighted notes (sum of coefficient * average)
 */
export function calculateTotalNotes(subjectAverages: SubjectAverage[]): number {
  return subjectAverages.reduce((total, subject) => {
    return total + (subject.average * subject.coefficient)
  }, 0)
}

/**
 * Calculate total coefficients
 */
export function calculateTotalCoefficients(subjectAverages: SubjectAverage[]): number {
  return subjectAverages.reduce((total, subject) => {
    return total + subject.coefficient
  }, 0)
}
