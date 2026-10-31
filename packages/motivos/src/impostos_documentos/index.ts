import { GUARDRAILS_DE_FATIA_COM_LLM, type Motivo } from "@caqui/nucleo";
import { KBS, responder } from "./agente";

export const MOTIVO: Motivo = {
  id: "impostos_documentos",
  descricao:
    "IR e isenções dos produtos da Caqui, informe de rendimentos, extratos em PDF, comprovantes e dúvidas sobre documentos para declaração.",
  exemplos: [
    "Cadê meu informe de rendimentos?",
    "Qual a alíquota de IR se eu resgatar hoje?",
    "O IR incide sobre o valor total?",
    "Preciso de um extrato de outubro em PDF",
    "Minha LCI é isenta de imposto?",
    "Meu informe de rendimentos veio errado",
  ],
  gatilhos:
    /imposto|\bir\b|al[ií]quota|informe|declara[cç][aã]o|documento|comprovante|\bpdf\b|isen[cç][aã]o|isent[oa]/i,
  regras: [2],
  kbs: KBS,
  guardrails: GUARDRAILS_DE_FATIA_COM_LLM,
  responder,
};
