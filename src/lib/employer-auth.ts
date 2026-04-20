import { supabase } from "@/integrations/supabase/client";

/**
 * Employer mock-OTP auth — separate phone namespace from workers
 * so the same phone number can theoretically have both accounts in dev.
 *
 * Synthetic email: `<phone>@phone-employer.kaamproof.local`
 * Mirrors src/lib/auth.ts for workers.
 */

const DEV_MODE = true;

export function employerPhoneToEmail(phone: string): string {
  return `${phone}@phone-employer.kaamproof.local`;
}

function employerPhoneToPassword(phone: string): string {
  return `kpe_${phone}_${phone.length}`;
}

export interface VerifyOtpResult {
  isNewUser: boolean;
  userId: string;
}

export async function sendEmployerMockOtp(_phone: string): Promise<void> {
  return;
}

export async function verifyEmployerMockOtp(
  phone: string,
  otp: string,
): Promise<VerifyOtpResult> {
  if (!DEV_MODE) throw new Error("Real OTP not configured.");
  if (!/^\d{6}$/.test(otp)) throw new Error("Invalid OTP format");

  const email = employerPhoneToEmail(phone);
  const password = employerPhoneToPassword(phone);

  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error && signIn.data.user) {
    return { isNewUser: false, userId: signIn.data.user.id };
  }

  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: { phone, account_type: "employer" },
    },
  });
  if (signUp.error) throw signUp.error;
  if (!signUp.data.user) throw new Error("Signup failed");

  if (!signUp.data.session) {
    const retry = await supabase.auth.signInWithPassword({ email, password });
    if (retry.error) throw retry.error;
  }

  // Assign 'employer' role (idempotent)
  await supabase
    .from("user_roles")
    .insert({ user_id: signUp.data.user.id, role: "employer" as const });

  return { isNewUser: true, userId: signUp.data.user.id };
}
