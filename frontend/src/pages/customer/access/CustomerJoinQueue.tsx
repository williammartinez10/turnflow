
import "./CustomerJoinQueue.css";
import { ScanQrCode } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { SyntheticEvent } from "react";
import Header from "../../../components/Header/Header";

interface Queue {
  queue_id: number;
  service: string;
  queue_code: string;
}

// Dummy queues for testing without the backend.
const mockQueues: Queue[] = [
  { queue_id: 1, service: "medicine", queue_code: "ABC-123-45" },
  { queue_id: 2, service: "lawyer", queue_code: "DEF-678-90" },
];

function CustomerJoinQueue() {
  const navigate = useNavigate();

  const [queueCode, setQueueCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFindQueue = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    let queues: Queue[] = mockQueues;

    try {
      // Get queues from the backend.
      const response = await fetch(
        "http://127.0.0.1:8000/database/queue/get_queue_list", {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      queues = await response.json();
    } catch (error) {
      // Fall back to dummy queues so the frontend can be tested without the backend.
      console.warn("Could not load queues. Using mock data.", error);
    }

    // Find queue entered by the customer.
    const selectedQueue = queues.find(
      (queue) =>
        queue.queue_code.toUpperCase() === queueCode.trim().toUpperCase()
    );

    if (selectedQueue) {
      navigate("/service-information", {
        state: {
          queueCode: selectedQueue.queue_code,
          service: selectedQueue.service,
          queueId: selectedQueue.queue_id,
        },
      });
    } else {
      setError("Queue not found. Please check the code and try again.");
    }

    setIsLoading(false);
  };

  
  const handleQrCode = () => {

    // TODO Later: (For future milestones)
    // Open QR scanner and navigate to the corresponding queue.
    console.log("Open QR scanner");
  };

  return (
    <div className="customer-join-queue-page">
      <Header />

      <main className="customer-join-queue-main">
        <section className="customer-join-queue-content">
          <h1 className="customer-join-queue-title">
            Join a Queue
          </h1>

          <form
            className="customer-join-queue-form"
            onSubmit={handleFindQueue}
          >
            <div className="queue-code-group">
              <label
                className="queue-code-label"
                htmlFor="queue-code"
              >
                Queue / Service Code
              </label>

              <input
                className="queue-code-input"
                id="queue-code"
                name="queue-code"
                type="text"
                placeholder="XXX-XXX-XX"
                value={queueCode}
                onChange={(e) => setQueueCode(e.target.value)}
                required
              />
            </div>

            {error && (
              <p 
                role="alert" 
                style={{ color: "#ff0000", textAlign: "center" }}>
                {error}
              </p>
            )}

            <button
              className="find-queue-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Finding Queue..." : "Find Queue"}
            </button>
          </form>

          <div className="qr-section">
            <p className="qr-section-label">
              Optional shortcut
            </p>

            <button
              className="qr-button"
              type="button"
              onClick={handleQrCode}
              aria-label="Use QR Code"
            >
              <ScanQrCode size={48} strokeWidth={1.6} />
            </button>

            <p className="qr-button-label">
              Use QR Code
            </p>
          </div>

          <section className="existing-ticket-section">
            <h2>Already have a ticket?</h2>

            <p>
              Look up your status with your ticket number — no login needed.
            </p>

            <Link
              className="find-ticket-button"
              to="/find-ticket"
            >
              Find My Ticket
            </Link>
          </section>
        </section>
      </main>
    </div>
  );
}

export default CustomerJoinQueue;