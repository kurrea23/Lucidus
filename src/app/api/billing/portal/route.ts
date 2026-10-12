import {
  api,
  ApiError,
  appURL,
  customerID,
  json,
  portalConfiguration,
  requireUser,
  stripeClient,
} from "@/lib/server/backend";
export const runtime = "nodejs";
export function POST(request: Request) {
  return api(async () => {
    const { db, user } = await requireUser(request);
    const customer = await customerID(db, user.id);
    if (!customer) throw new ApiError(404, "There is no billing account yet.");
    return json({
      url: (
        await stripeClient().billingPortal.sessions.create({
          customer,
          configuration: await portalConfiguration(),
          return_url: `${appURL()}/premium`,
        })
      ).url,
    });
  });
}
