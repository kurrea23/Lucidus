import { z } from "zod";
import { databaseSchema } from "@/lib/validation";
import {
  api,
  ApiError,
  json,
  loadState,
  planFor,
  readJSON,
  requireUser,
} from "@/lib/server/backend";
export const runtime = "nodejs";
export function GET(request: Request) {
  return api(async () => {
    const { db, user } = await requireUser(request);
    return json(await loadState(db, user));
  });
}
export function PUT(request: Request) {
  return api(async () => {
    const { db, user } = await requireUser(request);
    const parsed = z
      .object({ data: databaseSchema, version: z.number().int().min(0) })
      .strict()
      .safeParse(await readJSON(request));
    if (!parsed.success)
      throw new ApiError(
        400,
        "Check dates, amounts, and required fields before saving.",
      );
    const plan = await planFor(db, user.id);
    const data = {
      ...parsed.data.data,
      user: {
        ...parsed.data.data.user,
        id: user.id,
        email: user.email ?? "",
        plan,
        createdAt: new Date(user.created_at).toISOString(),
      },
    };
    const result = await db.rpc("save_tripcooker_state", {
      p_user_id: user.id,
      p_version: parsed.data.version,
      p_data: data,
      p_premium: plan === "premium",
    });
    if (result.error?.message.includes("state_conflict"))
      throw new ApiError(
        409,
        "This account changed in another tab or device. Export your unsaved changes before loading the latest saved version.",
      );
    if (result.error?.message.includes("premium_required"))
      throw new ApiError(
        403,
        "Your free plan allows one active trip. Complete or archive a trip, or upgrade.",
      );
    if (result.error) throw result.error;
    return json({ version: result.data, user: data.user });
  });
}
