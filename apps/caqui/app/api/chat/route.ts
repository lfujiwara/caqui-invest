import { ChatRequest } from "@caqui/nucleo";
import { atender } from "../../../lib/atender";

export async function POST(request: Request): Promise<Response> {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "JSON inválido" }, { status: 400 });
  }
  const req = ChatRequest.safeParse(corpo);
  if (!req.success) {
    return Response.json(
      { erro: "ChatRequest inválido", detalhes: req.error.issues },
      { status: 400 },
    );
  }
  return Response.json(await atender(req.data));
}
