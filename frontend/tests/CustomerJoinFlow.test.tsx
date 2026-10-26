import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

/**
 * Exercises the frontend journey from queue-code entry to registration, ticket
 * confirmation, and queue status through App routes. Queue lookup and registration
 * responses are mocked, so this does not contact a live API or database.
 */
describe("Customer joining flow", () => {
  // Restore fetch and other stubbed globals so they do not affect later tests.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("allows a customer to join a queue and receive a ticket, and view queue status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/auth/get_current_account")) {
          return { ok: false, status: 401 };
        }

        if (url.endsWith("/database/queue/get_queue_list")) {
          return {
            ok: true,
            json: async () => [
              {
                queue_id: 1,
                queue_code: "ABC-123-45",
                service: "Medicine",
                organization_name: "William's Org",
              },
            ],
          };
        }

        if (url.endsWith("/database/customer/add_customer")) {
          return {
            ok: true,
            json: async () => ({
              customer_id: 1,
              ticket_id: 1,
              status: "waiting",
            }),
          };
        }

        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(
      <MemoryRouter initialEntries={["/join-queue"]}>
        <App />
      </MemoryRouter>
    );

    // Join Queue
    expect(screen.getByRole("heading", { name: "Join a Queue" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Queue / Service Code"), {target: { value: "ABC-123-45" },});
    fireEvent.click(screen.getByRole("button", { name: "Find Queue" }));


    // Service Information
    expect(await screen.findByRole("heading", { name: "Service Information" })).toBeInTheDocument();
    expect(screen.getByText("Medicine")).toBeInTheDocument();
    expect(screen.getByText("William's Org")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Join Queue" }));


    // Join Details
    expect(screen.getByRole("heading", { name: "Join Queue" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Phone Number"), {target: { value: "7871234567" },});
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));


    // Confirmation
    expect(await screen.findByRole("heading", { name: "You're in the queue!" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View Queue Status" }));


    // Queue Status
    expect(screen.getByRole("heading", { name: "Queue Status" })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/Medicine/)).toBeInTheDocument();
    expect(screen.getByText("William's Org")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
  });
});