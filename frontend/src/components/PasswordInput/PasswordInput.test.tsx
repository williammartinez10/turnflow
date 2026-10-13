import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PasswordInput from "./PasswordInput";

describe("PasswordInput", () => {
  it("shows and hides the password without changing its value", () => {
    render(
      <PasswordInput
        id="password"
        name="password"
        aria-label="Password"
        required
      />
    );

    const input = screen.getByLabelText("Password");

    fireEvent.change(input, {target: { value: "LocalTestPass123!" },});

    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("LocalTestPass123!");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("LocalTestPass123!");
  });


  it("does not submit the form when visibility is toggled", () => {
    const onSubmit = vi.fn();

    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <PasswordInput
          id="password"
          name="password"
          aria-label="Password"
          defaultValue="LocalTestPass123!"
          required
        />
      </form>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});