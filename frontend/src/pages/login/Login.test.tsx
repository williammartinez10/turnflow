import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";

// Header behavior is covered separately in Header.test.tsx.
vi.mock("../../components/Header/Header", () => ({
  default: () => null,
}));


/**
 * Checks login fields, signup links, request feedback, and submit-button validation.
 * Mocked fetch responses verify credentials, cookie requests, and Admin navigation.
 */
describe("Login", () => {
  // Restore globals such as fetch so request mocks do not leak between tests.
  afterEach(() => {
    vi.unstubAllGlobals();
  });


  it("renders the email and password fields", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });


  it("requires email and password", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
  });


  it("renders the login button", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: "Log In" })
    ).toBeInTheDocument();
  });


  it("provides Staff and Admin signup links", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "Sign Up as Staff" })
    ).toHaveAttribute("href", "/signup/staff/staff_code");

    expect(
      screen.getByRole("link", { name: "Sign Up as Admin" })
    ).toHaveAttribute("href", "/signup/admin");
  });


  it("submits credentials and shows successful login", async () => {
    const email = "staff.test@example.com";
    const password = "LocalTestPass123!";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email, role: "staff" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {target: { value: email },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: password },});
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Logged in successfully.");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
    );
  });


  it("opens the Admin dashboard after successful Admin login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ role: "admin" }),
      })
    );

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/AdminDashboard"
            element={<h1>Admin Dashboard</h1>}
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "admin.test@example.com" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();
  });


  it("shows an error when login credentials are invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          detail: "Invalid email or password.",
        }),
      })
    );

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "staff.test@example.com" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "WrongPassword123!" },});
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });


  it("enables login only after the required fields are valid", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const button = screen.getByRole("button", { name: "Log In" });

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "staff.test@example.com" },});

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});

    expect(button).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "" },});

    expect(button).toBeDisabled();
  });


  it("does not submit an email without a domain suffix", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "name@example" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});

    const button = screen.getByRole("button", { name: "Log In" });

    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(fetchMock).not.toHaveBeenCalled();
  });


  // Email validation permits plus tags, dots, and suffixes other than .com.
  it.each([
    "first.last+tag@example.com",
    "person@university.edu",
  ])("accepts %s as a valid email address", (email) => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {target: { value: email },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});

    expect(screen.getByRole("button", { name: "Log In" })).toBeEnabled();
  });
  
});