import { MOTIVOS } from "@caqui/motivos";
import { atender as atenderComMotivos, type ChatRequest, type Resposta } from "@caqui/nucleo";

/** Único ponto do app que compõe o núcleo com o registro de motivos. */
export function atender(req: ChatRequest): Promise<Resposta> {
  return atenderComMotivos(req, MOTIVOS);
}
