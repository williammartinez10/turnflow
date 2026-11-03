import { act, cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import CustomerQueueStatus from "./CustomerQueueStatus";

/**
 * Checks the existing status-page layout, retrieved ticket and Queue information,
 * Customer status, and automatic refresh using mocked backend responses.
 * These tests do not contact a live API or database.
 */
describe("CustomerQueueStatus", () => {
  // Provide ticket information without contacting the backend.
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ticket_number: 16,
          queue_code: "ABC-123-45",
          queue_name: "Merge Test A",
          service: "Medicine",
          status: "waiting",
          organization_name: "William's Org",
          position: 3,
          people_ahead: 2,
          now_serving: [5, 6],
        }),
      })
    );
  });

  // Unmount the page before restoring timers and mocked globals.
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });


  it("renders the Queue Status page", () => {
    render(
      <MemoryRouter>
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Queue Status" })).toBeInTheDocument();
    expect(screen.getByText("YOUR TICKET")).toBeInTheDocument();
    expect(screen.getByText("Your Position")).toBeInTheDocument();
    expect(screen.getByText("Now Serving")).toBeInTheDocument();
    expect(screen.getByText("People Ahead")).toBeInTheDocument();
    expect(screen.getByText("Estimated Wait")).toBeInTheDocument();
  });


  it("shows unavailable information when Queue information is missing", () => {
    render(
      <MemoryRouter>
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByText("Organization unavailable")).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();
    expect(screen.getByText("Queue unavailable")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ticket information is missing. Please use Find My Ticket."
    );
  });


  it("displays the customer's ticket and Queue status", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/queue-status",
            state: {
              ticketNumber: "16",
              queueCode: "ABC-123-45",
              serviceName: "Medicine",
              status: "waiting",
              organizationName: "William's Org",
            },
          },
        ]}
      >
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Merge Test A" })).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("Medicine")).toBeInTheDocument();
    expect(screen.getByText("William's Org")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5, 6")).toBeInTheDocument();
    expect(screen.getByText("Not available yet")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Waiting" })).toBeInTheDocument();
  });


  it("explains that Queue status refreshes automatically", () => {
    render(
      <MemoryRouter>
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByText("Queue status refreshes automatically every 5 seconds.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Status Unavailable" })).toBeInTheDocument();
  });


  it.each([
    ["called", "It's Your Turn"],
    ["completed", "Completed"],
    ["skipped", "Skipped"],
    ["no_show", "No Show"],
    ["unknown", "Status Unavailable"],
  ])("displays the %s ticket status", async (status, title) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ticket_number: 16,
          queue_code: "ABC-123-45",
          queue_name: "Merge Test A",
          service: "Medicine",
          status,
          organization_name: "William's Org",
          position: null,
          people_ahead: null,
          now_serving: [],
        }),
      })
    );

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/queue-status",
            state: {
              ticketNumber: "16",
              queueCode: "ABC-123-45",
            },
          },
        ]}
      >
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();

    if (status === "called") {
      expect(screen.getByText("Called")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("Your turn")).toBeInTheDocument();
    } else if (status === "completed") {
      expect(screen.getAllByText("Completed")).toHaveLength(2);
      expect(screen.getAllByText("—")).toHaveLength(2);
    } else {
      expect(screen.getAllByText("Not applicable")).toHaveLength(2);
    }

    expect(screen.getByText("No active service")).toBeInTheDocument();
  });


  it("shows an error when ticket information cannot be retrieved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Backend unavailable"))
    );

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/queue-status",
            state: {
              ticketNumber: "16",
              queueCode: "ABC-123-45",
              serviceName: "Medicine",
              status: "waiting",
              organizationName: "William's Org",
            },
          },
        ]}
      >
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update your ticket.");
    expect(screen.getByText("Medicine")).toBeInTheDocument();
    expect(screen.getByText("William's Org")).toBeInTheDocument();
  });


  it("refreshes Queue status after five seconds and stops after leaving the page", async () => {
    vi.useFakeTimers();

    const view = render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/queue-status",
            state: {
              ticketNumber: "16",
              queueCode: "ABC-123-45",
            },
          },
        ]}
      >
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    // Complete the initial request.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5, 6")).toBeInTheDocument();


    // Return updated Queue information on the next request.
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ticket_number: 16,
        queue_code: "ABC-123-45",
        queue_name: "Merge Test A",
        service: "Medicine",
        status: "waiting",
        organization_name: "William's Org",
        position: 2,
        people_ahead: 1,
        now_serving: [5, 6, 7],
      }),
    } as Response);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999);
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5, 6")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(screen.queryByText("3")).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5, 6, 7")).toBeInTheDocument();


    // Leaving the page must stop future requests.
    view.unmount();
    vi.mocked(fetch).mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});