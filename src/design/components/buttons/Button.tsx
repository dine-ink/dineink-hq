import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a small inline spinner and disables the button, without shifting layout. */
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

// The one source of truth for every button in the app — was previously
// re-implemented per page with slightly different padding/radius/colors
// each time (e.g. "rounded-xl bg-[#b10000] text-white ..." duplicated
// verbatim across dozens of files). Variant/size classes reference the
// design tokens wired into Tailwind's theme (bg-primary-600, rounded-button,
// etc.), so retuning the brand color or button radius is a one-line change
// in src/design/tokens, not a repo-wide find-and-replace.
const base =
  "inline-flex items-center justify-center gap-2 rounded-button font-bold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:ring-primary-200",
  secondary:
    "bg-secondary-50 text-secondary-700 hover:bg-secondary-100 focus-visible:ring-secondary-200",
  danger:
    "bg-danger-600 text-white shadow-sm hover:bg-danger-700 focus-visible:ring-danger-200",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-200",
  outline:
    "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, leftIcon, rightIcon, className = "", disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="danger" {...props} />;
}

export default Button;
