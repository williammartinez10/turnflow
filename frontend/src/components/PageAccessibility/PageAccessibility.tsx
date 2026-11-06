import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/join-queue": "Join a Queue",
  "/find-ticket": "Find My Ticket",
  "/service-information": "Service Information",
  "/join-details": "Join Queue",
  "/queue-status": "Queue Status",
  "/login": "Log In",
  "/signup/admin": "Admin Sign Up",
  "/signup/staff/staff_code": "Staff Invitation Code",
  "/signup/staff": "Staff Sign Up",
};

/**
 * Identifies the current page and focuses its heading after route changes.
 * Runs only for the public, authentication, and Customer pages listed above.
 */
function PageAccessibility() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = pageTitles[pathname];

    if (!pageTitle) {
      return;
    }

    document.title = `${pageTitle} | TurnFlow`;

    const heading = document.querySelector<HTMLElement>("main h1");

    if (heading) {
      // Allows programmatic focus without adding the heading to the Tab order.
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }, [pathname]);

  return null;
}

export default PageAccessibility;