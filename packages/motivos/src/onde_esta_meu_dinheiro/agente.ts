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

export async function responder(req: ChatRequest, ctx: Contexto) {
  let ui: string | null = null;
  const resposta = await rodarAgente({
    motivo: "onde_esta_meu_dinheiro",
    skill: lerDoRepo("packages/motivos/src/onde_esta_meu_dinheiro/skills/liquidacao.md"),
    kbs: KBS,
    tools: criarTools(ctx, req.momento, (u) => {
      ui = u;
    }),
    req,
    modelo: ctx.modelo,
  });
  // A Timeline montada pela tool usa as datas do calendário; a do modelo fica de reserva.
  return { ...resposta, ui: ui ?? resposta.ui };
}
