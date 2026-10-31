import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { type SaidaAgente, TOOL_DA_RESPOSTA } from "./agente";
import { buscarKb } from "./kb";

/**
 * Único ponto que resolve modelos. Valores de CAQUI_MODELO_ROTEADOR e CAQUI_MODELO_MOTIVO:
 * `offline` (padrão, sem rede), `ollama:<modelo>` ou `openrouter:<provedor>/<modelo>`.
 */
export type Modo =
  | { tipo: "offline" }
  | { tipo: "ollama"; modelo: string }
  | { tipo: "openrouter"; modelo: string };

export function lerModo(valor: string | undefined): Modo {
  const v = valor?.trim() || "offline";
  if (v === "offline") return { tipo: "offline" };
  const [, provedor, modelo] = v.match(/^(ollama|openrouter):(.+)$/) ?? [];
  if (provedor === "ollama" && modelo) return { tipo: "ollama", modelo };
  if (provedor === "openrouter" && modelo?.includes("/")) return { tipo: "openrouter", modelo };
  throw new Error(
    `modelo inválido: "${v}". Use offline, ollama:<modelo> ou openrouter:<provedor>/<modelo>`,
  );
}

function modeloOnline(modo: Exclude<Modo, { tipo: "offline" }>): LanguageModel {
  if (modo.tipo === "ollama") {
    const ollama = createOpenAICompatible({
      name: "ollama",
      baseURL: process.env.OLLAMA_URL ?? "http://localhost:11434/v1",
    });
    return ollama.chatModel(modo.modelo);
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY não definida");
  return createOpenRouter({ apiKey }).chat(modo.modelo);
}

function ultimaMensagemDoCliente(
  prompt: Parameters<MockLanguageModelV4["doGenerate"]>[0]["prompt"],
): string {
  const usuario = prompt.filter((m) => m.role === "user").at(-1);
  return (usuario?.content ?? []).map((p) => (p.type === "text" ? p.text : "")).join(" ");
}

/**
 * Modelo offline: determinístico e sem rede. Responde com o trecho do artigo mais próximo
 * da pergunta entre os que a fatia pode citar, no formato de SaidaAgente.
 */
function modeloOffline(kbs: readonly string[]): LanguageModel {
  return new MockLanguageModelV4({
    provider: "caqui",
    modelId: "offline",
    doGenerate: async ({ prompt }) => {
      const [achado] = buscarKb(ultimaMensagemDoCliente(prompt), kbs, 1);
      const saida: SaidaAgente = achado
        ? {
            texto: `Pela nossa base de ajuda (${achado.titulo}): ${achado.texto}`,
            kbs: [achado.id],
          }
        : {
            texto: "Não encontrei isso na nossa base de ajuda. Pode me contar de outro jeito?",
            kbs: [],
          };
      return {
        content: [
          {
            type: "tool-call",
            toolCallId: "offline",
            toolName: TOOL_DA_RESPOSTA,
            input: JSON.stringify(saida),
          },
        ],
        finishReason: { unified: "tool-calls", raw: undefined },
        usage: {
          inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 0, text: 0, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });
}

export type ModeloRoteador = { tipo: "gatilhos" } | { tipo: "llm"; modelo: LanguageModel };

export function modeloDoRoteador(): ModeloRoteador {
  const modo = lerModo(process.env.CAQUI_MODELO_ROTEADOR);
  return modo.tipo === "offline"
    ? { tipo: "gatilhos" }
    : { tipo: "llm", modelo: modeloOnline(modo) };
}

export function modeloDoMotivo(kbs: readonly string[]): LanguageModel {
  const modo = lerModo(process.env.CAQUI_MODELO_MOTIVO);
  return modo.tipo === "offline" ? modeloOffline(kbs) : modeloOnline(modo);
}

export function descreverModelos(): { roteador: string; motivo: string } {
  return {
    roteador: process.env.CAQUI_MODELO_ROTEADOR || "offline",
    motivo: process.env.CAQUI_MODELO_MOTIVO || "offline",
  };
}
