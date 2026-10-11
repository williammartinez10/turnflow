import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminSignup from "./AdminSignup";

describe("AdminSignup", () => {
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


  it("submits the signup fields and shows successful registration", async () => {
    const signupData = {
      full_name: "William Test",
      email: "admin.test@example.com",
      password: "LocalTestPass123!",
      organization_name: "TurnFlow Test",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ admin_id: 1 }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <AdminSignup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {target: { value: signupData.full_name },});
    fireEvent.change(screen.getByLabelText("Email"), {target: { value: signupData.email },});
    fireEvent.change(screen.getByLabelText("Password"), {target: { value: signupData.password },});
    fireEvent.change(screen.getByLabelText("Organization Name"), {target: { value: signupData.organization_name },});
    fireEvent.click(screen.getByRole("button", { name: "Create Admin Account" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Admin account created successfully.");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(fetchMock).toHaveBeenCalledWith(
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
});