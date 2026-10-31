import type { Canal, Resposta } from "../contrato";
import { KB_OBSOLETAS } from "../kb";
import { analisarUi } from "../openui";
import { mascararCpf } from "./entrada";

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
