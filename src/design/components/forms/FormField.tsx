import type { ReactNode } from "react";
import { useId } from "react";
import { cloneElement, isValidElement } from "react";

export interface FormFieldProps {
  label: ReactNode;
  required?: boolean;
  helperText?: ReactNode;
  error?: ReactNode;
  /** The Input/Select/Textarea (or any single form control) this label/helper text describes. */
  children: ReactNode;
  className?: string;
}

// Wraps a single form control with a consistent label, required-asterisk,
// helper text, and validation-error presentation — the label/helper/error
// markup was previously assembled by hand, slightly differently, in every
// form in the app. Wires up `id`/`aria-describedby` automatically so the
// label and any helper/error text are correctly associated with the
// control for screen readers.
export function FormField({ label, required = false, helperText, error, children, className = "" }: FormFieldProps) {
  const fieldId = useId();
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        id: fieldId,
        "aria-describedby": error ? errorId : helperText ? helperId : undefined,
        invalid: !!error || (children as React.ReactElement<any>).props?.invalid,
      })
    : children;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={fieldId} className="text-[13px] font-semibold text-gray-700">
        {label}
        {required && (
          <span className="ml-0.5 text-danger-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-[11px] text-danger-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[11px] text-gray-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;
