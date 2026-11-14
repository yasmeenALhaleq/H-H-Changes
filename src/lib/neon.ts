import { createClient } from "@neon/neon-js";

/**
 * Neon project "H&H" — Auth (accounts) and Data API (profiles, addresses, orders).
 * This URL is public by design: access is controlled by the signed-in user's session
 * and by row-level security in the database, not by keeping the URL secret.
 */
const NEON_DATABASE_URL =
  (import.meta.env.VITE_NEON_DATABASE_URL as string | undefined) ??
  "https://ep-spring-sunset-arzedt99.c-4.us-west-2.aws.neon.tech/neondb";

export const neon = createClient(NEON_DATABASE_URL);

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
