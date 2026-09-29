import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Home from "./Home";

describe("Home", () => {
  it("renders the TurnFlow branding", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("TurnFlow")).toBeInTheDocument();
  });

  it("renders the customer button", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: /continue as customer/i })
    ).toBeInTheDocument();
  });

  it("provides a link to login", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const loginLink = screen.getByRole("link", { name: "Here" });

    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});