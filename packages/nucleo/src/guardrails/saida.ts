import type { Canal, Resposta } from "../contrato";
import { KB_OBSOLETAS } from "../kb";
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

/** O WhatsApp não desenha componentes OpenUI; os limites de interação já valem nos dois canais. */
export function adaptarAoCanal(resposta: Resposta, canal: Canal): Resposta {
  return {
    ...resposta,
    texto: mascararCpf(resposta.texto),
    ui: canal === "whatsapp" ? null : resposta.ui,
  };
}
