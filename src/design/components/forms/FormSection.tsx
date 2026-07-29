import type { ReactNode } from "react";

export interface FormSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

// Groups a set of related <FormField>s under an optional title/description
// — the vertical rhythm between sections (and between fields within a
// section) comes from the design system's spacing tokens, so a form
// consistently reads as "sections of fields" instead of one undifferentiated
// column of inputs.
export function FormSection({ title, description, children, className = "" }: FormSectionProps) {
  return (
    <fieldset className={`flex flex-col gap-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && <legend className="text-[13px] font-bold text-gray-900">{title}</legend>}
          {description && <p className="mt-0.5 text-[11px] text-gray-500">{description}</p>}
        </div>
      )}
      {children}
    </fieldset>
  );
}

export default FormSection;
