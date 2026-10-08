import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("Customer joining flow", () => {
  it("allows a customer to join a queue and view their queue status", () => {
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
    expect(screen.getByRole("heading", { name: "Service Information" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Join Queue" }));


    // Join Details
    expect(screen.getByRole("heading", { name: "Join Queue" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Phone Number"), {target: { value: "7871234567" },});
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));


    // Confirmation
    expect(screen.getByRole("heading", { name: "You're in the queue!", })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View Queue Status", }));


    // Queue Status
    expect(screen.getByRole("heading", { name: "Queue Status" })).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    
  });
});