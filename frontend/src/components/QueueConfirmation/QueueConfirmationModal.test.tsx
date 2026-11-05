import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QueueConfirmationModal from "./QueueConfirmationModal";

/**
 * Checks the confirmation content, navigation callback, keyboard controls,
 * and focus management while the dialog is open and after it closes.
 */
describe("QueueConfirmationModal", () => {
  it("renders the confirmation modal with the supplied ticket number", () => {
    const mockViewStatus = vi.fn();
    const mockClose = vi.fn();

    render(
      <QueueConfirmationModal
        ticketNumber="123"
        onViewStatus={mockViewStatus}
        onClose={mockClose}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAccessibleName("You're in the queue!");
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "Your virtual ticket has been created. YOUR TICKET 123"
    );
    expect(screen.getByRole("heading", { name: "You're in the queue!" })).toBeInTheDocument();
    expect(screen.getByText("Your virtual ticket has been created.")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Queue Status" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });


  it("calls onViewStatus when View Queue Status is clicked", () => {
    const mockViewStatus = vi.fn();
    const mockClose = vi.fn();

    render(
      <QueueConfirmationModal
        ticketNumber="123"
        onViewStatus={mockViewStatus}
        onClose={mockClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View Queue Status" }));

    expect(mockViewStatus).toHaveBeenCalledTimes(1);
  });


  it("focuses View Queue Status and keeps Tab navigation inside the modal", async () => {
    const user = userEvent.setup();

    render(
      <QueueConfirmationModal
        ticketNumber="123"
        onViewStatus={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const viewStatusButton = screen.getByRole("button", { name: "View Queue Status" });
    const closeButton = screen.getByRole("button", { name: "Close" });

    expect(viewStatusButton).toHaveFocus();

    await user.tab();

    expect(closeButton).toHaveFocus();

    await user.tab();

    expect(viewStatusButton).toHaveFocus();

    await user.tab({ shift: true });

    expect(closeButton).toHaveFocus();
  });


  it("calls onClose when Escape is pressed", () => {
    const mockClose = vi.fn();

    render(
      <QueueConfirmationModal
        ticketNumber="123"
        onViewStatus={vi.fn()}
        onClose={mockClose}
      />
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(mockClose).toHaveBeenCalledTimes(1);
  });


  it("calls onClose when Close is clicked", () => {
    const mockClose = vi.fn();

    render(
      <QueueConfirmationModal
        ticketNumber="123"
        onViewStatus={vi.fn()}
        onClose={mockClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(mockClose).toHaveBeenCalledTimes(1);
  });


  it("makes the background inert and restores focus after the modal closes", () => {
    const background = render(
      <button type="button">
        Continue
      </button>
    );

    const continueButton = screen.getByRole("button", { name: "Continue" });

    continueButton.focus();

    const modal = render(
      <QueueConfirmationModal
        ticketNumber="123"
        onViewStatus={vi.fn()}
        onClose={vi.fn()}
        returnFocusTo={continueButton}
      />
    );

    expect(background.container).toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "View Queue Status" })).toHaveFocus();

    modal.unmount();

    expect(background.container).not.toHaveAttribute("inert");
    expect(continueButton).toHaveFocus();
  });
});