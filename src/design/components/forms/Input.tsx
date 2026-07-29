import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldBase =
  "h-10 w-full rounded-input border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";
const invalidClasses = "border-danger-400 focus:border-danger-400 focus:ring-danger-100";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

// The text-input styling duplicated with small variations across Login,
// Bills' search box, and most forms in the app — one focus-ring color
// (primary token), one invalid-state style, everywhere.
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className = "", ...rest }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={`${fieldBase} ${invalid ? invalidClasses : ""} ${className}`} {...rest} />;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ invalid, className = "", children, ...rest }, ref) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={`${fieldBase} ${invalid ? invalidClasses : ""} ${className}`} {...rest}>
      {children}
    </select>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className = "", ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`min-h-20 w-full rounded-input border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${invalid ? invalidClasses : ""} ${className}`}
      {...rest}
    />
  );
});

export default Input;
