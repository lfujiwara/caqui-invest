import { tool } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { rodarAgente, TOOL_DA_RESPOSTA } from "./agente";
import { encaminhar } from "./atendimento";
import { type ChatRequest, MotivoId, type Resposta } from "./contrato";
import { atender } from "./harness";
import { fonteKb } from "./kb";
import { lerModo, modeloDoMotivo } from "./modelos";
import type { Motivo, Motivos } from "./motivo";
import { linhaDeTrace, type Trace } from "./trace";

const UI_VALIDA = [
  "root = Painel([p])",
  'p = CartaoProtocolo("CQ-2026-000123", "atendimento", "Em análise")',
].join("\n");

// Registro falso: cada fatia responde com o próprio id, para o teste ver quem foi chamado.
function registroFalso(sobrescrever: Partial<Motivos> = {}): Motivos {
  const fatia = (id: MotivoId, gatilhos: RegExp): Motivo => ({
    id,
    descricao: id,
    exemplos: [],
    gatilhos,
    regras: [],
    kbs: ["KB-004"],
    responder: async (req) =>
      id === "acesso_seguranca"
        ? encaminhar({ req, motivo: id, fila: "seguranca", texto: "Não passe o código." })
        : {
            acao: "responder",
            motivo: id,
            texto: `fatia ${id}`,
            fontes: [],
            interacao: null,
            ui: UI_VALIDA,
            handoff: null,
          },
  });
  const gatilhos: Record<MotivoId, RegExp> = {
    onde_esta_meu_dinheiro: /resgat/i,
    duvida_produto: /o que é/i,
    rentabilidade_extrato: /rendeu/i,
    acesso_seguranca: /senha/i,
    impostos_documentos: /imposto/i,
    pedido_recomendacao: /onde invisto/i,
    reclamacao_cancelamento: /reclama/i,
    outros: /endereço/i,
  };
  const base = Object.fromEntries(MotivoId.options.map((id) => [id, fatia(id, gatilhos[id])]));
  return { ...base, ...sobrescrever } as Motivos;
}

const req = (mensagem: string, extra: Partial<ChatRequest> = {}): ChatRequest => ({
  canal: "web",
  mensagem,
  historico: [],
  idCliente: null,
  momento: "2026-11-18T14:00-03:00",
  ...extra,
});

async function atenderComTrace(r: ChatRequest, motivos = registroFalso()) {
  const traces: Trace[] = [];
  const resposta = await atender(r, motivos, (t) => traces.push(t));
  return { resposta, trace: traces[0] };
}

describe("atender", () => {
  it("roteia pelo gatilho e chama a fatia", async () => {
    const { resposta } = await atenderComTrace(req("o que é CDI?"));
    expect(resposta.motivo).toBe("duvida_produto");
  });

  it("provedor do roteador indisponível: cai nos gatilhos e registra o erro", async () => {
    vi.stubEnv("CAQUI_MODELO_ROTEADOR", "openrouter:nvidia/nemotron-3.5-super-vl:free");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    try {
      const { resposta, trace } = await atenderComTrace(req("o que é CDI?"));
      expect(resposta.motivo).toBe("duvida_produto");
      expect(trace?.guardrails).toEqual(["roteador_por_gatilhos"]);
      expect(trace?.erro).toContain("OPENROUTER_API_KEY");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("regra 5: golpe no meio de outra pergunta vai para segurança antes do roteador", async () => {
    const { resposta, trace } = await atenderComTrace(
      req("Quando cai meu resgate? Antes, o gerente me ligou e pediu o código do SMS"),
    );
    expect(resposta.motivo).toBe("acesso_seguranca");
    expect(resposta.acao).toBe("encaminhar_seguranca");
    expect(trace?.guardrails).toEqual(["golpe"]);
  });

  it("regra 6: cliente idosa pedindo resgate total vai para pessoa", async () => {
    const { resposta } = await atenderComTrace(
      req("Quero resgatar todo o dinheiro hoje", { idCliente: "C-0001" }),
    );
    expect(resposta.acao).toBe("encaminhar_humano");
    expect(resposta.motivo).toBe("onde_esta_meu_dinheiro");
    expect(resposta.texto).toContain("mesma titularidade");
  });

  it("regra 8: pedido de pessoa às 14h e às 23h", async () => {
    const tarde = await atenderComTrace(req("Quero falar com uma pessoa"));
    const noite = await atenderComTrace(
      req("Quero falar com uma pessoa", { momento: "2026-11-18T23:00-03:00" }),
    );
    expect(tarde.resposta.handoff?.humanoDisponivel).toBe(true);
    expect(noite.resposta.handoff?.humanoDisponivel).toBe(false);
  });

  it("regra 8: depois de cinco respostas, entrega a uma pessoa", async () => {
    const em = "2026-11-18T14:00-03:00";
    const resposta: Resposta = {
      acao: "responder",
      motivo: "duvida_produto",
      texto: "x",
      fontes: [],
      interacao: null,
      ui: null,
      handoff: null,
    };
    const historico = Array.from({ length: 5 }, () => [
      { autor: "cliente" as const, texto: "o que é CDI?", em },
      { autor: "caqui" as const, resposta, em },
    ]).flat();
    const { resposta: r, trace } = await atenderComTrace(req("o que é CDB?", { historico }));
    expect(r.acao).toBe("encaminhar_humano");
    expect(trace?.guardrails).toEqual(["limite_de_passos"]);
  });

  it("regras 3 e 9: resposta factual sem fonte é bloqueada", async () => {
    const motivos = registroFalso({
      duvida_produto: {
        ...registroFalso().duvida_produto,
        responder: async () => ({
          acao: "responder",
          motivo: "duvida_produto",
          texto: "Rende 12% ao ano.",
          fontes: [],
          interacao: null,
          ui: null,
          handoff: null,
        }),
      },
    });
    const { resposta, trace } = await atenderComTrace(req("o que é CDB?"), motivos);
    expect(resposta.texto).not.toContain("12%");
    expect(resposta.acao).toBe("encaminhar_humano");
    expect(trace?.guardrails).toEqual(["factual_sem_fonte"]);
  });

  it("falha da fatia vira encaminhamento, não erro para o cliente", async () => {
    const motivos = registroFalso({
      duvida_produto: {
        ...registroFalso().duvida_produto,
        responder: async () => {
          throw new Error("provedor fora do ar");
        },
      },
    });
    const { resposta, trace } = await atenderComTrace(req("o que é CDB?"), motivos);
    expect(resposta.acao).toBe("encaminhar_humano");
    expect(trace?.erro).toBe("provedor fora do ar");
  });

  it("web mantém ui válida e descarta a inválida antes de sair, com trace", async () => {
    const valida = await atenderComTrace(req("o que é CDI?"));
    expect(valida.resposta.ui).toBe(UI_VALIDA);
    expect(valida.trace?.guardrails).not.toContain("ui_invalida");

    const motivos = registroFalso({
      duvida_produto: {
        ...registroFalso().duvida_produto,
        responder: async () => ({
          acao: "responder",
          motivo: "duvida_produto",
          texto: "CDI é a taxa de referência entre bancos.",
          fontes: [],
          interacao: null,
          ui: "<Cartao />",
          handoff: null,
        }),
      },
    });
    const invalida = await atenderComTrace(req("o que é CDI?"), motivos);
    expect(invalida.resposta.ui).toBeNull();
    expect(invalida.resposta.texto).toBe("CDI é a taxa de referência entre bancos.");
    expect(invalida.trace?.guardrails).toContain("ui_invalida");
  });

  it("WhatsApp recebe ui = null", async () => {
    const { resposta } = await atenderComTrace(req("o que é CDI?", { canal: "whatsapp" }));
    expect(resposta.ui).toBeNull();
  });

  it("regra 10: CPF nunca chega à fatia nem ao trace", async () => {
    let visto = "";
    const motivos = registroFalso({
      duvida_produto: {
        ...registroFalso().duvida_produto,
        responder: async (r) => {
          visto = r.mensagem;
          return encaminhar({ req: r, motivo: "duvida_produto", fila: "atendimento", texto: "ok" });
        },
      },
    });
    const { trace } = await atenderComTrace(req("o que é CDB? meu cpf é 123.456.789-01"), motivos);
    expect(visto).not.toContain("123.456");
    expect(trace && linhaDeTrace(trace)).not.toContain("123.456");
    expect(trace && linhaDeTrace(trace)).toContain("***.***.789-**");
  });
});

describe("modelos", () => {
  it("lê os modos aceitos", () => {
    expect(lerModo(undefined)).toEqual({ tipo: "offline" });
    expect(lerModo("ollama:llama3.2")).toEqual({ tipo: "ollama", modelo: "llama3.2" });
    expect(lerModo("openrouter:meta-llama/llama-3.3-70b-instruct:free")).toEqual({
      tipo: "openrouter",
      modelo: "meta-llama/llama-3.3-70b-instruct:free",
    });
    expect(() => lerModo("gpt")).toThrow(/modelo inválido/);
  });

  it("o modelo offline responde pelo schema e cita só artigos da fatia", async () => {
    const resposta = await rodarAgente({
      motivo: "duvida_produto",
      skill: "Explique conceitos.",
      kbs: ["KB-004", "KB-013"],
      tools: {
        consultar: tool({
          description: "não é chamada no modo offline",
          inputSchema: z.object({}),
          execute: async () => ({ fonte: "Conta" }),
        }),
      },
      req: req("O que é liquidez diária?"),
      modelo: modeloDoMotivo(["KB-004", "KB-013"]),
    });
    expect(resposta.fontes).toEqual([fonteKb("KB-004")]);
    expect(resposta.texto).toContain("Liquidez diária");
  });

  it("consulta a conta antes de responder, sem forçar JSON em nenhum passo", async () => {
    let passo = 0;
    const proximaChamada = () =>
      passo++ === 0
        ? { toolName: "consultar", input: "{}" }
        : {
            toolName: TOOL_DA_RESPOSTA,
            input: JSON.stringify({ texto: "Seu resgate cai hoje.", kbs: [] }),
          };
    const modelo = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [{ type: "tool-call", toolCallId: "1", ...proximaChamada() }],
        finishReason: { unified: "tool-calls", raw: undefined },
        usage: {
          inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 0, text: 0, reasoning: undefined },
        },
        warnings: [],
      }),
    });
    const resposta = await rodarAgente({
      motivo: "onde_esta_meu_dinheiro",
      skill: "",
      kbs: [],
      tools: {
        consultar: tool({
          description: "lê a conta",
          inputSchema: z.object({}),
          execute: async () => ({ fonte: "Suas operações na Caqui" }),
        }),
      },
      req: req("Cadê meu resgate?"),
      modelo,
    });
    expect(resposta.texto).toBe("Seu resgate cai hoje.");
    expect(resposta.fontes).toEqual([{ tipo: "conta", descricao: "Suas operações na Caqui" }]);
    expect(modelo.doGenerateCalls.map((c) => c.responseFormat?.type ?? "texto")).toEqual([
      "texto",
      "texto",
    ]);
  });
});
