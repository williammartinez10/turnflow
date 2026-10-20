import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminSignup from "./AdminSignup";

// Header behavior is covered separately in Header.test.tsx.
vi.mock("../../../components/Header/Header", () => ({
  default: () => null,
}));


/**
 * Checks required admin signup fields, name/email/password validation,
 * registration, automatic login, and duplicate-email feedback.
 */
describe("AdminSignup", () => {
  // Restore globals such as fetch so request mocks do not leak between tests.
  afterEach(() => {
    vi.unstubAllGlobals();
  });


  it("renders the admin signup fields", () => {
    render(
      <MemoryRouter>
        <AdminSignup />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Organization Name")).toBeInTheDocument();
  });

  it("requires all signup fields", () => {
    render(
      <MemoryRouter>
        <AdminSignup />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Full Name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByLabelText("Organization Name")).toBeRequired();
  });

  it("renders the create admin account button", () => {
    render(
      <MemoryRouter>
        <AdminSignup />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Create Admin Account" })).toBeInTheDocument();
  });


  it("submits the signup fields, signs in, and opens the dashboard", async () => {
    const signupData = {
      full_name: "William Test",
      email: "admin.test@example.com",
      password: "LocalTestPass123!",
      organization_name: "TurnFlow Test",
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ admin_id: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/signup/admin"]}>
        <Routes>
          <Route path="/signup/admin" element={<AdminSignup />} />
          <Route
            path="/admin/AdminDashboard"
            element={<h1>Admin Dashboard</h1>}
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: signupData.full_name },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: signupData.email },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: signupData.password },});
    fireEvent.change(screen.getByLabelText("Organization Name"), {target: { value: signupData.organization_name },});
    fireEvent.click(screen.getByRole("button", { name: "Create Admin Account" }));

    expect(await screen.findByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(2);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/database\/admin\/add_admin$/),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    const requestOptions = fetchMock.mock.calls[0][1];
    expect(JSON.parse(requestOptions.body)).toEqual(signupData);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
        }),
      })
    );
  });


  it("shows an error when the email is already registered", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          detail: "Email is already registered.",
        }),
      })
    );

    render(
      <MemoryRouter>
        <AdminSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "William Test" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "admin.test@example.com" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});
    fireEvent.change(screen.getByLabelText("Organization Name"), {target: { value: "TurnFlow Test" },});
    fireEvent.click(screen.getByRole("button", { name: "Create Admin Account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email is already registered.");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });


  it("enables submission only when required fields are valid", () => {
    render(
      <MemoryRouter>
        <AdminSignup />
      </MemoryRouter>
    );

    const button = screen.getByRole("button", {name: "Create Admin Account",});

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "admin.test@example.com" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});
    fireEvent.change(screen.getByLabelText("Organization Name"), {target: { value: "TurnFlow Test" },});

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test Admin" },});

    expect(button).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Organization Name"), {target: { value: "" },});

    expect(button).toBeDisabled();
  });


  it("does not submit an email without a domain suffix", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <AdminSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test Admin" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "name@example" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});
    fireEvent.change(screen.getByLabelText("Organization Name"), {target: { value: "TurnFlow Test" },});

    const button = screen.getByRole("button", {name: "Create Admin Account",});

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
        <AdminSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test Admin" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: email },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});
    fireEvent.change(screen.getByLabelText("Organization Name"), {target: { value: "TurnFlow Test" },});

    expect(screen.getByRole("button", { name: "Create Admin Account" })).toBeEnabled();
  });


  // An invalid password must block the request, not merely change button styling.
  it("blocks signup until password requirements are met", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <AdminSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test Admin" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "admin.test@example.com" },});
    fireEvent.change(screen.getByLabelText("Organization Name"), {target: { value: "TurnFlow Test" },});

    const passwordInput = screen.getByLabelText("Password");
    const button = screen.getByRole("button", {name: "Create Admin Account",
    });

    // Missing an uppercase letter.
    fireEvent.change(passwordInput, {target: { value: "abcdef1!" },});

    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(fetchMock).not.toHaveBeenCalled();

    // Now all password requirements are met.
    fireEvent.change(passwordInput, {target: { value: "abcDef1!" },});

    expect(button).toBeEnabled();
  });
});