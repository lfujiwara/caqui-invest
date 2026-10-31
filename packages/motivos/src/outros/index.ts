import { type Motivo, pedidoDeRecomendacao, semEntender, semRecomendacao } from "@caqui/nucleo";
import { KBS, responder } from "./agente";

export const MOTIVO: Motivo = {
  id: "outros",
  descricao:
    "Mudança de dados cadastrais, parceria com o varejista, tarifas e qualquer assunto fora dos outros motivos.",
  exemplos: [
    "Como mudo meu endereço?",
    "Abri a conta pela loja, tenho algum benefício?",
    "Vocês cobram tarifa?",
  ],
  gatilhos:
    /endere[cç]o|telefone|e-?mail|cadastr|parceria|varejista|\bloja\b|tarifa|mudar (meu|o) nome/i,
  regras: [8],
  kbs: KBS,
  guardrails: { entrada: [pedidoDeRecomendacao, semEntender], saida: [semRecomendacao] },
  responder,
};
