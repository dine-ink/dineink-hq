import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonVariant = "default" | "primary" | "danger" | "ghost";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: IconButtonVariant;
  /** Required — an icon-only button with no accessible name is invisible to screen readers. */
  "aria-label": string;
  icon: ReactNode;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
  primary: "bg-primary-50 text-primary-700 hover:bg-primary-100",
  danger: "bg-danger-50 text-danger-700 hover:bg-danger-100",
  ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
};

// Every icon-only button in the app (row actions, drawer close buttons,
// toolbar icons) — one implementation instead of a bespoke `<button
// className="...">` per page, and `aria-label` is required at the type
// level so an icon button can never ship without an accessible name.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "default", icon, className = "", disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? "button"}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-button transition focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
});

export default IconButton;
