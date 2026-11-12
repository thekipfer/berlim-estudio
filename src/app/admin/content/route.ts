import { isLoggedIn } from "@/lib/auth";
import { getContent } from "@/lib/content-store";

/** Latest saved content, for the in-page editor. Admin only. */
export async function GET() {
  if (!(await isLoggedIn())) return Response.json({ error: "Não autorizado." }, { status: 401 });
  return Response.json(await getContent(), { headers: { "Cache-Control": "no-store" } });
}
