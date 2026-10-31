import {
  type ChatRequest,
  type Contexto,
  clientePorId,
  perguntaDeTeste,
  posicoes,
  somarDiasCorridos,
} from "@caqui/nucleo";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { responder } from "./agente";
import { consultarDocumentosMock, criarTools, descreverIr, simularIr } from "./tools";

const posicao = (produto: string) => {
  const p = posicoes().find((x) => x.idCliente === "C-0002" && x.produto === produto);
  if (!p) throw new Error(`C-0002 sem ${produto}`);
  return p;
};

// Alíquota esperada e proibida saem de deve_conter / nao_deve_conter de cada pergunta.
describe("regra 2 nas posições do Rafael (C-0002)", () => {
  it.each([
    { id: "PT-06", produto: "CDB-LD-100", resgateEm: "2026-11-18" },
    { id: "PT-07", produto: "CDB-LD-100", resgateEm: "2026-11-17" },
    { id: "PT-08", produto: "FUNDO-RF-01", resgateEm: "2026-11-20" },
    { id: "PT-09", produto: "TESOURO-SELIC-2029", resgateEm: "2026-11-18" },
  ])("$id", ({ id, produto, resgateEm }) => {
    const p = perguntaDeTeste(id);
    const texto = descreverIr(simularIr(posicao(produto), resgateEm));
    for (const termo of p.deve_conter) expect(texto).toContain(termo);
    for (const termo of p.nao_deve_conter) expect(texto).not.toContain(termo);
  });

  it("PT-06 bate o IR em reais da resposta esperada", () => {
    const ir = perguntaDeTeste("PT-06").resposta_esperada.match(/IR de (R\$ [\d.,]+)/)?.[1];
    expect(descreverIr(simularIr(posicao("CDB-LD-100"), "2026-11-18"))).toContain(`IR de ${ir}`);
  });

  it("LCI é isenta", () => {
    const lci = posicoes().find((x) => x.produto.startsWith("LCI"));
    if (!lci) throw new Error("sem LCI nos dados");
    expect(simularIr(lci, "2026-11-18").ir).toBe(0);
  });

  it.each([
    [180, 0.225],
    [181, 0.2],
    [360, 0.2],
    [361, 0.175],
    [720, 0.175],
    [721, 0.15],
  ])("%i dias: IR sobre o rendimento na alíquota %f", (dias, aliquota) => {
    const p = {
      ...posicao("CDB-LD-100"),
      valorAplicado: 10000,
      saldoBruto: 11000,
    };
    const t = simularIr(p, somarDiasCorridos(p.dataAplicacao, dias));
    expect(t.dias).toBe(dias);
    expect(t.aliquota).toBe(aliquota);
    expect(t.ir).toBe(1000 * aliquota);
    expect(t.rendimentoLiquido).toBe(1000 - t.ir);
  });

  it.each(["LCI-90D-92", "LCA-1A-95"])("%s isenta em 181 dias", (produto) => {
    const p = { ...posicao("CDB-LD-100"), produto };
    expect(simularIr(p, somarDiasCorridos(p.dataAplicacao, 181)).aliquota).toBe(0);
  });

  it.each(["2026-05-20", "2026-02-30", "inválida"])(
    "recusa data anterior à aplicação ou inválida: %s",
    (data) => {
      expect(() => simularIr(posicao("CDB-LD-100"), data)).toThrow(RangeError);
    },
  );

  it("não aplica IR regressivo a ações", () => {
    const p = { ...posicao("CDB-LD-100"), produto: "ACOES" };
    expect(() => simularIr(p, "2026-11-18")).toThrow(/tributação de ações/);
  });

  it("não cria imposto negativo nem crédito fiscal sobre prejuízo", () => {
    const p = { ...posicao("CDB-LD-100"), valorAplicado: 1000, saldoBruto: 900 };
    expect(() => simularIr(p, "2026-11-18")).toThrow(/compensação de prejuízo/);
  });
});

describe("simulação vinculada à conta", () => {
  const tools = (id: string | null) => criarTools({ cliente: clientePorId(id) } as Contexto);
  const executar = async (id: string | null, idPosicao: string, resgateEm = "2026-11-18") => {
    const resultado = await tools(id).simularIr.execute?.({ idPosicao, resgateEm }, {} as never);
    if (!resultado || !("resultado" in resultado)) throw new Error("simulação sem resultado");
    return resultado;
  };

  it.each([null, "C-0001"])("não expõe posição de Rafael para %s", async (id) => {
    const r = await executar(id, posicao("CDB-LD-100").id);
    expect(r?.resultado).toBe("Posição não encontrada na conta do cliente.");
  });

  it("informa a data de referência do rendimento ao simular outra data", async () => {
    const p = posicao("CDB-LD-100");
    const r = await executar("C-0002", p.id, "2026-11-17");
    expect(r?.resultado).toContain("22,5%");
    expect(r?.resultado).toContain(p.dataReferencia);
    expect(r?.resultado).toContain("sem recalcular o rendimento");
    expect(r?.fonte).toBe("Seus investimentos na Caqui");
  });

  it("devolve a limitação de uma data inválida sem interromper o atendimento", async () => {
    const r = await executar("C-0002", posicao("CDB-LD-100").id, "2026-05-20");
    expect(r?.resultado).toContain("igual ou posterior à aplicação");
  });
});

describe("identidade recebida pelo agente", () => {
  const entrada: ChatRequest = {
    canal: "web",
    idCliente: "C-0001",
    mensagem: "Onde está o informe?",
    historico: [],
    momento: "2026-11-18T10:00:00-03:00",
  };

  async function contextoEnviado(id: string | null, nomeCliente: string) {
    const modelo = new MockLanguageModelV4({
      doGenerate: async () => ({
        content: [
          {
            type: "tool-call",
            toolCallId: "resposta",
            toolName: "responder",
            input: JSON.stringify({ texto: "Perfil > Documentos.", kbs: ["KB-017"] }),
          },
        ],
        finishReason: { unified: "tool-calls", raw: undefined },
        usage: {
          inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 0, text: 0, reasoning: undefined },
        },
        warnings: [],
      }),
    });
    await responder({ ...entrada, nomeCliente }, { cliente: clientePorId(id), modelo });
    const sistema = modelo.doGenerateCalls[0]?.prompt.find((m) => m.role === "system");
    if (!sistema || typeof sistema.content !== "string") throw new Error("sem contexto do agente");
    const identidade = sistema.content.match(/\{"idCliente":.*\}/)?.[0];
    if (!identidade) throw new Error("sem identidade do usuário");
    return JSON.parse(identidade);
  }

  it("prioriza ID e nome do contexto sobre os inputs informados", async () => {
    expect(await contextoEnviado("C-0002", "Outro nome")).toEqual({
      idCliente: "C-0002",
      nomeCliente: clientePorId("C-0002")?.nome,
      identificado: true,
    });
  });

  it("aceita nome opcional com CPF mascarado sem identificar a conta", async () => {
    expect(await contextoEnviado(null, "Visitante 123.456.789-00")).toEqual({
      idCliente: null,
      nomeCliente: "Visitante [CPF mascarado]",
      identificado: false,
    });
  });
});

describe("documentos mockados por usuário", () => {
  it.each(["C-0001", "C-0002", "C-0003"])("isola os documentos de %s", (id) => {
    const documentos = consultarDocumentosMock(id);
    expect(documentos.length).toBeGreaterThan(0);
    expect(documentos.every((d) => d.idCliente === id)).toBe(true);
  });

  it.each([null, "C-0042"])("sem fixture para %s não inventa documento", (id) => {
    expect(consultarDocumentosMock(id)).toEqual([]);
  });

  it("filtra ano e tipo sem misturar informe e extrato", () => {
    const documentos = consultarDocumentosMock("C-0001", { tipo: "extrato", ano: 2026 });
    expect(documentos).toHaveLength(1);
    expect(documentos[0]?.periodo).toBe("2026-10-01 a 2026-10-31");
    expect(consultarDocumentosMock("C-0001", { tipo: "extrato", ano: 2025 })).toEqual([]);
  });

  it("não permite acessar documento de outra pessoa pelo ID", async () => {
    const tools = criarTools({ cliente: clientePorId("C-0002") } as Contexto);
    const resultado = await tools.consultarDocumentos.execute?.(
      { idDocumento: "DOC-MARTA-IR-2025" },
      {} as never,
    );
    if (!resultado || !("documentos" in resultado)) throw new Error("consulta sem resultado");
    expect(resultado.documentos).toEqual([]);
    expect(resultado.simulado).toBe(true);
    expect(resultado.fonte).toContain("simulação");
  });

  it("distingue disponibilidade e preparação sem prometer prazo ou arquivo", () => {
    const marta = consultarDocumentosMock("C-0001", { tipo: "informe_rendimentos" });
    const camila = consultarDocumentosMock("C-0003", { tipo: "informe_rendimentos" });
    expect(marta[0]?.status).toBe("disponivel");
    expect(camila[0]?.status).toBe("em_preparacao");
    expect(camila[0]).not.toHaveProperty("prazo");
    expect(marta[0]).not.toHaveProperty("url");
  });
});
