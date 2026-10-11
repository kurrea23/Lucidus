import {
  api,
  checkoutAvailable,
  customerID,
  json,
  requireUser,
} from "@/lib/server/backend";
export function GET(request: Request) {
  return api(async () => {
    const { db, user } = await requireUser(request);
    return json({
      canManage: Boolean(await customerID(db, user.id)),
      checkoutAvailable: await checkoutAvailable(),
    });
  });
}
