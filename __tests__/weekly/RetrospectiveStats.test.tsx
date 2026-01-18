import { RetrospectiveStats } from "@/components/weekly/RetrospectiveStats";
import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { setup } from "../../test/setup";

// Mock the DevFlowAIInsights component to avoid needing to mock AI actions
vi.mock("@/components/weekly/DevFlowAIInsights", () => ({
  DevFlowAIInsights: () => (
    <div data-testid="mock-ai-insights">AI Insights (Mocked)</div>
  ),
}));

// Mock the resolveActionResult helper to return our mock data
vi.mock("@/lib/actions/actions-utils", () => ({
  resolveActionResult: vi.fn(),
}));

// Mock the server action
vi.mock("@/lib/actions/getWeeklyStats.action", () => ({
  getWeeklyStatsAction: vi.fn(),
}));

const mockStats = {
  completedTasks: 5,
  totalTasks: 10,
  skippedTasks: 5,
  totalHours: 15.5,
  maxHours: 20,
  rescueUsed: 1,
  rescueMax: 2,
  avgFocusQuality: 8,
  avgEnergyLevel: 7,
};

describe("RetrospectiveStats", () => {
  const testDate = new Date("2026-01-15");

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import and mock resolveActionResult to return stats
    const { resolveActionResult } = await import("@/lib/actions/actions-utils");
    vi.mocked(resolveActionResult).mockResolvedValue(mockStats);
  });

  it("should display title", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      expect(screen.getByText("Weekly Retrospective")).toBeInTheDocument();
    });
  });

  it("should display tasks completed metric", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      expect(screen.getByText("5/10")).toBeInTheDocument();
      expect(screen.getByText("Tasks Completed")).toBeInTheDocument();
    });
  });

  it("should display total hours metric", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      expect(screen.getByText("15.5h")).toBeInTheDocument();
      expect(screen.getByText("Total Hours")).toBeInTheDocument();
    });
  });

  it("should display rescue slots metric", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      expect(screen.getByText("1/2")).toBeInTheDocument();
      expect(screen.getByText("Rescue Slots")).toBeInTheDocument();
    });
  });

  it("should display skipped tasks metric", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      // Find the Skipped Tasks label first, then verify it's in the document
      expect(screen.getByText("Skipped Tasks")).toBeInTheDocument();
      // The value "5" appears in multiple places (5/10, 5, 15.5h)
      // We verify by checking the label exists and expecting the correct value in the card
      const skippedTasksLabel = screen.getByText("Skipped Tasks");
      const statCard = skippedTasksLabel.closest("div")?.parentElement;
      expect(statCard).toHaveTextContent("5");
    });
  });

  it("should display focus quality metric", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("Focus Quality")).toBeInTheDocument();
    });
  });

  it("should display energy level metric", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("Energy Level")).toBeInTheDocument();
    });
  });

  it("should display all 6 stat cards", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      const labels = [
        "Tasks Completed",
        "Total Hours",
        "Rescue Slots",
        "Skipped Tasks",
        "Focus Quality",
        "Energy Level",
      ];

      labels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  it("should display percentages for metrics with percentages", async () => {
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    await waitFor(() => {
      // Tasks Completed (50%) and Rescue Slots (50%) both have 50%
      const percentages = screen.getAllByText("50%");
      expect(percentages.length).toBe(2);

      // Total Hours percentage (78%)
      expect(screen.getByText("78%")).toBeInTheDocument();
    });
  });

  it("should display placeholder values when stats are loading", () => {
    // Before async data loads, component shows placeholders
    setup(<RetrospectiveStats weekStartDate={testDate} />);

    // Initially, should show dash placeholders
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });
});
