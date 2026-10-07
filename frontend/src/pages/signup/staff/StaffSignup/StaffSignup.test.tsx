import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import StaffSignup from "./StaffSignup";

describe("StaffSignup", () => {
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
});