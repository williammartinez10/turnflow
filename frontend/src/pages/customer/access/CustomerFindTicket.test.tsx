import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomerJoinQueue from "./CustomerJoinQueue";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CustomerJoinQueue", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });


  it("renders the Join a Queue page", () => {
    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Join a Queue" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Queue / Service Code")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Find Queue" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Use QR Code" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Find My Ticket" })
    ).toBeInTheDocument();
  });


  it("requires a queue or service code", () => {
    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Queue / Service Code");

    expect(input).toBeRequired();
  });


  it("navigates to service information when the form is submitted", () => {
    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    fireEvent.change(
      screen.getByLabelText("Queue / Service Code"),
      {
        target: { value: "ABC-123-45" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Find Queue" })
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      "/service-information"
    );
  });

  
  it("links to the Find My Ticket page", () => {
    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "Find My Ticket" })
    ).toHaveAttribute("href", "/find-ticket");
  });
}); 
