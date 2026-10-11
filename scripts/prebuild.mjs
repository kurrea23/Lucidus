// Production hosts must be explicitly configured for the real application.
// Preview deployments and local production builds can run the labeled browser demo.
if (
  process.env.VERCEL_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT_NAME?.toLowerCase() === "production" ||
  process.env.TRIPCOOKER_RELEASE_TARGET === "production"
) {
  await import("./check-launch.mjs");
  if (process.exitCode) process.exit(process.exitCode);
}
