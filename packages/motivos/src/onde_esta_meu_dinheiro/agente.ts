import { type ChatRequest, type Contexto, lerDoRepo, rodarAgente } from "@caqui/nucleo";
import { criarTools } from "./tools";

export const KBS = [
  "KB-004",
  "KB-005",
  "KB-006",
  "KB-008",
  "KB-011",
  "KB-015",
  "KB-016",
  "KB-018",
  "KB-030",
] as const;

export function responder(req: ChatRequest, ctx: Contexto) {
  return rodarAgente({
    motivo: "onde_esta_meu_dinheiro",
    skill: lerDoRepo("packages/motivos/src/onde_esta_meu_dinheiro/skills/liquidacao.md"),
    kbs: KBS,
    tools: criarTools(ctx),
    req,
    modelo: ctx.modelo,
  });
}
