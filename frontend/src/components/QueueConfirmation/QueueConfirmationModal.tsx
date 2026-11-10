import "./QueueConfirmationModal.css";
import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Ticket } from "lucide-react";

/** Data and callbacks supplied by the customer registration page. */
interface QueueConfirmationModalProps {
  ticketNumber: string;
  onViewStatus: () => void;
  onClose: () => void;
  isDemo?: boolean;
  returnFocusTo?: HTMLElement | null;
}

/**
 * Presents the registration result in an accessible modal dialog.
 * Keeps keyboard focus inside the dialog and restores it when dismissed.
 */
function QueueConfirmationModal({
  ticketNumber,
  onViewStatus,
  onClose,
  isDemo = false,
  returnFocusTo,
}: QueueConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const viewStatusRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const modal = modalRef.current;

    if (!modal) {
      return;
    }

    const previousFocus = returnFocusTo ||
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);

    const previousOverflow = document.body.style.overflow;

    // The portal keeps the dialog outside the page made temporarily inert.
    const backgroundElements = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && !element.contains(modal)
      )
      .map((element) => ({
        element,
        wasInert: element.hasAttribute("inert"),
      }));

    viewStatusRef.current?.focus();

    backgroundElements.forEach(({ element }) => {
      element.setAttribute("inert", "");
    });

    document.body.style.overflow = "hidden";

    return () => {
      backgroundElements.forEach(({ element, wasInert }) => {
        if (!wasInert) {
          element.removeAttribute("inert");
        }
      });

      document.body.style.overflow = previousOverflow;

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [returnFocusTo]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const firstButton = viewStatusRef.current;
    const lastButton = closeButtonRef.current;

    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault();
      lastButton?.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      firstButton?.focus();
    }
  };

  return createPortal(
    <div className="queue-confirmation-overlay">
      <div
        className="queue-confirmation-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-confirmation-title"
        aria-describedby="queue-confirmation-description queue-confirmation-ticket-label queue-confirmation-ticket-number"
        onKeyDown={handleKeyDown}
      >
        <div className="queue-confirmation-icon">
          <Check size={42} strokeWidth={2.5} aria-hidden="true" />
        </div>

        <h2
          className="queue-confirmation-title"
          id="queue-confirmation-title"
        >
          {isDemo ? "Demo ticket" : "You're in the queue!"}
        </h2>

        <p
          className="queue-confirmation-description"
          id="queue-confirmation-description"
        >
          {isDemo
            ? "For demonstration only. Registration was not confirmed."
            : "Your virtual ticket has been created."}
        </p>

        <div className="queue-ticket">
          <Ticket
            className="queue-ticket-icon"
            size={52}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <div className="queue-ticket-info">
            <span
              className="queue-ticket-label"
              id="queue-confirmation-ticket-label"
            >
              YOUR TICKET
            </span>

            <span
              className="queue-ticket-number"
              id="queue-confirmation-ticket-number"
            >
              {ticketNumber}
            </span>
          </div>
        </div>

        <button
          className="queue-confirmation-button"
          ref={viewStatusRef}
          type="button"
          onClick={onViewStatus}
        >
          View Queue Status
        </button>

        <button
          className="queue-confirmation-close"
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}

export default QueueConfirmationModal;