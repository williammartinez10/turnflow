import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QueueConfirmationModal from "./QueueConfirmationModal";

describe("QueueConfirmationModal", () => {
  it("renders the confirmation modal", () => {
    const mockViewStatus = vi.fn();

    render(
      <QueueConfirmationModal
        ticketNumber="<###>"
        onViewStatus={mockViewStatus}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "You're in the queue!" })).toBeInTheDocument();

    expect(screen.getByText("Your virtual ticket has been created.")).toBeInTheDocument();

    expect(screen.getByText("<###>")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "View Queue Status" })).toBeInTheDocument();
  });


  it("displays the ticket number passed to the modal", () => {
    const mockViewStatus = vi.fn();

    render(
      <QueueConfirmationModal
        ticketNumber="123"
        onViewStatus={mockViewStatus}
      />
    );

    expect(screen.getByText("123")).toBeInTheDocument();
  });


  it("calls onViewStatus when View Queue Status is clicked", () => {
    const mockViewStatus = vi.fn();

    render(
      <QueueConfirmationModal
        ticketNumber="123"
        onViewStatus={mockViewStatus}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View Queue Status",
      })
    );

    expect(mockViewStatus).toHaveBeenCalledTimes(1);
  });
});