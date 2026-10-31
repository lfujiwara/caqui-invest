import type { Motivo } from "@caqui/nucleo";
import { KBS, responder } from "./agente";

export const MOTIVO: Motivo = {
  id: "rentabilidade_extrato",
  descricao:
    "Rentabilidade, saldo e extrato: quanto rendeu, comparação com a poupança, bruto versus líquido.",
  exemplos: [
    "Rendeu menos que a poupança, é isso mesmo?",
    "Qual a taxa da poupança hoje?",
    "Quanto rendeu meu CDB?",
  ],
  gatilhos: /rend(eu|imento|endo|e )|rentabilidade|extrato|\bsaldo\b|poupan[cç]a|l[ií]quido|bruto/i,
  regras: [3],
  kbs: KBS,
  responder,
};
