import type { LanguageModel } from "ai";
import type { ChatRequest, MotivoId, Resposta } from "./contrato";
import type { Cliente } from "./dados";

export type Contexto = {
  /** Cliente autenticado. As tools só enxergam este cliente (regra 10). */
  cliente: Cliente | null;
  modelo: LanguageModel;
};

/** Uma fatia por motivo de contato. O registro vive em @caqui/motivos. */
export type Motivo = {
  id: MotivoId;
  descricao: string;
  exemplos: readonly string[];
  gatilhos: RegExp;
  regras: readonly number[];
  /** Artigos que a fatia pode citar. O guardrail de saída bloqueia qualquer outro. */
  kbs: readonly string[];
  responder(req: ChatRequest, ctx: Contexto): Promise<Resposta>;
};

export type Motivos = Readonly<Record<MotivoId, Motivo>>;
