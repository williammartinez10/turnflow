import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import StaffSignup from "./StaffSignup";

// Header behavior is covered separately in Header.test.tsx.
vi.mock("../../../../components/Header/Header", () => ({
  default: () => null,
}));


/**
 * Checks required staff signup fields, name/email/password validation,
 * registration requests, and duplicate-email feedback using mocked fetch responses.
 */
describe("StaffSignup", () => {
  // Restore globals such as fetch so request mocks do not leak between tests.
  afterEach(() => {
    vi.unstubAllGlobals();
  });


  it("renders the staff signup form with required fields", () => {
    render(
      <MemoryRouter>
        <StaffSignup />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Full Name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByRole("button", { name: "Create Staff Account" })).toBeInTheDocument();
  });


  it("submits the signup fields, signs in, and opens the Staff dashboard", async () => {
    const signupData = {
      full_name: "Staff Test",
      email: "staff.test@example.com",
      password: "LocalTestPass123!",
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ staff_id: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/signup/staff"]}>
        <Routes>
          <Route path="/signup/staff" element={<StaffSignup />} />
          <Route
            path="/staff/StaffDashboard"
            element={<h1>Staff Dashboard</h1>}
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: signupData.full_name },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: signupData.email },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: signupData.password },});
    fireEvent.click(screen.getByRole("button", { name: "Create Staff Account" }));

    expect(await screen.findByRole("heading", { name: "Staff Dashboard" })).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(2);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/database\/staff\/add_staff$/),
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
        <StaffSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Staff Test" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "staff.test@example.com" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});
    fireEvent.click(screen.getByRole("button", { name: "Create Staff Account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email is already registered.");
    
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });


  it("enables submission only when required fields are valid", () => {
    render(
      <MemoryRouter>
        <StaffSignup />
      </MemoryRouter>
    );

    const button = screen.getByRole("button", {name: "Create Staff Account",});

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "staff.test@example.com" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test Staff" },});

    expect(button).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "" },});

    expect(button).toBeDisabled();
  });


  it("does not submit an email without a domain suffix", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <StaffSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test Staff" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "name@example" },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});

    const button = screen.getByRole("button", {name: "Create Staff Account",});

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
        <StaffSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test Staff" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: email },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: "LocalTestPass123!" },});

    expect(screen.getByRole("button", { name: "Create Staff Account" })).toBeEnabled();
  });


  // An invalid password must block the request, not merely change button styling.
  it("blocks signup until password requirements are met", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <StaffSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: "Test Staff" },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: "staff.test@example.com" },});

    const passwordInput = screen.getByLabelText("Password");
    const button = screen.getByRole("button", {name: "Create Staff Account",});

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