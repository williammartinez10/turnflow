import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomerFindTicket from "./CustomerFindTicket";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CustomerFindTicket", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });
  

  it("renders the Find My Ticket page", () => {
    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Find My Ticket" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Ticket Number")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "View Queue Status",
      })
    ).toBeInTheDocument();
  });


  it("requires a ticket number", () => {
    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Ticket Number");

    expect(input).toBeRequired();
  });


  it("allows the customer to enter a ticket number", () => {
    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Ticket Number");

    fireEvent.change(input, {
      target: { value: "123456" },
    });

    expect(input).toHaveValue("123456");
  });

  
  it("navigates to queue status when the form is submitted", () => {
    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    fireEvent.change(
      screen.getByLabelText("Ticket Number"),
      {
        target: { value: "123456" },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View Queue Status",
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      "/queue-status"
    );
  });
});