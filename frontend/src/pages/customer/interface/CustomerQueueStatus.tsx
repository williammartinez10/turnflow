import "./CustomerQueueStatus.css";
import { Clock3, Info, Ticket } from "lucide-react";
import Header from "../../../components/Header/Header";

function CustomerQueueStatus() {

  // TODO Later: Replace this placeholder with ticket number returned by backend after successfully joining queue.
  const ticketNumber = "<###>";

  // TODO Later: Replace this placeholder data with the customer's active queue info returned by backend.
  const queueStatus = {
    organizationName: "<Organization Name>",
    location: "<Location>",
    serviceName: "<Service Name>",
    queueName: "<Queue Name>",
    position: "<Position>",
    nowServing: "<###>",
    peopleAhead: "<Count>",
    estimatedWait: "<Time>",
    status: "waiting",
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

            <p className="customer-queue-status-location">
              {queueStatus.location}
            </p>

            <p className="customer-queue-status-service">
              <span>Service:</span> {queueStatus.serviceName}
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
                {ticketNumber}
              </span>
            </div>
          </div>

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

          <div className="customer-queue-current-status">
            <div className="customer-queue-current-status-icon">
              <Clock3 size={24} strokeWidth={2} />
            </div>

            <div className="customer-queue-current-status-text">
              <h2>Waiting</h2>

              <p>
                You're currently waiting in the queue. We'll let you know when your turn is approaching.
              </p>
            </div>
          </div>

          <div className="customer-queue-update-info">
            <Info size={18} strokeWidth={2} />

            <p>
              <span>Queue status updates automatically.</span>{" "}
              You'll be notified when your turn is approaching.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CustomerQueueStatus;