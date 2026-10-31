import { type ChatRequest, type Contexto, lerDoRepo, rodarAgente } from "@caqui/nucleo";
import { criarTools } from "./tools";

export const KBS = ["KB-009", "KB-010", "KB-011", "KB-017"] as const;

export function responder(req: ChatRequest, ctx: Contexto) {
  return rodarAgente({
    motivo: "impostos_documentos",
    skill: lerDoRepo("packages/motivos/src/impostos_documentos/skills/ir_e_documentos.md"),
    kbs: KBS,
    tools: criarTools(ctx),
    req,
    modelo: ctx.modelo,
  });
}
