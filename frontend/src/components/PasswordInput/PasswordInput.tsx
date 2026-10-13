import "./PasswordInput.css";
import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function PasswordInput({ id, ...inputProps }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        {...inputProps}
        id={id}
        type={showPassword ? "text" : "password"}
      />

      <button
        className="password-input-toggle"
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-controls={id}
        onClick={() => setShowPassword((visible) => !visible)}
      >
        {showPassword ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export default PasswordInput;