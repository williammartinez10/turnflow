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

describe("CustomerJoinQueue", () => {
  beforeEach(() => {
    mockNavigate.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            queue_id: 1,
            queue_code: "ABC-123-45",
          },
        ],
      })
    );
  });
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

    fireEvent.change(screen.getByLabelText("Queue / Service Code"),{target: { value: "ABC-123-45" },});

    fireEvent.click(screen.getByRole("button", { name: "Find Queue" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/service-information",
        {
          state: {
            queueCode: "ABC-123-45",
            queueId: 1,
          },
        }
      );
    });
  });


  it("shows an error when the queue does not exist", async () => {
    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Queue / Service Code"),{target: { value: "XYZ-999-99" },});

    fireEvent.click(screen.getByRole("button", { name: "Find Queue" }));

    expect(await screen.findByText("Queue not found. Please check the code and try again.")).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });


  it("uses mock queues when the backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(
      new Error("Backend unavailable")
    ));

    render(
      <MemoryRouter>
        <CustomerJoinQueue />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Queue / Service Code"),{ target: { value: "DEF-678-90" } });

    fireEvent.click(screen.getByRole("button", { name: "Find Queue" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/service-information",
        {
          state: {
            queueCode: "DEF-678-90",
            queueId: 2,
          },
        }
      );
    });
  });

});