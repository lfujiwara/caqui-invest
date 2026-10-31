import { GUARDRAILS_DE_FATIA_COM_LLM, type Motivo } from "@caqui/nucleo";
import { KBS, responder } from "./agente";

export const MOTIVO: Motivo = {
  id: "duvida_produto",
  descricao:
    "Dúvida de conceito ou de produto: o que é CDI, liquidez, FGC, como funciona CDB, LCI, fundo, Tesouro, produtos oferecidos.",
  exemplos: [
    "O que é liquidez diária?",
    "Esse CDB tem garantia?",
    "Vocês têm previdência privada?",
    "E no sábado?",
  ],
  gatilhos:
    /o que (é|e|significa)|como funciona|garantia|\bfgc\b|\bcdb\b|\blci\b|\blca\b|tesouro|fundo|a[cç](ão|ões|oes)|liquidez|previd[eê]ncia|cripto|car[eê]ncia|voc[eê]s (t[eê]m|oferecem)|\bcdi\b|s[aá]bado|domingo|feriado|fim de semana/i,
  regras: [9],
  kbs: KBS,
  guardrails: GUARDRAILS_DE_FATIA_COM_LLM,
  responder,
};
