import { type ChatRequest, type Contexto, lerDoRepo, rodarAgente } from "@caqui/nucleo";
import { criarTools } from "./tools";

export const KBS = ["KB-002", "KB-008", "KB-009", "KB-010", "KB-011", "KB-012"] as const;

export function responder(req: ChatRequest, ctx: Contexto) {
  return rodarAgente({
    motivo: "rentabilidade_extrato",
    skill: lerDoRepo("packages/motivos/src/rentabilidade_extrato/skills/comparar_rendimento.md"),
    kbs: KBS,
    tools: criarTools(ctx),
    req,
    modelo: ctx.modelo,
  });
}
