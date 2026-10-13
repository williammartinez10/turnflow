import "./PasswordInput.css";
import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Circle, CircleCheck, Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  showRequirements?: boolean;
};

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

  const currentPassword = inputProps.value !== undefined ? String(inputProps.value) : password;

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