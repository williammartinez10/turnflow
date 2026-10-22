import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";

/** Checks role visibility, the account dropdown, and logout. */
describe("Header", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderHeader(path = "/admin/AdminDashboard") {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="*" element={<Header />} />
        </Routes>
      </MemoryRouter>
    );
  }


  it("shows Customer without a logout button on Queue Status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 })
    );

    await act(async () => {
      renderHeader("/queue-status");
    });

    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });


  it.each([
    "/login",
    "/join-queue",
    "/find-ticket",
    "/service-information",
    "/join-details",
  ])("hides account controls on %s even with an Admin session", async (path) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ role: "admin" }),
      })
    );

    await act(async () => {
      renderHeader(path);
    });

    expect(screen.queryByText("Customer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });


  it.each([
    ["admin", "Admin"],
    ["staff", "Staff"],
  ])("allows %s to open the dropdown and log out", async (role, label) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role }),
      })
      .mockResolvedValueOnce({ ok: true });

    vi.stubGlobal("fetch", fetchMock);

    renderHeader();

    const button = await screen.findByRole("button", { name: label });

    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));

    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      {
        method: "POST",
        credentials: "include",
      }
    );
  });


  it("keeps the account menu available when logout fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ role: "admin" }),
        })
        .mockResolvedValueOnce({ ok: false })
    );

    renderHeader();

    fireEvent.click(await screen.findByRole("button", { name: "Admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not log out. Please try again.");
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Home" })).not.toBeInTheDocument();
  });


  it("closes the dropdown with Escape or an outside click", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ role: "admin" }),
      })
    );

    renderHeader();

    const button = await screen.findByRole("button", { name: "Admin" });

    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();

    fireEvent.click(button);
    fireEvent.pointerDown(document.body);

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Log Out" })).not.toBeInTheDocument();
  });


  it("updates the role after login announces a session change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ role: "staff" }),
        })
    );

    await act(async () => {
      renderHeader("/admin/AdminDashboard");
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    fireEvent(window, new Event("session-changed"));

    expect(await screen.findByRole("button", { name: "Staff" })).toBeInTheDocument();
  });
});