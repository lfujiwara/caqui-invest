import { type ChatRequest, encaminhar, type Motivo, type Resposta } from "@caqui/nucleo";

// Determinística: nenhuma insistência, troca de papel ou "o que você faria" chega a um modelo.
async function responder(req: ChatRequest): Promise<Resposta> {
  return encaminhar({
    req,
    motivo: "pedido_recomendacao",
    fila: "especialista",
    texto:
      "Eu não indico onde investir: isso depende do seu perfil e dos seus objetivos, e só um especialista em investimentos pode avaliar. Posso explicar como cada produto funciona, por exemplo liquidez, garantia do FGC e imposto de renda. Para uma orientação personalizada, vou te encaminhar para um especialista, que atende com agendamento.",
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
  gatilhos:
    /onde (eu )?(coloco|invisto|investir|aplico|aplicar)|recomend|no meu lugar|assessor|vale (mais )?a pena|me diz o que fazer|qual (o |é o )?melhor|devo (investir|aplicar)|o que (eu )?fa[cç]o com/i,
  regras: [4, 11],
  kbs: ["KB-029"],
  responder,
};
