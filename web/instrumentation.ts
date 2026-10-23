/**
 * Runs once when the server starts: creates or updates the tables and loads reference data,
 * so a fresh Hostinger deploy needs only DATABASE_URL to be set.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) {
    console.warn("[study2india] DATABASE_URL is not set; skipping database setup.");
    return;
  }
  try {
    const { bootstrap } = await import("./lib/bootstrap");
    await bootstrap((m) => console.log(`[study2india] ${m}`));
  } catch (e) {
    console.error("[study2india] Database setup failed:", e);
  }
}
