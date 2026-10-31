import type { ChatRequest, Fila, Fonte, MotivoId, Resposta } from "../contrato";
import type { Cliente } from "../dados";

export type ContextoGuardrail = {
  req: ChatRequest;
  cliente: Cliente | null;
  /** Artigos que a resposta pode citar: os da fatia mais os do encaminhamento. */
  kbs: readonly string[];
};

/** O caso vai para uma pessoa. Sem `motivo`, vale o da fatia que disparou, ou o da rota. */
export type Encaminhamento = {
  tipo: "encaminhar";
  fila: Fila;
  texto: string;
  fontes?: Fonte[];
  motivo?: MotivoId;
};

/** Só a camada global de entrada troca de fatia: golpe e dado de terceiro vão para segurança. */
export type Desvio = { tipo: "desviar"; motivo: MotivoId };

export type GuardrailEntrada<V = Encaminhamento> = {
  id: string;
  checar(ctx: ContextoGuardrail): V | null;
};

export type GuardrailSaida = {
  id: string;
  checar(resposta: Resposta, ctx: ContextoGuardrail): Encaminhamento | null;
};

/**
 * Segunda camada. A global vale para toda conversa; esta é declarada por cada motivo e repete,
 * com outra entrada ou noutro ponto, regras que a global já cobre. Se uma camada falha, a outra pega.
 */
export type GuardrailsDoMotivo = {
  entrada: readonly GuardrailEntrada[];
  saida: readonly GuardrailSaida[];
};

export function primeiroQueDispara<G extends { id: string }, V>(
  guardrails: readonly G[],
  checar: (g: G) => V | null,
): { id: string; veredito: V } | null {
  for (const g of guardrails) {
    const veredito = checar(g);
    if (veredito) return { id: g.id, veredito };
  }
  return null;
}
