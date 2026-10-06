import "./Header.css";
import { ClockCheck } from "lucide-react";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <Link className="header-brand" to="/">
        <span className="header-brand-icon">
          <ClockCheck size={24} />
        </span>
        <span>TurnFlow</span>
      </Link>
    </header>
  );
}

export default Header;