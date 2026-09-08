import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useChangePasswordMutation } from "@/store/api/settingsApi";
import { FormField, Input, type InputProps } from "@/design/components/forms";
import { Button, PrimaryButton } from "@/design/components/buttons";
import { notify, notifySuccess } from "@/utils/notify";
import {
  passwordRequirements,
  passwordStrength,
  validatePasswordForm,
  type PasswordFormErrors,
  type PasswordFormValues,
} from "./passwordRules";

/**
 * Settings → Password.
 *
 * This replaced a view/edit toggle that showed three greyed-out, empty,
 * read-only password boxes until "Change Password" was pressed, then flipped
 * them to editable and the button to green — a pattern nothing else in the app
 * uses any more. A password form has nothing to display in a view state, so
 * it is now simply the form, built from the design system's fields and
 * buttons like the other modernised pages, with a show/hide toggle per field,
 * a live strength meter and checklist, and inline errors that name the field.
 */

const EMPTY: PasswordFormValues = { currentPassword: "", newPassword: "", confirmPassword: "" };

interface PasswordInputProps extends InputProps {
  /** Named so the show/hide button's label reads "Show current password". */
  fieldLabel: string;
}

// FormField clones its child with id/aria-describedby/invalid, so those are
// passed through to the real Input rather than stopping at this wrapper.
function PasswordInput({ fieldLabel, className = "", ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...rest}
        type={visible ? "text" : "password"}
        autoComplete={rest.autoComplete ?? "off"}
        className={`pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={`${visible ? "Hide" : "Show"} ${fieldLabel.toLowerCase()}`}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
      >
        {visible ? <EyeSlashIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}

const STRENGTH_BAR: Record<number, string> = {
  0: "bg-gray-200",
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-emerald-500",
};

const STRENGTH_TEXT: Record<number, string> = {
  0: "text-gray-400",
  1: "text-red-600",
  2: "text-amber-600",
  3: "text-lime-600",
  4: "text-emerald-600",
};

function SecurityRow({
  icon,
  title,
  sub,
  action,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

interface Props {
  onSignOutAll: () => void;
}

export default function PasswordTab({ onSignOutAll }: Props) {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [form, setForm] = useState<PasswordFormValues>(EMPTY);
  // Errors appear once the person has tried to submit, not while they are
  // still typing the first field.
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const errors: PasswordFormErrors = submitted ? validatePasswordForm(form) : {};
  const strength = passwordStrength(form.newPassword);
  const requirements = passwordRequirements(form.newPassword);
  const isDirty = form.currentPassword !== "" || form.newPassword !== "" || form.confirmPassword !== "";

  const update = (field: keyof PasswordFormValues) => (e: { target: { value: string } }) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (field === "currentPassword") setServerError(null);
  };

  const reset = () => {
    setForm(EMPTY);
    setSubmitted(false);
    setServerError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validatePasswordForm(form)).length > 0) return;
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }).unwrap();
      reset();
      notifySuccess("Password updated. Use the new one next time you sign in.");
    } catch (err: any) {
      // The backend answers a wrong current password with its own sentence;
      // that belongs under the field it is about, not in a toast.
      const message: string = err?.data?.message ?? "";
      if (/current password/i.test(message)) {
        setServerError("That is not your current password.");
      } else {
        notify(message || "Could not update the password. Please try again.");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-[18px] font-bold text-gray-900">Password &amp; Security</h2>
        <p className="mt-0.5 text-[12px] text-gray-500">
          Change the password you sign in to DineInk with
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#b10000]">
              <LockClosedIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">Change password</p>
              <p className="text-[11px] text-gray-400">
                You will stay signed in on this device.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <FormField label="Current Password" required error={errors.currentPassword ?? serverError}>
              <PasswordInput
                fieldLabel="Current password"
                value={form.currentPassword}
                onChange={update("currentPassword")}
                placeholder="Enter your current password"
                autoComplete="current-password"
              />
            </FormField>

            <div className="my-1 border-t border-dashed border-gray-200" />

            <FormField label="New Password" required error={errors.newPassword}>
              <PasswordInput
                fieldLabel="New password"
                value={form.newPassword}
                onChange={update("newPassword")}
                placeholder="Choose a new password"
                autoComplete="new-password"
              />
            </FormField>

            {form.newPassword !== "" && (
              <div aria-live="polite">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Strength
                  </p>
                  <p className={`text-[11px] font-semibold ${STRENGTH_TEXT[strength.score]}`}>
                    {strength.label}
                  </p>
                </div>
                <div className="mt-1.5 grid grid-cols-4 gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-colors ${step <= strength.score ? STRENGTH_BAR[strength.score] : "bg-gray-200"}`}
                    />
                  ))}
                </div>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {requirements.map((r) => (
                    <li
                      key={r.label}
                      className={`flex items-center gap-1.5 text-[12px] ${r.met ? "text-emerald-700" : "text-gray-500"}`}
                    >
                      <CheckCircleIcon
                        className={`h-4 w-4 shrink-0 ${r.met ? "text-emerald-500" : "text-gray-300"}`}
                        aria-hidden="true"
                      />
                      {r.label}
                      {r.required && !r.met && (
                        <span className="text-[10px] font-semibold uppercase text-[#b10000]">required</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <FormField label="Confirm New Password" required error={errors.confirmPassword}>
              <PasswordInput
                fieldLabel="Confirm new password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                placeholder="Type the new password again"
                autoComplete="new-password"
              />
            </FormField>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={reset} disabled={!isDirty || isLoading}>
              Clear
            </Button>
            <PrimaryButton
              type="submit"
              loading={isLoading}
              leftIcon={<LockClosedIcon className="h-4 w-4" />}
            >
              Update Password
            </PrimaryButton>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-[#b10000]" />
              <p className="text-[14px] font-semibold text-gray-900">Sessions</p>
            </div>
            <SecurityRow
              icon={<ArrowRightOnRectangleIcon className="h-4.5 w-4.5" />}
              title="Sign out of all devices"
              sub="Ends every active session, including this one"
              action={
                <PrimaryButton
                  type="button"
                  onClick={onSignOutAll}
                  leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                  className="w-full whitespace-nowrap"
                >
                  Sign Out All
                </PrimaryButton>
              }
            />
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
            <p className="text-[13px] font-semibold text-gray-900">Keep your account safe</p>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-gray-600">
              <li>Do not reuse the password from your email or bank.</li>
              <li>Staff get their own logins under Staff Setup. Never share yours.</li>
              <li>If you suspect someone knows it, change it and sign out of all devices.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
