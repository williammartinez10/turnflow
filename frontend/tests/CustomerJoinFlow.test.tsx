import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

describe("Customer joining flow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("allows a customer to join a queue and receive a ticket, and view queue status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { queue_id: 1, queue_code: "ABC-123-45" },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ticket_id: 1 }),
        })
    );

    render(
      <MemoryRouter initialEntries={["/join-queue"]}>
        <App />
      </MemoryRouter>
    );

    // Join Queue
    expect(screen.getByRole("heading", { name: "Join a Queue" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Queue / Service Code"),{target: { value: "ABC-123-45" },});
    fireEvent.click(screen.getByRole("button", { name: "Find Queue" }));


    // Service Information
    expect(await screen.findByRole("heading", { name: "Service Information" })).toBeInTheDocument();
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
    expect(screen.getByText("Waiting")).toBeInTheDocument();
  });
});