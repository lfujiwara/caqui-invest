import { descreverModelos } from "@caqui/nucleo";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ ok: true, modelos: descreverModelos() });
}
