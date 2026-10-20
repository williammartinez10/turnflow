import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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


  it("renders the staff signup fields", () => {
    render(
      <MemoryRouter>
        <StaffSignup />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });


  it("requires all signup fields", () => {
    render(
      <MemoryRouter>
        <StaffSignup />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Full Name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
  });


  it("renders the create staff account button", () => {
    render(
      <MemoryRouter>
        <StaffSignup />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: "Create Staff Account" })
    ).toBeInTheDocument();
  });


  it("submits the signup fields and shows successful registration", async () => {
    const signupData = {
      full_name: "Staff Test",
      email: "staff.test@example.com",
      password: "LocalTestPass123!",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ staff_id: 1 }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <StaffSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: signupData.full_name },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: signupData.email },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: signupData.password },});
    fireEvent.click(screen.getByRole("button", { name: "Create Staff Account" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Staff account created successfully.");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(fetchMock).toHaveBeenCalledWith(
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
    
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
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