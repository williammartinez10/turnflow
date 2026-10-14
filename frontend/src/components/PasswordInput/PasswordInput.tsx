import "./PasswordInput.css";
import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Circle, CircleCheck, Eye, EyeOff } from "lucide-react";

/** Native input properties plus an optional signup password checklist. */
type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Enables the checklist and signup pattern; defaults to false for login. */
  showRequirements?: boolean;
};

/**
 * Renders a password input with an accessible show/hide button.
 * Optionally displays a live checklist and enforces the signup password pattern.
 * Accepts native input props and forwards change events to the parent form.
 */
function PasswordInput({
  id,
  showRequirements = false,
  onChange,
  ...inputProps
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(
    String(inputProps.defaultValue ?? "")
  );
  const requirementsId = useId();

  // Read the supplied value for controlled inputs; otherwise track local typing.
  const currentPassword = inputProps.value !== undefined ? String(inputProps.value) : password;

  // Count Unicode code points and use the same character categories as the backend.
  // Punctuation and symbols qualify for the symbol rule; whitespace does not.
  const requirements = [
    {
      label: "At least 8 characters",
      met: [...currentPassword].length >= 8,
    },
    {
      label: "At least one uppercase letter",
      met: /\p{Lu}/u.test(currentPassword),
    },
    {
      label: "At least one number",
      met: /\p{Nd}/u.test(currentPassword),
    },
    {
      label: "At least one symbol, such as !, @, or #",
      met: /[\p{P}\p{S}]/u.test(currentPassword),
    },
  ];

  // Preserve existing help references and add this instance's unique checklist ID.
  const describedBy = [
    inputProps["aria-describedby"],
    showRequirements ? requirementsId : undefined,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <div className="password-input-wrapper">
        <input
          {...inputProps}
          id={id}
          type={showPassword ? "text" : "password"}
          pattern={
            showRequirements
              ? String.raw`(?=[\s\S]*\p{Lu})(?=[\s\S]*\p{Nd})(?=[\s\S]*[\p{P}\p{S}])[\s\S]{8,}`
              : inputProps.pattern
          }
          aria-describedby={describedBy}
          onChange={(event) => {
            setPassword(event.currentTarget.value);
            // Keep parent form validity checks and caller callbacks working.
            onChange?.(event);
          }}
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

      {showRequirements && (
        <ul
          id={requirementsId}
          className="password-input-requirements"
          aria-label="Password requirements"
        >
          {requirements.map(({ label, met }) => (
            <li
              key={label}
              className={met ? "password-requirement-met" : undefined}
            >
              {met ? (
                <CircleCheck size={16} role="img" aria-label="Met" />
              ) : (
                <Circle size={16} role="img" aria-label="Not yet met" />
              )}
              <span>{label}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default PasswordInput;