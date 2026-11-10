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
  "/admin/AdminDashboard": "Admin Dashboard",
  "/admin/Services_Queues": "Services & Queues",
  "/admin/StaffAccess": "Staff Access",
  "/staff/StaffDashboard": "Staff Dashboard",
};

/**
 * Identifies the current page and focuses its heading after route changes.
 * Runs only for the pages listed above.
 */
function PageAccessibility() {
  const { pathname } = useLocation();

  useEffect(() => {
    const pageTitle = pageTitles[pathname];

    if (!pageTitle) {
      return;
    }

    document.title = `${pageTitle} | TurnFlow`;

    function focusHeading() {
      const heading = document.querySelector<HTMLElement>("main h1");

      if (!heading) return false;

      // Allows programmatic focus without adding the heading to the Tab order.
      heading.setAttribute("tabindex", "-1");
      heading.focus();
      return true;
    }

    if (focusHeading()) return;

    // Wait for protected pages to finish checking the session.
    const observer = new MutationObserver(() => {
      if (focusHeading()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

export default PageAccessibility;