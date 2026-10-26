import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomerServiceInfo from "./CustomerServiceInfo";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Checks service-information content and navigation with the selected queue,
 * service, and organization preserved in router state.
 * Navigation mocks also verify the Cancel destination.
 */
describe("CustomerServiceInfo", () => {
  // Reset navigation mocks and any shared setup before each independent case.
  beforeEach(() => {
    mockNavigate.mockClear();
  });


  it("renders the Service Information page", () => {
    render(
      <MemoryRouter>
        <CustomerServiceInfo />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Service Information" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Organization" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Service" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Queue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join Queue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });


  it("displays placeholders when service and queue information is missing", () => {
    render(
      <MemoryRouter>
        <CustomerServiceInfo />
      </MemoryRouter>
    );

    expect(screen.getByText("<Organization Name>")).toBeInTheDocument();
    expect(screen.getByText("<Service Name>")).toBeInTheDocument();
    expect(screen.getByText("<Queue Name>")).toBeInTheDocument();
  });


  it("navigates to join details when Join Queue is clicked", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/service-information",
            state: {
              queueCode: "ABC-123-45",
              queueId: 1,
              service: "Medicine",
              organizationName: "William's Org",
            },
          },
        ]}
      >
        <CustomerServiceInfo />
      </MemoryRouter>
    );

    expect(screen.getByText("Medicine")).toBeInTheDocument();
    expect(screen.getByText("ABC-123-45")).toBeInTheDocument();
    expect(screen.getByText("William's Org")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Join Queue" }));

    expect(mockNavigate).toHaveBeenCalledWith("/join-details", {
      state: {
        queueCode: "ABC-123-45",
        queueId: 1,
        service: "Medicine",
        organizationName: "William's Org",
      },
    });
  });


  it("navigates back to join queue when Cancel is clicked", () => {
    render(
      <MemoryRouter>
        <CustomerServiceInfo />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockNavigate).toHaveBeenCalledWith("/join-queue");
  });
});