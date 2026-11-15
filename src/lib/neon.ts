import { createClient } from "@neon/neon-js";

/**
 * Neon project "H&H" — Auth (accounts) and Data API (profiles, addresses, orders).
 * This URL is public by design: access is controlled by the signed-in user's session
 * and by row-level security in the database, not by keeping the URL secret.
 */
const NEON_DATABASE_URL =
  (import.meta.env.VITE_NEON_DATABASE_URL as string | undefined) ??
  "https://ep-spring-sunset-arzedt99.c-4.us-west-2.aws.neon.tech/neondb";

/**
 * `allowAnonymous` lets the app ask the database a question before anyone has
 * signed in — which the sign-in screen has to do, to turn a username into the
 * account's email. The SDK fetches a short-lived anonymous token for that.
 *
 * It opens nothing up: the `anonymous` role holds no privilege on any table,
 * only on the two username functions it is granted explicitly.
 */
export const neon = createClient(NEON_DATABASE_URL, { auth: { allowAnonymous: true } });

/** Turns an SDK / API error into a short message that can be shown to the user. */
export function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
