import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomerJoinDetails from "./CustomerJoinDetails";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CustomerJoinDetails", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });


  it("renders the Join Queue page", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Join Queue" })).toBeInTheDocument();

    expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });


  it("requires a phone number", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Phone Number");

    expect(input).toBeRequired();
  });


  it("formats the phone number as the customer types", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Phone Number");

    fireEvent.change(input, {target: { value: "7871234567" },});

    expect(input).toHaveValue("(787) 123-4567");
  });


  it("shows the confirmation modal after submitting a valid phone number", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Phone Number"),{target: { value: "7871234567" },});

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "You're in the queue!" })).toBeInTheDocument();

    expect(screen.getByText("<###>")).toBeInTheDocument();
  });


  it("does not show the confirmation modal with an incomplete phone number", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Phone Number"),{target: { value: "787123" },});

    fireEvent.submit(screen.getByLabelText("Phone Number").closest("form")!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });


  it("navigates to queue status from the confirmation modal", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Phone Number"),{target: { value: "7871234567" },});

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fireEvent.click(screen.getByRole("button", { name: "View Queue Status", }));

    expect(mockNavigate).toHaveBeenCalledWith("/queue-status");
  });


  it("navigates back to service information when Cancel is clicked", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockNavigate).toHaveBeenCalledWith("/service-information");
  });
});