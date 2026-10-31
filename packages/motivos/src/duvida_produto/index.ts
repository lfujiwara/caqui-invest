import type { Motivo } from "@caqui/nucleo";
import { KBS, responder } from "./agente";

export const MOTIVO: Motivo = {
  id: "duvida_produto",
  descricao:
    "Dúvida de conceito ou de produto: o que é CDI, liquidez, FGC, como funciona CDB, LCI, fundo, Tesouro, produtos oferecidos.",
  exemplos: [
    "O que é liquidez diária?",
    "Esse CDB tem garantia?",
    "Vocês têm previdência privada?",
  ],
  gatilhos:
    /o que (é|e|significa)|como funciona|garantia|\bfgc\b|\bcdb\b|\blci\b|\blca\b|tesouro|fundo|a[cç](ão|ões|oes)|liquidez|previd[eê]ncia|cripto|car[eê]ncia|voc[eê]s (t[eê]m|oferecem)|\bcdi\b/i,
  regras: [9],
  kbs: KBS,
  responder,
};
