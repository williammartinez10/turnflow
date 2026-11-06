import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import PageAccessibility from "./PageAccessibility";

/**
 * Checks page titles and heading focus after navigation.
 * Also verifies that ordinary rerenders do not interrupt keyboard focus.
 */
describe("PageAccessibility", () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });


  it("sets the page title and focuses the main heading", () => {
    render(
      <MemoryRouter initialEntries={["/join-queue"]}>
        <PageAccessibility />

        <main>
          <h1>Join a Queue</h1>
        </main>
      </MemoryRouter>
    );

    const heading = screen.getByRole("heading", { name: "Join a Queue" });

    expect(document.title).toBe("Join a Queue | TurnFlow");
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(heading).toHaveFocus();
  });


  it("updates the title and heading focus after navigating to another page", () => {
    render(
      <MemoryRouter initialEntries={["/join-queue"]}>
        <PageAccessibility />

        <Routes>
          <Route
            path="/join-queue"
            element={
              <main>
                <h1>Join a Queue</h1>
                <Link to="/find-ticket">Find My Ticket</Link>
              </main>
            }
          />

          <Route
            path="/find-ticket"
            element={
              <main>
                <h1>Find My Ticket</h1>
              </main>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "Find My Ticket" }));

    expect(document.title).toBe("Find My Ticket | TurnFlow");
    expect(screen.getByRole("heading", { name: "Find My Ticket" })).toHaveFocus();
  });


  it("does not move focus again when the current page rerenders", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/queue-status"]}>
        <PageAccessibility />

        <main>
          <h1>Queue Status</h1>
          <p>Original Queue information</p>
          <button type="button">Find Another Ticket</button>
        </main>
      </MemoryRouter>
    );

    const button = screen.getByRole("button", { name: "Find Another Ticket" });

    button.focus();

    expect(button).toHaveFocus();

    rerender(
      <MemoryRouter initialEntries={["/queue-status"]}>
        <PageAccessibility />

        <main>
          <h1>Queue Status</h1>
          <p>Updated Queue information</p>
          <button type="button">Find Another Ticket</button>
        </main>
      </MemoryRouter>
    );

    expect(screen.getByText("Updated Queue information")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find Another Ticket" })).toBe(button);
    expect(button).toHaveFocus();
  });


  it("does not manage headings or titles on the excluded dashboard pages", () => {
    document.title = "Existing dashboard title";

    render(
      <MemoryRouter initialEntries={["/admin/AdminDashboard"]}>
        <PageAccessibility />

        <main>
          <h1>Admin Dashboard</h1>
        </main>
      </MemoryRouter>
    );

    const heading = screen.getByRole("heading", { name: "Admin Dashboard" });

    expect(document.title).toBe("Existing dashboard title");
    expect(heading).not.toHaveAttribute("tabindex");
    expect(heading).not.toHaveFocus();
  });
});