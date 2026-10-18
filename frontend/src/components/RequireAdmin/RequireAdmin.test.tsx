import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import RequireAdmin from "./RequireAdmin";

/** Checks Admin access, session failures, and inactivity logout. */
describe("RequireAdmin", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<h1>Admin Dashboard</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  }

  it("shows a message while checking the session", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => new Promise(() => {}))
    );

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Checking your session...");
  });


  it("displays the page for an Admin session", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ role: "admin" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/get_current_account$/),
      expect.objectContaining({ credentials: "include" })
    );
  });


  it("redirects to Home when the session returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 })
    );

    renderPage();

    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
  });


  it("redirects to Home for a Staff session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ role: "staff" }),
      })
    );

    renderPage();

    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
  });


  it("shows an error when the session check fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Backend unavailable"))
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not check your session. Please refresh.");

    expect(screen.queryByRole("heading", { name: "Admin Dashboard" })).not.toBeInTheDocument();
  });


  it("redirects when the next session check returns 401", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "admin" }),
      })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    vi.stubGlobal("fetch", fetchMock);

    const page = renderPage();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();

    page.unmount();
  });


  it("logs out after 30 minutes without activity", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ role: "admin" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const page = renderPage();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29 * 60_000);
    });

    expect(screen.getByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.anything()
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );

    page.unmount();
  });


  it("restarts the inactivity timer after user interaction", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ role: "admin" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const page = renderPage();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20 * 60_000);
    });

    fireEvent.keyDown(window, { key: "Tab" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20 * 60_000);
    });

    expect(screen.getByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.anything()
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60_000);
    });

    expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );

    page.unmount();
  });
});