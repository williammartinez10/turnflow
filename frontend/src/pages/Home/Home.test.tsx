import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

/**
 * Checks the landing page's branding, customer entry button, and login link.
 * Also checks session-based navigation when using Staff or Admin access.
 */
describe("Home", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });


  it("renders the branding, customer button, and login link", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("TurnFlow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue as customer/i })).toBeInTheDocument();

    const loginLink = screen.getByRole("link", { name: "Staff or Admin access" });

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

    fireEvent.click(screen.getByRole("link", { name: "Staff or Admin access" }));

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

    fireEvent.click(screen.getByRole("link", { name: "Staff or Admin access" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not check your session. Please try again.");
  
    expect(screen.getByRole("link", { name: "Staff or Admin access" })).toBeInTheDocument();
  });

  
    it("supports keyboard navigation and explains customer access", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join-queue" element={<h1>Join a Queue</h1>} />
        </Routes>
      </MemoryRouter>
    );

    const customerButton = screen.getByRole("button", {name: /continue as customer/i,});
    const loginLink = screen.getByRole("link", {name: "Staff or Admin access",});

    expect(customerButton).toHaveAccessibleDescription("No account needed.");

    await user.tab();

    expect(customerButton).toHaveFocus();

    await user.tab();

    expect(loginLink).toHaveFocus();

    await user.tab({ shift: true });
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("heading", { name: "Join a Queue" })
    ).toBeInTheDocument();
  });


  it("announces session checking and prevents duplicate requests", async () => {
    let rejectRequest!: (reason: Error) => void;

    const fetchMock = vi.fn(
      () =>
        new Promise<never>((_resolve, reject) => {
          rejectRequest = reject;
        })
    );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const loginLink = screen.getByRole("link", {
      name: "Staff or Admin access",
    });

    fireEvent.click(loginLink);

    expect(screen.getByRole("status")).toHaveTextContent("Checking your session. Please wait.");

    expect(loginLink).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(loginLink);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    rejectRequest(new Error("Backend unavailable"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not check your session.");

    await waitFor(() => {
      expect(loginLink).not.toHaveAttribute("aria-disabled");
    });

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});