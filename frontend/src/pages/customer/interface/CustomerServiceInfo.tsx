import "./CustomerServiceInfo.css";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";

function CustomerServiceInfo() {
  const navigate = useNavigate();

  // TODO Later: Replace this placeholder data with service and queue info returned by backend.
  const serviceInfo = {
    organizationName: "<Organization Name>",
    location: "<Location>",
    serviceName: "<Service Name>",
    queueName: "<Queue Name>",
  };

  const handleJoinQueue = () => {
    
    // TODO Later: Pass selected service and queue info to the Customer Join Details page.
    navigate("/join-details");
  };

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

              <p className="customer-service-info-secondary">
                {serviceInfo.location}
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