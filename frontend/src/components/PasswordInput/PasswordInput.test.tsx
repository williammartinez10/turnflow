import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PasswordInput from "./PasswordInput";

/**
 * Checks password visibility, form-submit prevention, live checklist feedback,
 * and native signup validity. Also verifies that signup rules are optional for login.
 */
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


  it("updates the checklist as password requirements are met", () => {
    render(
      <PasswordInput
        id="password"
        name="password"
        aria-label="Password"
        showRequirements
        required
      />
    );

    const input = screen.getByLabelText("Password");

    expect(screen.getAllByRole("img", { name: "Not yet met" })).toHaveLength(4);

    fireEvent.change(input, { target: { value: "abcdefgh" } });
    expect(screen.getAllByRole("img", { name: "Met" })).toHaveLength(1);

    fireEvent.change(input, { target: { value: "abcDefgh" } });
    expect(screen.getAllByRole("img", { name: "Met" })).toHaveLength(2);

    fireEvent.change(input, { target: { value: "abcDefg1" } });
    expect(screen.getAllByRole("img", { name: "Met" })).toHaveLength(3);

    fireEvent.change(input, { target: { value: "abcDef1!" } });
    expect(screen.getAllByRole("img", { name: "Met" })).toHaveLength(4);
    expect(input).toBeValid();

    fireEvent.change(input, { target: { value: "abcDefg1" } });
    expect(screen.getAllByRole("img", { name: "Met" })).toHaveLength(3);
    expect(screen.getByRole("img", { name: "Not yet met" }).parentElement).toHaveTextContent("At least one symbol");
    expect(input).toBeInvalid();
  });


  // Test each missing rule separately, including whitespace as a non-symbol.
  it.each([
    ["fewer than eight characters", "Ab1!"],
    ["no uppercase letter", "abcdef1!"],
    ["no number", "Abcdefg!"],
    ["no symbol", "Abcdef1 "], // A space must not count as a symbol.
  ])("rejects a password with %s", (_reason, password) => {
    render(
      <PasswordInput
        id="password"
        name="password"
        aria-label="Password"
        showRequirements
        required
      />
    );

    const input = screen.getByLabelText("Password");

    fireEvent.change(input, { target: { value: password } });

    expect(input).toBeInvalid();
  });


  it("does not enforce signup password rules by default", () => {
    render(
      <PasswordInput
        id="password"
        name="password"
        aria-label="Password"
        required
      />
    );

    const input = screen.getByLabelText("Password");

    fireEvent.change(input, { target: { value: "short" } });

    expect(input).toBeValid();

    expect(screen.queryByRole("list", { name: "Password requirements" })).not.toBeInTheDocument();
  });

});