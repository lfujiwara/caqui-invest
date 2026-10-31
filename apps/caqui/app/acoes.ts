"use server";

import { ChatRequest, type Resposta } from "@caqui/nucleo";
import { atender } from "../lib/atender";

/** Server action das duas páginas. O argumento vem do navegador, então é validado aqui. */
export async function enviarMensagem(req: ChatRequest): Promise<Resposta> {
  return atender(ChatRequest.parse(req));
}
