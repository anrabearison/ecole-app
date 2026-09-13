import { describe, it, expect } from "vitest"
import { calculateSubjectAppreciation } from "./subject-appreciation"
import type { SubjectLanguage } from "@prisma/client"

describe("calculateSubjectAppreciation", () => {
  it("should return FRENCH appreciation for VERY_GOOD threshold (> 16)", () => {
    expect(calculateSubjectAppreciation(16.01, "FRENCH")).toBe("TRES BIEN")
    expect(calculateSubjectAppreciation(18, "FRENCH")).toBe("TRES BIEN")
  })

  it("should return FRENCH appreciation for GOOD threshold ([14 - 16])", () => {
    expect(calculateSubjectAppreciation(16, "FRENCH")).toBe("Bien")
    expect(calculateSubjectAppreciation(15, "FRENCH")).toBe("Bien")
    expect(calculateSubjectAppreciation(14, "FRENCH")).toBe("Bien")
  })

  it("should return FRENCH appreciation for FAIRLY_GOOD threshold ([12 - 14])", () => {
    expect(calculateSubjectAppreciation(13.99, "FRENCH")).toBe("Assez bien")
    expect(calculateSubjectAppreciation(12, "FRENCH")).toBe("Assez bien")
  })

  it("should return FRENCH appreciation for SATISFACTORY threshold ([10 - 12])", () => {
    expect(calculateSubjectAppreciation(11.99, "FRENCH")).toBe("Passable")
    expect(calculateSubjectAppreciation(10, "FRENCH")).toBe("Passable")
  })

  it("should return FRENCH appreciation for INSUFFICIENT threshold ([7 - 9])", () => {
    expect(calculateSubjectAppreciation(9, "FRENCH")).toBe("Insuffisant")
    expect(calculateSubjectAppreciation(8, "FRENCH")).toBe("Insuffisant")
    expect(calculateSubjectAppreciation(7, "FRENCH")).toBe("Insuffisant")
  })

  it("should return FRENCH appreciation for POOR threshold ([5 - 7])", () => {
    expect(calculateSubjectAppreciation(6.99, "FRENCH")).toBe("Faible")
    expect(calculateSubjectAppreciation(6, "FRENCH")).toBe("Faible")
    expect(calculateSubjectAppreciation(5, "FRENCH")).toBe("Faible")
  })

  it("should return FRENCH appreciation for VERY_POOR threshold (< 5)", () => {
    expect(calculateSubjectAppreciation(4.99, "FRENCH")).toBe("Médiocre")
    expect(calculateSubjectAppreciation(4, "FRENCH")).toBe("Médiocre")
    expect(calculateSubjectAppreciation(0, "FRENCH")).toBe("Médiocre")
  })

  it("should return ENGLISH appreciation", () => {
    expect(calculateSubjectAppreciation(17, "ENGLISH")).toBe("Very Good")
    expect(calculateSubjectAppreciation(15, "ENGLISH")).toBe("Good")
    expect(calculateSubjectAppreciation(13, "ENGLISH")).toBe("Fairly Good")
    expect(calculateSubjectAppreciation(11, "ENGLISH")).toBe("Satisfactory")
    expect(calculateSubjectAppreciation(8, "ENGLISH")).toBe("Insufficient")
    expect(calculateSubjectAppreciation(6, "ENGLISH")).toBe("Poor")
    expect(calculateSubjectAppreciation(4, "ENGLISH")).toBe("Very Poor")
  })

  it("should return MALAGASY appreciation", () => {
    expect(calculateSubjectAppreciation(17, "MALAGASY")).toBe("Tsara be")
    expect(calculateSubjectAppreciation(15, "MALAGASY")).toBe("Tena Tsara")
    expect(calculateSubjectAppreciation(13, "MALAGASY")).toBe("Tsara")
    expect(calculateSubjectAppreciation(11, "MALAGASY")).toBe("Antonony")
    expect(calculateSubjectAppreciation(8, "MALAGASY")).toBe("Tsy ampy")
    expect(calculateSubjectAppreciation(6, "MALAGASY")).toBe("Ratsy")
    expect(calculateSubjectAppreciation(4, "MALAGASY")).toBe("Tenaratsy")
  })

  it("should return SPANISH appreciation", () => {
    expect(calculateSubjectAppreciation(17, "SPANISH")).toBe("Muy Bien")
    expect(calculateSubjectAppreciation(15, "SPANISH")).toBe("Bien")
    expect(calculateSubjectAppreciation(13, "SPANISH")).toBe("Bastante Bien")
    expect(calculateSubjectAppreciation(11, "SPANISH")).toBe("Suficiente")
    expect(calculateSubjectAppreciation(8, "SPANISH")).toBe("Insuficiente")
    expect(calculateSubjectAppreciation(6, "SPANISH")).toBe("Mal")
    expect(calculateSubjectAppreciation(4, "SPANISH")).toBe("Muy Mal")
  })

  it("should return GERMAN appreciation", () => {
    expect(calculateSubjectAppreciation(17, "GERMAN")).toBe("Sehr Gut")
    expect(calculateSubjectAppreciation(15, "GERMAN")).toBe("Gut")
    expect(calculateSubjectAppreciation(13, "GERMAN")).toBe("Befriedigend")
    expect(calculateSubjectAppreciation(11, "GERMAN")).toBe("Ausreichend")
    expect(calculateSubjectAppreciation(8, "GERMAN")).toBe("Mangelhaft")
    expect(calculateSubjectAppreciation(6, "GERMAN")).toBe("Ungenügend")
    expect(calculateSubjectAppreciation(4, "GERMAN")).toBe("Unzureichend")
  })

  it("should default to FRENCH when language is not specified", () => {
    expect(calculateSubjectAppreciation(17)).toBe("TRES BIEN")
    expect(calculateSubjectAppreciation(15)).toBe("Bien")
    expect(calculateSubjectAppreciation(4)).toBe("Médiocre")
  })

  it("should handle boundary values correctly", () => {
    // EXACT boundary at 16
    expect(calculateSubjectAppreciation(16, "FRENCH")).toBe("Bien")
    // Just above 16
    expect(calculateSubjectAppreciation(16.01, "FRENCH")).toBe("TRES BIEN")
    // EXACT boundary at 14
    expect(calculateSubjectAppreciation(14, "FRENCH")).toBe("Bien")
    // Just below 14
    expect(calculateSubjectAppreciation(13.99, "FRENCH")).toBe("Assez bien")
    // EXACT boundary at 12
    expect(calculateSubjectAppreciation(12, "FRENCH")).toBe("Assez bien")
    // Just below 12
    expect(calculateSubjectAppreciation(11.99, "FRENCH")).toBe("Passable")
    // EXACT boundary at 10
    expect(calculateSubjectAppreciation(10, "FRENCH")).toBe("Passable")
    // Just below 10
    expect(calculateSubjectAppreciation(9.99, "FRENCH")).toBe("Insuffisant")
    // EXACT boundary at 9
    expect(calculateSubjectAppreciation(9, "FRENCH")).toBe("Insuffisant")
    // EXACT boundary at 7
    expect(calculateSubjectAppreciation(7, "FRENCH")).toBe("Insuffisant")
    // Just below 7
    expect(calculateSubjectAppreciation(6.99, "FRENCH")).toBe("Faible")
    // EXACT boundary at 5
    expect(calculateSubjectAppreciation(5, "FRENCH")).toBe("Faible")
    // Just below 5
    expect(calculateSubjectAppreciation(4.99, "FRENCH")).toBe("Médiocre")
  })
})
