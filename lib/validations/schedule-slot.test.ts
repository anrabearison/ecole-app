import { describe, it, expect } from "vitest"
import { overlapsBreak, generateTimeSlots, timeToMinutes } from "./schedule-slot"
import { scheduleSettingsSchema } from "./school"

describe("Schedule Slot Validations & Helpers", () => {
  describe("overlapsBreak", () => {
    it("should return true when slot is inside lunch break", () => {
      expect(overlapsBreak("12:30", "13:30", "12:00", "14:00")).toBe(true)
    })

    it("should return true when slot starts before break and ends inside break", () => {
      expect(overlapsBreak("11:30", "12:30", "12:00", "14:00")).toBe(true)
    })

    it("should return false when slot ends exactly when break starts", () => {
      expect(overlapsBreak("11:00", "12:00", "12:00", "14:00")).toBe(false)
    })

    it("should return false when slot starts exactly when break ends", () => {
      expect(overlapsBreak("14:00", "15:00", "12:00", "14:00")).toBe(false)
    })
  })

  describe("generateTimeSlots", () => {
    it("should generate 1h time slots and flag break slots correctly", () => {
      const slots = generateTimeSlots("07:00", "12:00", "14:00", "18:00", 60)
      
      expect(slots).toHaveLength(11) // 7h, 8h, 9h, 10h, 11h, 12h(break), 13h(break), 14h, 15h, 16h, 17h
      expect(slots[0]).toEqual({ value: "07:00", label: "07:00", isBreak: false })
      expect(slots[5]).toEqual({ value: "12:00", label: "12:00", isBreak: true })
      expect(slots[6]).toEqual({ value: "13:00", label: "13:00", isBreak: true })
      expect(slots[7]).toEqual({ value: "14:00", label: "14:00", isBreak: false })
    })
  })

  describe("scheduleSettingsSchema", () => {
    it("should validate a correct schedule timeline", () => {
      const result = scheduleSettingsSchema.safeParse({
        scheduleStartTime: "07:00",
        morningEndTime: "12:00",
        afternoonStartTime: "14:00",
        scheduleEndTime: "18:00",
        slotDurationMinutes: 60,
      })
      expect(result.success).toBe(true)
    })

    it("should fail validation if morning end is after afternoon start", () => {
      const result = scheduleSettingsSchema.safeParse({
        scheduleStartTime: "07:00",
        morningEndTime: "14:30",
        afternoonStartTime: "14:00",
        scheduleEndTime: "18:00",
        slotDurationMinutes: 60,
      })
      expect(result.success).toBe(false)
    })
  })
})
