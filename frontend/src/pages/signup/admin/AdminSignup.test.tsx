import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AdminSignup from "./AdminSignup";

describe("AdminSignup", () => {
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

    expect(
      screen.getByRole("button", { name: "Create Admin Account" })
    ).toBeInTheDocument();
  });
});