import "./CustomerServiceInfo.css";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";

/**
 * Displays the selected queue and service received through router state.
 * Organization details currently use a placeholder.
 * Lets the customer continue to phone-number entry or return to queue selection.
 */
function CustomerServiceInfo() {
  const navigate = useNavigate();
  const location = useLocation();

  // Queue information passed from CustomerJoinQueue.
  const queueCode = location.state?.queueCode;
  const queueId = location.state?.queueId;
  const service = location.state?.service;

  // TODO Later: Replace remaining placeholders with information from the backend.
  const serviceInfo = {
    organizationName: "<Organization Name>",
    serviceName: service || "<Service Name>",
    queueName: queueCode || "<Queue Name>",
  };

  /** Preserves the selected queue and service while opening customer registration. */
  const handleJoinQueue = () => {
    navigate("/join-details", {
      state: {
        queueCode,
        queueId,
        service,
      },
    });
  };

  /** Returns to queue selection before registration; no ticket is deleted. */
  const handleCancel = () => {
    navigate("/join-queue");
  };

  return (
    <div className="customer-service-info-page">
      <Header />

      <main className="customer-service-info-main">
        <section className="customer-service-info-content">
          <h1 className="customer-service-info-title">
            Service Information
          </h1>

          <div className="customer-service-info-details">
            <section className="customer-service-info-section">
              <h2>Organization</h2>

              <p className="customer-service-info-primary">
                {serviceInfo.organizationName}
              </p>
            </section>

            <section className="customer-service-info-section">
              <h2>Service</h2>

              <p className="customer-service-info-primary">
                {serviceInfo.serviceName}
              </p>
            </section>

            <section className="customer-service-info-section">
              <h2>Queue</h2>

              <p className="customer-service-info-primary">
                {serviceInfo.queueName}
              </p>
            </section>
          </div>

          <div className="customer-service-info-actions">
            <button
              className="customer-service-info-join-button"
              type="button"
              onClick={handleJoinQueue}
            >
              Join Queue
            </button>

            <button
              className="customer-service-info-cancel-button"
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default CustomerServiceInfo;