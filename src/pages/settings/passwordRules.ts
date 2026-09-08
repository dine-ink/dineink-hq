/**
 * The change-password form's rules, kept pure so the tab can show them live
 * (a strength meter, a requirements checklist, inline errors) and so they can
 * be tested without rendering anything.
 *
 * The one hard rule is the backend's: at least six characters
 * (auth.service.ts changePasswordService). Everything else here is guidance
 * shown to the person, never a reason to block the save.
 */

export const MIN_PASSWORD_LENGTH = 6;

export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordFormErrors = Partial<Record<keyof PasswordFormValues, string>>;

export const validatePasswordForm = (v: PasswordFormValues): PasswordFormErrors => {
  const errors: PasswordFormErrors = {};
  if (!v.currentPassword) {
    errors.currentPassword = "Enter your current password.";
  }
  if (!v.newPassword) {
    errors.newPassword = "Enter a new password.";
  } else if (v.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (v.currentPassword && v.newPassword === v.currentPassword) {
    errors.newPassword = "The new password must be different from the current one.";
  }
  if (!v.confirmPassword) {
    errors.confirmPassword = "Type the new password again.";
  } else if (v.newPassword && v.confirmPassword !== v.newPassword) {
    errors.confirmPassword = "The two passwords do not match.";
  }
  return errors;
};

export interface PasswordRequirement {
  label: string;
  met: boolean;
  /** The backend refuses the save without this one; the rest are advice. */
  required: boolean;
}

export const passwordRequirements = (pw: string): PasswordRequirement[] => [
  { label: `At least ${MIN_PASSWORD_LENGTH} characters`, met: pw.length >= MIN_PASSWORD_LENGTH, required: true },
  { label: "8 or more characters", met: pw.length >= 8, required: false },
  { label: "A number", met: /\d/.test(pw), required: false },
  { label: "A capital letter or symbol", met: /[A-Z]/.test(pw) || /[^A-Za-z0-9]/.test(pw), required: false },
];

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  /** 0 = below the minimum length; 1 to 4 = how many extra checks pass. */
  score: StrengthScore;
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
}

export const passwordStrength = (pw: string): PasswordStrength => {
  if (pw.length < MIN_PASSWORD_LENGTH) return { score: 0, label: "Too short" };
  const extras = passwordRequirements(pw).filter((r) => !r.required && r.met).length;
  const score = Math.min(4, 1 + extras) as StrengthScore;
  const labels: Record<Exclude<StrengthScore, 0>, PasswordStrength["label"]> = {
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };
  return { score, label: labels[score as Exclude<StrengthScore, 0>] };
};
