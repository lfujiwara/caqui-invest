import {
  type ChatRequest,
  encaminhar,
  type Motivo,
  PEDIDO_DE_RECOMENDACAO,
  type Resposta,
  semRecomendacao,
  TEXTO_SEM_RECOMENDACAO,
} from "@caqui/nucleo";

// Determinística: nenhuma insistência, troca de papel ou "o que você faria" chega a um modelo.
async function responder(req: ChatRequest): Promise<Resposta> {
  return encaminhar({
    req,
    motivo: "pedido_recomendacao",
    fila: "especialista",
    texto: TEXTO_SEM_RECOMENDACAO,
  });
}

export const MOTIVO: Motivo = {
  id: "pedido_recomendacao",
  descricao:
    "Pedido de recomendação: onde investir, qual o melhor produto, o que o atendente faria no lugar do cliente.",
  exemplos: [
    "Tenho R$ 50 mil, onde eu coloco?",
    "O que você faria no meu lugar?",
    "Vale mais a pena o CDB ou o fundo pra mim?",
  ],
  gatilhos: PEDIDO_DE_RECOMENDACAO,
  regras: [4, 11],
  kbs: ["KB-029"],
  guardrails: { entrada: [], saida: [semRecomendacao] },
  responder,
};
