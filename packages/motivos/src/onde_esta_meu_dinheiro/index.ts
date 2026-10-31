import type { Motivo } from "@caqui/nucleo";
import { KBS, responder } from "./agente";

export const MOTIVO: Motivo = {
  id: "onde_esta_meu_dinheiro",
  descricao:
    "Aplicação, resgate, liquidação ou transferência: quando o dinheiro cai, status de pedido, dinheiro que parece sumido.",
  exemplos: [
    "Resgatei ontem e não caiu. Sumiu?",
    "Quando cai o resgate do fundo?",
    "Fiz um Pix e ainda não chegou",
  ],
  gatilhos:
    /resgat|liquida|\bca(iu|i|ir)\b|sumiu|n[aã]o chegou|transfer|\bpix\b|aplica[cç][aã]o|apliquei|hor[aá]rio de corte/i,
  regras: [1, 9],
  kbs: KBS,
  responder,
};
