import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import CustomerJoinQueue from "./CustomerJoinQueue";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Checks queue-code entry, matching-queue navigation, missing or disabled queues,
 * and connection errors using mocked backend responses.
 */
describe("CustomerJoinQueue", () => {
  // Reset navigation mocks and any shared setup before each independent case.
  beforeEach(() => {
    mockNavigate.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          queue_id: 1,
          service_id: 1,
          service_name: "Medicine",
          queue_code: "ABC-123-45",
          organization_name: "William's Org",
        }),
      })
    );
  });

  // Restore fetch and other stubbed globals so they do not affect later tests.
  afterEach(() => { vi.unstubAllGlobals(); });


  it("renders the Join a Queue page", () => {
    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Join a Queue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use QR Code" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find My Ticket" })).toHaveAttribute("href", "/find-ticket");
  });


  it("requires a queue code", () => {
    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Queue / Service Code")).toBeRequired();
  });


  it("navigates to service information when a valid queue is found", async () => {
    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Queue / Service Code"), {target: { value: "ABC-123-45" },});
    fireEvent.click(screen.getByRole("button", { name: "Find Queue" }));

    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/database/queue/get_active_withcode/ABC-123-45",
      { method: "GET" }
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/service-information",
        {
          state: {
            queueCode: "ABC-123-45",
            serviceId: 1,
            serviceName: "Medicine",
            queueId: 1,
            organizationName: "William's Org",
          },
        }
      );
    });
  });


  it("shows an error when the queue does not exist or is disabled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    );

    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Queue / Service Code"), {target: { value: "XYZ-999-99" },});
    fireEvent.click(screen.getByRole("button", { name: "Find Queue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Queue not found or currently disabled.");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Find Queue" })).toBeEnabled();
  });


  it("shows a connection error when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(
      new Error("Backend unavailable")
    ));

    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Queue / Service Code"), {target: { value: "DEF-678-90" },});
    fireEvent.click(screen.getByRole("button", { name: "Find Queue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not connect to the server.");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Find Queue" })).toBeEnabled();
  });

});