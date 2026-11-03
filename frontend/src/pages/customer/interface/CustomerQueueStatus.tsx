import "./CustomerQueueStatus.css";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Info, Ticket } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Header from "../../../components/Header/Header";

/** Ticket information and Queue statistics returned by the backend. */
interface TicketStatus {
  ticket_number: number;
  queue_code: string;
  queue_name?: string | null;
  service?: string | null;
  organization_name?: string | null;
  status: string;
  position: number | null;
  people_ahead: number | null;
  now_serving: number[];
}

/**
 * Displays ticket, queue, service, and status information.
 * Refreshes current Queue statistics every five seconds until service is completed.
 * Completed tickets display a confirmation and options to join or find a Queue ticket.
 * Estimated waiting time remains pending.
 */
function CustomerQueueStatus() {
  const location = useLocation();

  // Ticket and queue information passed from registration or ticket lookup.
  const ticketNumber = location.state?.ticketNumber || "";
  const queueCode = location.state?.queueCode || "";
  const serviceName = location.state?.serviceName;
  const organizationName = location.state?.organizationName;

  const [ticket, setTicket] = useState<TicketStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // Retrieve current ticket information and refresh it until service is completed.
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    setTicket(null);
    setError("");
    setIsLoading(false);

    if (!queueCode || !ticketNumber) {
      setError("Ticket information is missing. Please use Find My Ticket.");
      return;
    }

    setIsLoading(true);

    const getTicket = async () => {
      let shouldRefresh = true;

      try {
        const params = new URLSearchParams({
          queue_code: queueCode,
          ticket_number: String(ticketNumber),
        });

        const response = await fetch(
          `${apiBaseUrl}/database/customer/get_ticket?${params}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Could not retrieve ticket information.");
        }

        const retrievedTicket: TicketStatus = await response.json();

        if (!controller.signal.aborted) {
          setTicket(retrievedTicket);
          setError("");
          shouldRefresh = retrievedTicket.status !== "completed";
        }
      } catch {
        if (!controller.signal.aborted) {
          // Keep the last successful data while retrying.
          setError(
            "Could not update your ticket. Displayed information may be outdated. Retrying automatically."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);

          // Completed tickets no longer need Queue updates.
          if (shouldRefresh) {
            timer = setTimeout(getTicket, 5000);
          }
        }
      }
    };

    void getTicket();

    return () => {
      controller.abort();

      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [apiBaseUrl, queueCode, ticketNumber]);

  // Use the retrieved status or the snapshot from registration or ticket lookup.
  const statuses: Record<string, { title: string; description: string }> = {
    waiting: {
      title: "Waiting",
      description: "You're currently waiting in the queue.",
    },
    called: {
      title: "It's Your Turn",
      description: "Please proceed to the service area.",
    },
    completed: {
      title: "Completed",
      description: "Your service has been completed.",
    },
    skipped: {
      title: "Skipped",
      description: "Your ticket was skipped. Please check with Staff.",
    },
    no_show: {
      title: "No Show",
      description: "Staff marked you as absent. Please check with Staff.",
    },
  };

  const currentStatus = statuses[ticket?.status ?? location.state?.status] || {
    title: "Status Unavailable",
    description: "Look up your ticket again to retrieve its current status.",
  };

  // Show the completion view only after confirmation from the backend.
  const isCompleted = ticket?.status === "completed";
  const unavailable = isLoading ? "Loading..." : "Unavailable";


  const queueStatus = {
    organizationName:
      ticket?.organization_name || organizationName || "Organization unavailable",
    queueName: ticket?.queue_name || queueCode || "Queue unavailable",
    serviceName: ticket?.service || serviceName || "Service unavailable",
    position: !ticket
      ? unavailable
      : ticket.status === "called"
        ? "Called"
        : ticket.status === "waiting"
          ? ticket.position ?? "Unavailable"
          : "Not applicable",
    nowServing: !ticket
      ? unavailable
      : ticket.now_serving?.length
        ? ticket.now_serving.join(", ")
        : "Not serving yet",
    peopleAhead: !ticket
      ? unavailable
      : ticket.status === "called"
        ? 0
        : ticket.status === "waiting"
          ? ticket.people_ahead ?? "Unavailable"
          : "Not applicable",
    estimatedWait: ticket?.status === "called"
      ? "Your turn"
      : "Not available yet",
  };


  return (
    <div className="customer-queue-status-page">
      <Header />

      <main className="customer-queue-status-main">
        <section className="customer-queue-status-content">
          <h1 className="customer-queue-status-title">
            Queue Status
          </h1>

          <div className="customer-queue-status-header">
            <h2>{queueStatus.queueName}</h2>

            <p className="customer-queue-status-organization">
              {queueStatus.organizationName}
            </p>

            <p className="customer-queue-status-service">
              Service: <span>{queueStatus.serviceName}</span>
            </p>
          </div>

          <div className="customer-queue-ticket">
            <Ticket
              className="customer-queue-ticket-icon"
              size={52}
              strokeWidth={1.8}
            />

            <div className="customer-queue-ticket-info">
              <span className="customer-queue-ticket-label">
                YOUR TICKET
              </span>

              <span className="customer-queue-ticket-number">
                {ticket?.ticket_number ?? (ticketNumber || "Unavailable")}
              </span>
            </div>
          </div>

          {!isCompleted && (
            <div className="customer-queue-status-grid">
              <div className="customer-queue-status-item">
                <span className="customer-queue-status-label">
                  Your Position
                </span>

                <span className="customer-queue-status-value">
                  {queueStatus.position}
                </span>
              </div>

              <div className="customer-queue-status-item">
                <span className="customer-queue-status-label">
                  Now Serving
                </span>

                <span className="customer-queue-status-value">
                  {queueStatus.nowServing}
                </span>
              </div>

              <div className="customer-queue-status-item">
                <span className="customer-queue-status-label">
                  People Ahead
                </span>

                <span className="customer-queue-status-value">
                  {queueStatus.peopleAhead}
                </span>
              </div>

              <div className="customer-queue-status-item">
                <span className="customer-queue-status-label">
                  Estimated Wait
                </span>

                <span className="customer-queue-status-value">
                  {queueStatus.estimatedWait}
                </span>
              </div>
            </div>
          )}

          <div className="customer-queue-current-status">
            <div className="customer-queue-current-status-icon">
              {isCompleted ? (
                <CheckCircle2 size={24} strokeWidth={2} />
              ) : (
                <Clock3 size={24} strokeWidth={2} />
              )}
            </div>

            <div className="customer-queue-current-status-text">
              <h2>
                {isCompleted ? "Service completed" : currentStatus.title}
              </h2>

              <p>
                {isCompleted
                  ? `Your service for ticket ${ticket.ticket_number} has been completed.`
                  : currentStatus.description}
              </p>
            </div>
          </div>

          {isCompleted && (
            <div className="customer-queue-completed-actions">
              <Link
                className="customer-queue-join-another"
                to="/join-queue"
              >
                Join a Queue
              </Link>

              <Link
                className="customer-queue-find-another"
                to="/find-ticket"
              >
                Find Another Ticket
              </Link>
            </div>
          )}

          {error && (
            <p role="alert">
              {error}
            </p>
          )}

          {!isCompleted && (
            <div className="customer-queue-update-info">
              <Info size={18} strokeWidth={2} />

              <p>
                Queue status refreshes automatically every 5 seconds.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CustomerQueueStatus;