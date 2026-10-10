import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CustomerQueueStatus from "./CustomerQueueStatus";

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

    expect(screen.getByText("<Location>")).toBeInTheDocument();

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
            },
          },
        ]}
      >
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByText("1")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "ABC-123-45" })).toBeInTheDocument();

    expect(screen.getByText("<###>")).toBeInTheDocument();

    expect(screen.getByText("<Position>")).toBeInTheDocument();

    expect(screen.getByText("<Count>")).toBeInTheDocument();

    expect(screen.getByText("<Time>")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Waiting" })).toBeInTheDocument();
  });


  it("displays the automatic queue update information", () => {
    render(
      <MemoryRouter>
        <CustomerQueueStatus />
      </MemoryRouter>
    );

    expect(screen.getByText(/Queue status updates automatically/)).toBeInTheDocument();

    expect(screen.getByText(/You'll be notified when your turn is approaching/)).toBeInTheDocument();
  });
});