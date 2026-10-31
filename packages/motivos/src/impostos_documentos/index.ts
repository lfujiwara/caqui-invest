import type { Motivo } from "@caqui/nucleo";
import { KBS, responder } from "./agente";

export const MOTIVO: Motivo = {
  id: "impostos_documentos",
  descricao: "Imposto de renda, alíquota, informe de rendimentos e outros documentos.",
  exemplos: [
    "Cadê meu informe de rendimentos?",
    "Qual a alíquota de IR se eu resgatar hoje?",
    "O IR incide sobre o valor total?",
  ],
  gatilhos: /imposto|\bir\b|al[ií]quota|informe|declara[cç][aã]o|documento|comprovante/i,
  regras: [2],
  kbs: KBS,
  responder,
};
