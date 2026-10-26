import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

/** Attempts logout after 30 minutes without user interaction. */
function useIdleLogout(onLogout: () => void) {
  useEffect(() => {
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    const inactivityLimit = 30 * 60_000;
    const controller = new AbortController();
    let lastActivity = Date.now();
    let expired = false;
    let timer: number;

    const logout = () => {
      if (expired) return;
      expired = true;

      window.clearTimeout(timer);
      onLogout();

      // Redirect locally even if the backend cannot clear the cookie.
      void fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
      }).catch(() => {});
    };

    const checkInactivity = () => {
      if (Date.now() - lastActivity >= inactivityLimit) {
        logout();
      }
    };

    const recordActivity = () => {
      if (expired) return;

      // Check the deadline before restarting a delayed browser timer.
      if (Date.now() - lastActivity >= inactivityLimit) {
        logout();
        return;
      }

      lastActivity = Date.now();
      window.clearTimeout(timer);
      timer = window.setTimeout(logout, inactivityLimit);
    };

    const events = ["pointerdown", "keydown", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, recordActivity, {
        capture: true,
        passive: true,
      });
    });

    window.addEventListener("focus", checkInactivity);
    timer = window.setTimeout(logout, inactivityLimit);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", checkInactivity);

      events.forEach((event) => {
        window.removeEventListener(event, recordActivity, true);
      });

      // Let a logout already started finish clearing the cookie.
      if (!expired) {
        controller.abort();
      }
    };
  }, [onLogout]);
}

/**
 * Checks Admin access before displaying protected pages.
 * Rechecks the session every minute and when the window regains focus.
 */
function RequireAdmin() {
  const [status, setStatus] = useState<
    "checking" | "allowed" | "denied" | "error"
  >("checking");

  const idleExpired = useRef(false);

  // Prevent pending session checks from undoing inactivity logout.
  const handleIdleLogout = useCallback(() => {
    idleExpired.current = true;
    setStatus("denied");
  }, []);

  useIdleLogout(handleIdleLogout);

  const denied = status === "denied";

  useEffect(() => {
    if (denied) return;

    const controller = new AbortController();
    let checking = false;

    const checkSession = async () => {
      if (checking || idleExpired.current) return;
      checking = true;

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      try {
        const response = await fetch(
          `${apiBaseUrl}/auth/get_current_account`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted || idleExpired.current) return;

        if (response.status === 401) {
          setStatus("denied");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not check session.");
        }

        const account = await response.json();

        if (!controller.signal.aborted && !idleExpired.current) {
          setStatus(account.role === "admin" ? "allowed" : "denied");
        }
      } catch {
        if (!controller.signal.aborted && !idleExpired.current) {
          setStatus("error");
        }
      } finally {
        checking = false;
      }
    };

    void checkSession();

    const interval = window.setInterval(checkSession, 60_000);
    window.addEventListener("focus", checkSession);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", checkSession);
    };
  }, [denied]);

  if (status === "checking") {
    return <p role="status">Checking your session...</p>;
  }

  if (status === "error") {
    return <p role="alert">Could not check your session. Please refresh.</p>;
  }

  if (denied) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RequireAdmin;