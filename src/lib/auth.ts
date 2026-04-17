import { supabase } from "@/integrations/supabase/client";

/**
 * Mock OTP auth strategy:
 * - Phone number is converted to a synthetic email: `<phone>@phone.kaamproof.local`
 * - Password is deterministic from the phone (so OTP is purely UX, not crypto).
 * - Auto-confirm email is enabled in Supabase, so signup is instant.
 * - In dev mode any 6-digit OTP works. In prod, swap to real phone OTP.
 */

export const DEV_MODE = true;

export function phoneToEmail(phone: string): string {
  return `${phone}@phone.kaamproof.local`;
}

function phoneToPassword(phone: string): string {
  // Deterministic; not real security — auth is gated by mock OTP UX.
  return `kp_${phone}_${phone.length}`;
}

export interface VerifyOtpResult {
  isNewUser: boolean;
  userId: string;
}

/**
 * "Send" an OTP. In dev mode this is a no-op.
 * In a future real-SMS integration, hook your provider here.
 */
export async function sendMockOtp(_phone: string): Promise<void> {
  // no-op in dev
  return;
}

/**
 * Verify the mock OTP. Any 6-digit code is accepted in dev.
 * Signs in if user exists, otherwise signs up. Returns whether user was new.
 */
export async function verifyMockOtp(
  phone: string,
  otp: string,
  language: "hi" | "en" = "hi"
): Promise<VerifyOtpResult> {
  if (!DEV_MODE) {
    throw new Error("Real OTP not configured. Set DEV_MODE=false and wire SMS provider.");
  }
  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Invalid OTP format");
  }

  const email = phoneToEmail(phone);
  const password = phoneToPassword(phone);

  // Try sign in first
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error && signIn.data.user) {
    return { isNewUser: false, userId: signIn.data.user.id };
  }

  // Sign up
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: { phone, language },
    },
  });
  if (signUp.error) throw signUp.error;
  if (!signUp.data.user) throw new Error("Signup failed");

  // With auto-confirm on, signUp returns a session immediately.
  // If somehow no session, attempt sign-in.
  if (!signUp.data.session) {
    const retry = await supabase.auth.signInWithPassword({ email, password });
    if (retry.error) throw retry.error;
  }

  return { isNewUser: true, userId: signUp.data.user.id };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
