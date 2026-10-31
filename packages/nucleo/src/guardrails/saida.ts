import type { Canal, Resposta } from "../contrato";
import { KB_OBSOLETAS } from "../kb";
import { analisarUi } from "../openui";
import { mascararCpf, normalizar } from "./entrada";

export type Bloqueio = "factual_sem_fonte" | "fonte_nao_permitida";

const FACTUAL = /\d|R\$|%/;

/**
 * Regras 3 e 9: resposta com número, data, valor ou percentual precisa de fonte, e só cita
 * artigos que a fatia declarou e que não estão obsoletos. Devolve o motivo do bloqueio ou null.
 */
export function verificarFontes(
  resposta: Resposta,
  kbsDaFatia: readonly string[],
): Bloqueio | null {
  const kbs = resposta.fontes.flatMap((f) => (f.tipo === "kb" ? [f.id] : []));
  const naoPermitida = kbs.some((id) => KB_OBSOLETAS.has(id) || !kbsDaFatia.includes(id));
  if (naoPermitida) return "fonte_nao_permitida";
  if (FACTUAL.test(resposta.texto) && resposta.fontes.length === 0) return "factual_sem_fonte";
  return null;
}

// "Não passe o código" e "não passe nenhum código" são orientação, não pedido.
const PEDE_SENHA =
  /(?<!\b(nao|nunca|jamais) (me )?)\b(informe|digite|envie|passe|mande|confirme|me (diga|passe|mande|envie))( a| o| sua| seu| aqui)? (senha|codigo|token)\b/;

/** Regra 10: a Caqui nunca pede senha, código ou token. */
export const pedeSenha = (texto: string): boolean => PEDE_SENHA.test(normalizar(texto));

const RECOMENDA =
  /\b(recomendo|sugiro que (voce )?(invista|aplique|coloque)|eu (investiria|aplicaria|colocaria)|a melhor opcao (para|pra) (voce|o seu|a sua)|coloque seu dinheiro (em|no|na))\b/;

/** Regra 4: frase que indica produto ao cliente, mesmo depois de uma explicação correta. */
export const recomenda = (texto: string): boolean => RECOMENDA.test(normalizar(texto));

/** `ui` que o canal web consegue desenhar: programa OpenUI completo da biblioteca, ou null. */
export function uiValida(ui: string | null): string | null {
  return ui !== null && analisarUi(ui).ok ? ui : null;
}

/**
 * O WhatsApp não desenha componentes OpenUI. No web, `ui` inválida vira null aqui, antes de
 * sair, para o cliente nunca receber um programa que o renderer descartaria.
 */
export function adaptarAoCanal(resposta: Resposta, canal: Canal): Resposta {
  return {
    ...resposta,
    texto: mascararCpf(resposta.texto),
    ui: canal === "whatsapp" ? null : uiValida(resposta.ui),
  };
}
