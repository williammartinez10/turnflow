import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CustomerQueueStatus from "./CustomerQueueStatus";

/**
 * Checks the existing status-page layout, placeholder content, and ticket/queue
 * details received through router state. These are UI tests, not live-update tests.
 */
describe("CustomerQueueStatus", () => {
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


  it("displays the queue information", () => {
    render(
      <MemoryRouter>
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByText("<Organization Name>")).toBeInTheDocument();
    expect(screen.getByText("<Service Name>")).toBeInTheDocument();
    expect(screen.getByText("<Queue Name>")).toBeInTheDocument();
  });


  it("displays the customer's ticket and queue status", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/queue-status",
            state: {
              ticketNumber: "1",
              queueCode: "ABC-123-45",
              service: "Medicine",
              status: "waiting",
            },
          },
        ]}
      >
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ABC-123-45" })).toBeInTheDocument();
    expect(screen.getByText("Medicine")).toBeInTheDocument();
    expect(screen.getByText("<###>")).toBeInTheDocument();
    expect(screen.getByText("<Position>")).toBeInTheDocument();
    expect(screen.getByText("<Count>")).toBeInTheDocument();
    expect(screen.getByText("<Time>")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Waiting" })).toBeInTheDocument();
  });


  it("explains how to retrieve an updated status", () => {
    render(
      <MemoryRouter>
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByText(/Look up your ticket again for an updated status/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Status Unavailable" })).toBeInTheDocument();
  });


  it.each([
    ["called", "It's Your Turn"],
    ["completed", "Completed"],
    ["skipped", "Skipped"],
    ["no_show", "No Show"],
    ["unknown", "Status Unavailable"],
  ])("displays the %s ticket status", (status, title) => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/queue-status",
            state: { status },
          },
        ]}
      >
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });
});