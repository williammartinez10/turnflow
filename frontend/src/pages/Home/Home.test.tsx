import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./Home";

describe("Home", () => {
  it("renders the TurnFlow branding", () => {
    render(<Home />);

    expect(
        screen.getByText("TurnFlow")
    ).toBeInTheDocument();
  });

  it("renders the customer button", () => {
    render(<Home />);

    expect(
        screen.getByRole("button", { name: /continue as customer/i })
    ).toBeInTheDocument();
  });

  it("provides a link to login", () => {
    render(<Home />);

    const loginLink = screen.getByRole("link", { name: "Here" });

    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });
});