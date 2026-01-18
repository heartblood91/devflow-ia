import { getPeakHours, type PeakHour } from "@/lib/stats/getPeakHours";
import { describe, expect, it } from "vitest";

describe("getPeakHours", () => {
  describe("bear chronotype", () => {
    it("should return correct peak hours for bear", () => {
      const result = getPeakHours("bear");

      expect(result).toEqual([
        { start: "10:00", end: "12:00" },
        { start: "16:00", end: "18:00" },
      ]);
    });

    it("should return bear hours for BEAR (uppercase)", () => {
      const result = getPeakHours("BEAR");

      expect(result).toEqual([
        { start: "10:00", end: "12:00" },
        { start: "16:00", end: "18:00" },
      ]);
    });

    it("should return bear hours for Bear (mixed case)", () => {
      const result = getPeakHours("Bear");

      expect(result).toEqual([
        { start: "10:00", end: "12:00" },
        { start: "16:00", end: "18:00" },
      ]);
    });
  });

  describe("lion chronotype", () => {
    it("should return correct peak hours for lion", () => {
      const result = getPeakHours("lion");

      expect(result).toEqual([
        { start: "08:00", end: "10:00" },
        { start: "14:00", end: "16:00" },
      ]);
    });
  });

  describe("wolf chronotype", () => {
    it("should return correct peak hours for wolf", () => {
      const result = getPeakHours("wolf");

      expect(result).toEqual([
        { start: "16:00", end: "18:00" },
        { start: "20:00", end: "22:00" },
      ]);
    });
  });

  describe("dolphin chronotype", () => {
    it("should return correct peak hours for dolphin", () => {
      const result = getPeakHours("dolphin");

      expect(result).toEqual([{ start: "10:00", end: "12:00" }]);
    });

    it("should return only one peak window for dolphin", () => {
      const result = getPeakHours("dolphin");

      expect(result).toHaveLength(1);
    });
  });

  describe("default/fallback behavior", () => {
    it("should default to bear for unknown chronotype", () => {
      const result = getPeakHours("unknown");

      expect(result).toEqual([
        { start: "10:00", end: "12:00" },
        { start: "16:00", end: "18:00" },
      ]);
    });

    it("should default to bear for empty string", () => {
      const result = getPeakHours("");

      expect(result).toEqual([
        { start: "10:00", end: "12:00" },
        { start: "16:00", end: "18:00" },
      ]);
    });

    it("should default to bear for invalid type", () => {
      const result = getPeakHours("invalid-chronotype");

      expect(result).toEqual([
        { start: "10:00", end: "12:00" },
        { start: "16:00", end: "18:00" },
      ]);
    });
  });

  describe("return type structure", () => {
    it("should return array of PeakHour objects", () => {
      const result = getPeakHours("bear");

      expect(Array.isArray(result)).toBe(true);
      result.forEach((peak: PeakHour) => {
        expect(peak).toHaveProperty("start");
        expect(peak).toHaveProperty("end");
        expect(typeof peak.start).toBe("string");
        expect(typeof peak.end).toBe("string");
      });
    });

    it("should return hours in HH:mm format", () => {
      const result = getPeakHours("bear");

      result.forEach((peak: PeakHour) => {
        expect(peak.start).toMatch(/^\d{2}:\d{2}$/);
        expect(peak.end).toMatch(/^\d{2}:\d{2}$/);
      });
    });
  });
});
