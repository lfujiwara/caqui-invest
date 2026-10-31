import {
  type ChatRequest,
  emSaoPaulo,
  encaminhar,
  fonteKb,
  type Motivo,
  type Resposta,
  SEM_GUARDRAILS_PROPRIOS,
  somarDiasCorridos,
} from "@caqui/nucleo";

const ENCERRAR = /encerr|cancel|fechar (a |minha )?conta|sair da caqui|seguir encerramento/i;

// Regra 7: no máximo uma tentativa de retenção. A retenção é a resposta "responder" desta fatia.
const jaTentouReter = (req: ChatRequest) =>
  req.historico.some(
    (m) =>
      m.autor === "caqui" &&
      m.resposta.motivo === "reclamacao_cancelamento" &&
      m.resposta.acao === "responder",
  );

async function responder(req: ChatRequest): Promise<Resposta> {
  if (ENCERRAR.test(req.mensagem)) {
    if (jaTentouReter(req)) {
      return encaminhar({
        req,
        motivo: "reclamacao_cancelamento",
        fila: "atendimento",
        texto: "Certo, seguimos com o encerramento, sem mais perguntas.",
        fontes: [fonteKb("KB-027")],
      });
    }
    return {
      acao: "responder",
      motivo: "reclamacao_cancelamento",
      texto:
        "Você pode encerrar sua conta quando quiser. Os passos: resgatar os investimentos e transferir o saldo para uma conta de mesma titularidade. Produtos sem liquidez diária continuam até o vencimento. Antes de seguir, quer me contar o que te fez querer sair? Se preferir, seguimos direto com o encerramento.",
      fontes: [fonteKb("KB-027"), fonteKb("KB-018")],
      interacao: {
        tipo: "botoes",
        opcoes: [
          { id: "seguir_encerramento", titulo: "Seguir encerramento" },
          { id: "contar_problema", titulo: "Contar o problema" },
        ],
      },
      ui: null,
      handoff: null,
    };
  }
  const { data } = emSaoPaulo(req.momento);
  return encaminhar({
    req,
    motivo: "reclamacao_cancelamento",
    fila: "atendimento",
    texto:
      "Registrei sua reclamação. A resposta chega em até 7 dias corridos, e você acompanha pelo protocolo no app. Você não precisa repetir nada: quem cuidar do caso vê esta conversa.",
    fontes: [fonteKb("KB-026")],
    retornoPrevisto: `${somarDiasCorridos(data, 7)}T20:00:00-03:00`,
  });
}

export const MOTIVO: Motivo = {
  id: "reclamacao_cancelamento",
  descricao: "Reclamação, insatisfação ou pedido para encerrar ou cancelar a conta.",
  exemplos: ["Quero encerrar minha conta", "Quero fazer uma reclamação", "Vou no Procon"],
  gatilhos: /reclama|encerr|cancel|fechar (a |minha )?conta|procon|ouvidoria|insatisfeit/i,
  regras: [7],
  kbs: ["KB-018", "KB-026", "KB-027"],
  guardrails: SEM_GUARDRAILS_PROPRIOS,
  responder,
};
