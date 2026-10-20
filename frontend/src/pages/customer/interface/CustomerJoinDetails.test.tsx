import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import CustomerJoinDetails from "./CustomerJoinDetails";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Checks phone formatting, registration, confirmation, and navigation through the
 * joining flow. Mocked responses cover confirmed, duplicate, and demo tickets.
 */
describe("CustomerJoinDetails", () => {
  // Reset navigation mocks and any shared setup before each independent case.
  beforeEach(() => {
    mockNavigate.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ticket_id: 1, status: "waiting" }),
      })
    );
  });

  // Restore fetch and other stubbed globals so they do not affect later tests.
  afterEach(() => {
    vi.unstubAllGlobals();
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

    fireEvent.change(input, { target: { value: "7871234567" } });

    expect(input).toHaveValue("(787) 123-4567");
  });


  it("shows a Find My Ticket link when an active ticket already exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
      })
    );

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/join-details",
            state: { queueCode: "ABC-123-45", queueId: 1 },
          },
        ]}
      >
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Phone Number"), {target: { value: "7871234567" }});
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You already have an active ticket in this queue. Use Find My Ticket to view it."
    );

    expect(screen.getByRole("link", { name: "Find My Ticket" })).toHaveAttribute(
      "href",
      "/find-ticket"
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });


  it("uses a demo ticket when customer registration fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Backend unavailable"))
    );

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/join-details",
            state: { queueCode: "ABC-123-45", queueId: 1 },
          },
        ]}
      >
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Phone Number"), {target: { value: "7871234567" },});
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("dialog", { name: "Demo ticket" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("For demonstration only. Registration was not confirmed.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "You're in the queue!" })).not.toBeInTheDocument();
  });


  it("shows the confirmation modal after submitting a valid phone number", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/join-details",
            state: { queueCode: "ABC-123-45", queueId: 1 },
          },
        ]}
      >
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Phone Number"), {target: { value: "7871234567" },});
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "You're in the queue!" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });


  it("does not show the confirmation modal with an incomplete phone number", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Phone Number"), {target: { value: "787123" },});
    fireEvent.submit(screen.getByLabelText("Phone Number").closest("form")!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });


  it("navigates to queue status from the confirmation modal", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/join-details",
            state: {
              queueCode: "ABC-123-45",
              queueId: 1,
              service: "medicine",
              organizationName: "William's Org",
            },
          },
        ]}
      >
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Phone Number"), {target: { value: "7871234567" },});
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "View Queue Status" }));

    expect(mockNavigate).toHaveBeenCalledWith("/queue-status", {
      state: {
        queueCode: "ABC-123-45",
        ticketNumber: "1",
        service: "medicine",
        status: "waiting",
        organizationName: "William's Org",
      },
    });
  });


  it("navigates back to service information when Cancel is clicked", () => {
    render(
      <MemoryRouter>
        <CustomerJoinDetails />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockNavigate).toHaveBeenCalledWith("/service-information", {state: null,});
  });
});