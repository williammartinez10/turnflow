import "./Header.css";
import { ClockCheck, UserRound, ChevronDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/** Displays the website brand, current role, and account logout menu. */
function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const accountRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const isCustomerPage = location.pathname === "/queue-status";

  const hideRole = [
    "/login",
    "/join-queue",
    "/find-ticket",
    "/service-information",
    "/join-details",
  ].includes(location.pathname);

  useEffect(() => {
    const controller = new AbortController();
    setIsOpen(false);

    const checkAccount = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/auth/get_current_account`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          if (!controller.signal.aborted) setRole("");
          return;
        }

        const account = await response.json();

        if (!controller.signal.aborted) {
          setRole(
            account.role === "admin" || account.role === "staff"
              ? account.role
              : ""
          );
        }
      } catch {
        if (!controller.signal.aborted) setRole("");
      }
    };

    void checkAccount();
    window.addEventListener("session-changed", checkAccount);

    return () => {
      controller.abort();
      window.removeEventListener("session-changed", checkAccount);
    };
  }, [apiBaseUrl, location.pathname]);


  // Close the dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setError("");
    setIsLoggingOut(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      setRole("");
      setIsOpen(false);
      navigate("/", { replace: true });
    } catch {
      setError("Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  
  const roleLabel = isCustomerPage
    ? "Customer"
    : role === "admin"
      ? "Admin"
      : role === "staff"
        ? "Staff"
        : "";

  return (
    <header className="header">
      <Link className="header-brand" to="/">
        <span className="header-brand-icon">
          <ClockCheck size={24} />
        </span>
        <span>TurnFlow</span>
      </Link>

      {roleLabel && !hideRole && (
        <div className="header-account" ref={accountRef}>
          {isCustomerPage ? (
            <span className="header-role">
              <UserRound size={20} aria-hidden="true" />
              {roleLabel}
            </span>
          ) : (
            <>
              <button
                ref={buttonRef}
                className="header-role-button"
                type="button"
                aria-expanded={isOpen}
                aria-controls="header-account-dropdown"
                onClick={() => setIsOpen(!isOpen)}
              >
                <UserRound size={20} aria-hidden="true" />
                {roleLabel}
                <ChevronDown size={16} aria-hidden="true" />
              </button>

              {isOpen && (
                <div
                  className="header-dropdown"
                  id="header-account-dropdown"
                >
                  <button
                    className="header-logout"
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut size={18} aria-hidden="true" />
                    {isLoggingOut ? "Logging Out..." : "Log Out"}
                  </button>

                  {error && <p role="alert">{error}</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;