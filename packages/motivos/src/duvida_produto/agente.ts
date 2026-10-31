import { type ChatRequest, type Contexto, lerDoRepo, rodarAgente } from "@caqui/nucleo";
import { tools } from "./tools";

export const KBS = [
  "KB-001",
  "KB-002",
  "KB-003",
  "KB-004",
  "KB-005",
  "KB-009",
  "KB-010",
  "KB-011",
  "KB-013",
  "KB-014",
  "KB-015",
  "KB-016",
  "KB-023",
  "KB-024",
  "KB-030",
] as const;

export function responder(req: ChatRequest, ctx: Contexto) {
  return rodarAgente({
    motivo: "duvida_produto",
    skill: lerDoRepo("packages/motivos/src/duvida_produto/skills/explicar_produto.md"),
    kbs: KBS,
    tools,
    req,
    modelo: ctx.modelo,
  });
}
