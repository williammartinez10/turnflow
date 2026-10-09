import "./CustomerJoinQueue.css";
import { ScanQrCode } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";

function CustomerJoinQueue() {
  const navigate = useNavigate();

  const handleFindQueue = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO Later:
//    const queue_code_value = "1"
//    const url = new  URL("http://127.0.0.1:8000/database/queue/get_withcode_queue_"+queue_code_value);
//   const params = {queue_code : queue_code_value}
//  let queue_code = await fetch(url, {
//         method: 'GET',
//         body: JSON.stringify({
//            queue_code: queue_code_value,
//         })
//      })
//    queue_code = await queue_code.json();
//    console.warn(queue_code);
// 
// I believe this structure should give you guys an idea on how calls to the backend are structured
// actually there's 2 methods here, one of them is by adding a value at the end of the URL, the other is sending a URL to the REST API
// depends on the call, let me know if you guys need help, if need be just drop the variable you want the data to be stored in,
// put dummy values inside of it, and I'll fill them in with the expected values.
//
    // Search for the queue using the entered Queue / Service Code.
    // If the queue exists, use its information when navigating to Service Information.

    navigate("/service-information");
  };

  const handleQrCode = () => {

    // TODO Later:

    // Open QR scanner.
    // A valid QR code should open the corresponding
    // Queue / Service Information page (C3).

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
                required
              />
            </div>

            <button
              className="find-queue-button"
              type="submit"
            >
              Find Queue
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