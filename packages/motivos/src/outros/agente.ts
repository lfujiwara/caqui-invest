import {
  type ChatRequest,
  type Contexto,
  type Interacao,
  lerDoRepo,
  type Resposta,
  rodarAgente,
} from "@caqui/nucleo";
import { criarTools } from "./tools";

export const KBS = ["KB-001", "KB-022", "KB-023", "KB-024", "KB-025", "KB-026", "KB-028"] as const;

// Quando não entende, oferece os assuntos em vez de repetir a pergunta (regra 8).
const ASSUNTOS: Interacao = {
  tipo: "lista",
  botao: "Ver assuntos",
  secoes: [
    {
      titulo: "Do que você precisa?",
      linhas: [
        { id: "onde_esta_meu_dinheiro", titulo: "Onde está meu dinheiro" },
        { id: "duvida_produto", titulo: "Dúvida sobre produto" },
        { id: "rentabilidade_extrato", titulo: "Rendimento e extrato" },
        { id: "acesso_seguranca", titulo: "Acesso e segurança" },
        { id: "impostos_documentos", titulo: "Impostos e documentos" },
        { id: "reclamacao_cancelamento", titulo: "Reclamação ou encerrar" },
        { id: "falar_com_pessoa", titulo: "Falar com uma pessoa" },
      ],
    },
  ],
};

export async function responder(req: ChatRequest, ctx: Contexto): Promise<Resposta> {
  const resposta = await rodarAgente({
    motivo: "outros",
    skill: lerDoRepo("packages/motivos/src/outros/skills/outros_assuntos.md"),
    kbs: KBS,
    tools: criarTools(ctx),
    req,
    modelo: ctx.modelo,
  });
  return resposta.fontes.length === 0 ? { ...resposta, interacao: ASSUNTOS } : resposta;
}
