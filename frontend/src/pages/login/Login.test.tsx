import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Login from "./Login";

describe("Login", () => {
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
});