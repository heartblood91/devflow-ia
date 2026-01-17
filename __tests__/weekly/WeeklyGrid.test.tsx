import { WeeklyGrid } from "@/components/weekly/WeeklyGrid";
import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/setup";

describe("WeeklyGrid", () => {
  const testDate = new Date("2026-01-15"); // Thursday, January 15, 2026

  describe("grid structure", () => {
    it("should render all 7 day columns", () => {
      setup(<WeeklyGrid currentWeek={testDate} />);

      expect(screen.getByText("MON")).toBeInTheDocument();
      expect(screen.getByText("TUE")).toBeInTheDocument();
      expect(screen.getByText("WED")).toBeInTheDocument();
      expect(screen.getByText("THU")).toBeInTheDocument();
      expect(screen.getByText("FRI")).toBeInTheDocument();
      expect(screen.getByText("SAT")).toBeInTheDocument();
      expect(screen.getByText("SUN")).toBeInTheDocument();
    });

    it("should render time slots from 08:00 to 19:00", () => {
      setup(<WeeklyGrid currentWeek={testDate} />);

      expect(screen.getByText("08:00")).toBeInTheDocument();
      expect(screen.getByText("09:00")).toBeInTheDocument();
      expect(screen.getByText("10:00")).toBeInTheDocument();
      expect(screen.getByText("12:00")).toBeInTheDocument();
      expect(screen.getByText("18:00")).toBeInTheDocument();
      expect(screen.getByText("19:00")).toBeInTheDocument();
    });

    it("should display day numbers", () => {
      setup(<WeeklyGrid currentWeek={testDate} />);

      // Week of Jan 15, 2026 starts Monday Jan 12
      expect(screen.getByText("12")).toBeInTheDocument(); // Monday
      expect(screen.getByText("13")).toBeInTheDocument(); // Tuesday
      expect(screen.getByText("18")).toBeInTheDocument(); // Sunday
    });
  });

  describe("work hours background display", () => {
    it("should render weekend OFF zones for Saturday and Sunday", () => {
      setup(<WeeklyGrid currentWeek={testDate} />);

      // There should be two OFF labels for weekend
      const offElements = screen.getAllByText("OFF");
      expect(offElements).toHaveLength(2);
    });

    it("should have different background styles for productive vs non-productive hours", () => {
      const { container } = setup(<WeeklyGrid currentWeek={testDate} />);

      // Check for productive hour cells (bg-primary/10)
      const productiveCells = container.querySelectorAll(".bg-primary\\/10");
      expect(productiveCells.length).toBeGreaterThan(0);

      // Check for non-productive hour cells (bg-muted/5)
      const nonProductiveCells = container.querySelectorAll(".bg-muted\\/5");
      expect(nonProductiveCells.length).toBeGreaterThan(0);
    });

    it("should have hover states on weekday cells", () => {
      const { container } = setup(<WeeklyGrid currentWeek={testDate} />);

      // Check for productive hour hover state
      const productiveHoverCells = container.querySelectorAll(
        ".hover\\:bg-primary\\/15",
      );
      expect(productiveHoverCells.length).toBeGreaterThan(0);

      // Check for non-productive hour hover state
      const nonProductiveHoverCells = container.querySelectorAll(
        ".hover\\:bg-muted\\/10",
      );
      expect(nonProductiveHoverCells.length).toBeGreaterThan(0);
    });
  });

  describe("time blocks integration", () => {
    it("should render with empty time blocks", () => {
      setup(<WeeklyGrid currentWeek={testDate} timeBlocks={null} />);

      // Grid should still render
      expect(screen.getByText("MON")).toBeInTheDocument();
    });

    it("should render with undefined time blocks", () => {
      setup(<WeeklyGrid currentWeek={testDate} timeBlocks={undefined} />);

      // Grid should still render
      expect(screen.getByText("MON")).toBeInTheDocument();
    });
  });

  describe("responsive structure", () => {
    it("should have sticky time column classes", () => {
      const { container } = setup(<WeeklyGrid currentWeek={testDate} />);

      // Check for sticky positioning on time column
      const stickyElements = container.querySelectorAll(".sticky.left-0");
      expect(stickyElements.length).toBeGreaterThan(0);
    });

    it("should have overflow-x-auto for horizontal scrolling", () => {
      const { container } = setup(<WeeklyGrid currentWeek={testDate} />);

      const scrollContainer = container.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();
    });
  });
});
