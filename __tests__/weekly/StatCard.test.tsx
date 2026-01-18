import { StatCard } from "@/components/weekly/StatCard";
import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import { CheckCircle, Clock, Target } from "lucide-react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/setup";

describe("StatCard", () => {
  it("should render label and value", () => {
    setup(
      <StatCard
        icon={CheckCircle}
        label="Tasks Completed"
        value="5/10"
        variant="success"
      />,
    );

    expect(screen.getByText("Tasks Completed")).toBeInTheDocument();
    expect(screen.getByText("5/10")).toBeInTheDocument();
  });

  it("should render percentage when provided", () => {
    setup(
      <StatCard
        icon={CheckCircle}
        label="Tasks"
        value="5/10"
        percentage={50}
        variant="success"
      />,
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should not render percentage when not provided", () => {
    setup(
      <StatCard
        icon={CheckCircle}
        label="Tasks"
        value="5/10"
        variant="success"
      />,
    );

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("should render numeric value correctly", () => {
    setup(<StatCard icon={Target} label="Focus" value={85} variant="info" />);

    expect(screen.getByText("85")).toBeInTheDocument();
  });

  describe("variant colors", () => {
    it("should apply green border for success variant", () => {
      setup(
        <StatCard
          icon={CheckCircle}
          label="Tasks"
          value="5"
          variant="success"
        />,
      );

      const card = screen.getByText("5").closest("div")?.parentElement;
      expect(card).toHaveClass("border-green-500");
    });

    it("should apply blue border for info variant", () => {
      setup(<StatCard icon={Clock} label="Hours" value="8h" variant="info" />);

      const card = screen.getByText("8h").closest("div")?.parentElement;
      expect(card).toHaveClass("border-blue-500");
    });

    it("should apply yellow border for warning variant", () => {
      setup(
        <StatCard icon={Target} label="Rescue" value="1/2" variant="warning" />,
      );

      const card = screen.getByText("1/2").closest("div")?.parentElement;
      expect(card).toHaveClass("border-yellow-500");
    });

    it("should apply red border for error variant", () => {
      setup(
        <StatCard icon={Target} label="Skipped" value="3" variant="error" />,
      );

      const card = screen.getByText("3").closest("div")?.parentElement;
      expect(card).toHaveClass("border-red-500");
    });
  });

  describe("brutal design elements", () => {
    it("should have border-2 class for thick border", () => {
      setup(
        <StatCard
          icon={CheckCircle}
          label="Tasks"
          value="5"
          variant="success"
        />,
      );

      const card = screen.getByText("5").closest("div")?.parentElement;
      expect(card).toHaveClass("border-2");
    });

    it("should have hover:border-4 class for hover state", () => {
      setup(
        <StatCard
          icon={CheckCircle}
          label="Tasks"
          value="5"
          variant="success"
        />,
      );

      const card = screen.getByText("5").closest("div")?.parentElement;
      expect(card).toHaveClass("hover:border-4");
    });

    it("should have uppercase label", () => {
      setup(
        <StatCard
          icon={CheckCircle}
          label="Tasks"
          value="5"
          variant="success"
        />,
      );

      const label = screen.getByText("Tasks");
      expect(label).toHaveClass("uppercase");
    });

    it("should have bold value with text-3xl", () => {
      setup(
        <StatCard
          icon={CheckCircle}
          label="Tasks"
          value="5"
          variant="success"
        />,
      );

      const value = screen.getByText("5");
      expect(value).toHaveClass("text-3xl");
      expect(value).toHaveClass("font-bold");
    });
  });
});
