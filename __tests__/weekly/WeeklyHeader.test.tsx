import { WeeklyHeader } from "@/components/weekly/WeeklyHeader";
import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { addWeeks, subWeeks } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setup } from "../../test/setup";

describe("WeeklyHeader", () => {
  const mockOnWeekChange = vi.fn();
  const testDate = new Date("2026-01-15"); // Thursday, January 15, 2026

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display 'Week of' title", () => {
    setup(<WeeklyHeader currentWeek={testDate} />);

    expect(screen.getByText("Week of")).toBeInTheDocument();
  });

  it("should display the week range for same month", () => {
    setup(<WeeklyHeader currentWeek={testDate} />);

    // Week of Jan 15, 2026 is Monday Jan 12 - Sunday Jan 18
    expect(screen.getByText(/January 12 - 18, 2026/)).toBeInTheDocument();
  });

  it("should display the week range for cross-month", () => {
    // Week that spans January-February
    const crossMonthDate = new Date("2026-01-30");
    setup(<WeeklyHeader currentWeek={crossMonthDate} />);

    // Week of Jan 30, 2026 is Monday Jan 26 - Sunday Feb 1
    expect(
      screen.getByText(/January 26 - February 1, 2026/),
    ).toBeInTheDocument();
  });

  it("should render navigation buttons", () => {
    setup(
      <WeeklyHeader currentWeek={testDate} onWeekChange={mockOnWeekChange} />,
    );

    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("should call onWeekChange with previous week when clicking prev button", async () => {
    const { user } = setup(
      <WeeklyHeader currentWeek={testDate} onWeekChange={mockOnWeekChange} />,
    );

    const prevButton = screen.getByRole("button", { name: /previous/i });
    await user.click(prevButton);

    expect(mockOnWeekChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnWeekChange.mock.calls[0][0];
    expect(calledDate.getTime()).toBe(subWeeks(testDate, 1).getTime());
  });

  it("should call onWeekChange with next week when clicking next button", async () => {
    const { user } = setup(
      <WeeklyHeader currentWeek={testDate} onWeekChange={mockOnWeekChange} />,
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    expect(mockOnWeekChange).toHaveBeenCalledTimes(1);
    const calledDate = mockOnWeekChange.mock.calls[0][0];
    expect(calledDate.getTime()).toBe(addWeeks(testDate, 1).getTime());
  });

  it("should render War Room button", () => {
    setup(<WeeklyHeader currentWeek={testDate} />);

    expect(
      screen.getByRole("button", { name: /war room/i }),
    ).toBeInTheDocument();
  });

  it("should not crash when onWeekChange is not provided", async () => {
    const { user } = setup(<WeeklyHeader currentWeek={testDate} />);

    const prevButton = screen.getByRole("button", { name: /previous/i });
    await user.click(prevButton);

    // Should not throw, just do nothing
    expect(mockOnWeekChange).not.toHaveBeenCalled();
  });
});
