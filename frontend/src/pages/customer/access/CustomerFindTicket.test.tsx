import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CustomerFindTicket from "./CustomerFindTicket";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Checks ticket-form rendering, required inputs, lookup, and navigation.
 * Requests and navigation are mocked without contacting the backend.
 */
describe("CustomerFindTicket", () => {
  // Reset navigation mocks before each independent case.
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the Find My Ticket page", () => {
    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Find My Ticket" })).toBeInTheDocument();
    expect(screen.getByLabelText("Queue Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Ticket Number")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Queue Status", })).toBeInTheDocument();
  });


  it("requires a queue code and ticket number", () => {
    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Queue Code")).toBeRequired();
    expect(screen.getByLabelText("Ticket Number")).toBeRequired();
  });


  it("allows the customer to enter a ticket number", () => {
    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Ticket Number"),{target: { value: "123456" },});

    expect(screen.getByLabelText("Ticket Number")).toHaveValue("123456");
  });


  it("navigates to queue status when the ticket is found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ticket_number: 123456,
          queue_code: "ABC-123-45",
          service: "Medicine",
          status: "waiting",
        }),
      })
    );

    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Queue Code"),{target: { value: "ABC-123-45" },});
    fireEvent.change(screen.getByLabelText("Ticket Number"),{target: { value: "123456" },});

    fireEvent.click(screen.getByRole("button", {name: "View Queue Status",}));

    await screen.findByRole("button", { name: "View Queue Status" });

    expect(mockNavigate).toHaveBeenCalledWith("/queue-status", {
      state: {
        ticketNumber: "123456",
        queueCode: "ABC-123-45",
        service: "Medicine",
        status: "waiting",
      },
    });
  });


  it("shows an error when the ticket is not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    );

    render(
      <MemoryRouter>
        <CustomerFindTicket />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Queue Code"),{target: { value: "ABC-123-45" },});
    fireEvent.change(screen.getByLabelText("Ticket Number"),{target: { value: "123456" },});

    fireEvent.click(screen.getByRole("button", {name: "View Queue Status",}));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ticket not found. Check your queue code and ticket number."
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});