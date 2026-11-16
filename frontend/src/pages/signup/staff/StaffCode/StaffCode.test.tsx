import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import StaffCode from "./StaffCode";

/**
 * Checks the invitation-code field, Continue button, and navigation to staff signup.
 * Backend invitation validation is mocked.
 */
describe("StaffCode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the invitation code field and continue button", () => {
    render(
      <MemoryRouter>
        <StaffCode />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Organization / Invitation Code")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });


  // A simple destination page verifies routing without rendering the signup form.
  it("navigates to staff signup after validating the invitation code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          admin_id: 1,
          organization_name: "Test Organization",
        }),
      })
    );

    render(
      <MemoryRouter initialEntries={["/signup/staff/staff_code"]}>
        <Routes>
          <Route
            path="/signup/staff/staff_code"
            element={<StaffCode />}
          />
          <Route
            path="/signup/staff"
            element={<div>Staff Signup Page</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Organization / Invitation Code"), {target: { value: "ABC123" }});

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Staff Signup Page")).toBeInTheDocument();
  });
});