import { useEffect, useState } from "react";

interface CustomerStatusAnnouncementProps {
  ticketNumber: string | number;
  status?: string;
  title: string;
  description: string;
  position?: number | null;
  peopleAhead?: number | null;
}

/**
 * Announces ticket changes without repeating identical information after each poll.
 */
function CustomerStatusAnnouncement({
  ticketNumber,
  status,
  title,
  description,
  position,
  peopleAhead,
}: CustomerStatusAnnouncementProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!status) {
      setMessage("");
      return;
    }

    let announcement = `Ticket ${ticketNumber}. ${title}. ${description}`;

    if (status === "waiting") {
      if (position != null) {
        announcement += ` Your position is ${position}.`;
      }

      if (peopleAhead != null) {
        announcement += ` ${peopleAhead} ${peopleAhead === 1 ? "person" : "people"} ahead.`;
      }
    }

    setMessage(announcement);
  }, [ticketNumber, status, title, description, position, peopleAhead]);

  return (
    <div
      className="screen-reader-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

export default CustomerStatusAnnouncement;