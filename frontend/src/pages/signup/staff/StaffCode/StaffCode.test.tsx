import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import StaffCode from "./StaffCode";

describe("StaffCode", () => {
  it("renders the invitation code field", () => {
    render(
      <MemoryRouter>
        <StaffCode />
      </MemoryRouter>
    );

    expect(
      screen.getByLabelText("Organization / Invitation Code")
    ).toBeInTheDocument();
  });

  it("renders the continue button", () => {
    render(
      <MemoryRouter>
        <StaffCode />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: "Continue" })
    ).toBeInTheDocument();
  });

  it("navigates to staff signup when continue is pressed", () => {
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

    fireEvent.click(
      screen.getByRole("button", { name: "Continue" })
    );

    expect(
      screen.getByText("Staff Signup Page")
    ).toBeInTheDocument();
  });
});