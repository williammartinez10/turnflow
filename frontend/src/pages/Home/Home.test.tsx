import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

/**
 * Checks the landing page's branding, customer entry button, and login link.
 * Also checks session-based navigation when clicking Here.
 */
describe("Home", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });


  it("renders the TurnFlow branding", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("TurnFlow")).toBeInTheDocument();
  });


  it("renders the customer button", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /continue as customer/i })).toBeInTheDocument();
  });


  it("provides a link to login", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const loginLink = screen.getByRole("link", { name: "Here" });

    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });


  it.each([
    [200, "Admin Dashboard"],
    [401, "Login"],
  ])("opens %s session's destination: %s", async (status, destination) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: status === 200,
      status,
      json: async () => ({ role: "admin" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<h1>Login</h1>} />
          <Route
            path="/admin/AdminDashboard"
            element={<h1>Admin Dashboard</h1>}
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "Here" }));

    expect(await screen.findByRole("heading", { name: destination })).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/get_current_account$/),
      { credentials: "include" }
    );
  });


  it("shows an error when the session cannot be checked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Backend unavailable"))
    );

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "Here" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not check your session. Please try again.");
    
    expect(screen.getByRole("link", { name: "Here" })).toBeInTheDocument();
  });
});