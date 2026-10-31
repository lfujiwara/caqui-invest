import {
  analisarUi,
  type Contexto,
  clientePorId,
  formatarData,
  operacoes,
  perguntaDeTeste,
} from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import {
  criarTools,
  historicoDeLiquidacao,
  type Liquidacao,
  preverLiquidacao,
  timelineOpenUI,
} from "./tools";

// O pedido de PT-03 está em operacoes.csv: o teste o lê de lá, como a tool faz.
const resgatePt03 = operacoes().find(
  (o) => o.idCliente === "C-0001" && o.tipo === "resgate" && o.produto === "CDB-LD-110",
);

const casos = [
  { id: "PT-01", produto: "FUNDO-RF-01", pedidoEm: "2026-10-30T17:00-03:00" },
  { id: "PT-02", produto: "CDB-LD-100", pedidoEm: "2026-11-16T15:58-03:00" },
  { id: "PT-03", produto: "CDB-LD-110", pedidoEm: resgatePt03?.pedidoEm ?? "" },
  { id: "PT-04", produto: "FUNDO-MM-01", pedidoEm: "2026-10-30T17:20-03:00" },
  { id: "PT-05", produto: "CDB-LD-100", pedidoEm: "2026-11-14T09:05-03:00" },
];

describe("regra 1: liquidação (datas esperadas lidas de perguntas_teste.jsonl)", () => {
  it.each(casos)("$id", ({ id, produto, pedidoEm }) => {
    const [esperado] = perguntaDeTeste(id).deve_conter;
    const previsao = preverLiquidacao(produto, pedidoEm);
    if (previsao.tipo !== "prevista") throw new Error(`sem previsão para ${produto}`);
    expect(formatarData(previsao.pagamento)).toBe(esperado);
  });

  it("PT-01 detalha dia-base e cotização depois do feriado", () => {
    const p = preverLiquidacao("FUNDO-RF-01", "2026-10-30T17:00-03:00");
    expect(p).toEqual({
      tipo: "prevista",
      diaBase: "2026-11-03",
      cotizacao: "2026-11-04",
      pagamento: "2026-11-05",
    });
  });

  it("produto sem liquidez diária não tem data de resgate", () => {
    expect(preverLiquidacao("LCA-1A-95", "2026-11-16T10:00-03:00")).toEqual({
      tipo: "sem_liquidez",
    });
  });
});

const AGORA = "2026-11-18T10:00-03:00";
const operacao = (id: string) => {
  const op = operacoes().find((o) => o.id === id);
  if (!op) throw new Error(`${id} não está em operacoes.csv`);
  return op;
};

async function consultar(idCliente: string | null, idOperacao?: string) {
  let ui: string | null = "não chamado";
  const ctx = { cliente: clientePorId(idCliente) } as Contexto;
  const tools = criarTools(ctx, AGORA, (u) => {
    ui = u;
  });
  const saida = (await tools.consultarLiquidacoes.execute?.({ idOperacao }, {} as never)) as {
    liquidacoes: Liquidacao[];
  };
  return { ...saida, ui };
}

describe("histórico de liquidação", () => {
  it("PT-04: resgate do multimercado do Rafael em etapas, com a data esperada", () => {
    const h = historicoDeLiquidacao(operacao("OP-10007"), AGORA);
    expect(h.etapas.map((e) => [e.rotulo, e.data, e.estado])).toEqual([
      ["Pedido", "2026-10-30", "concluida"],
      ["Dia-base do pedido", "2026-11-03", "concluida"],
      ["Cotização", "2026-12-03", "prevista"],
      ["Dinheiro na conta", "2026-12-07", "prevista"],
    ]);
    expect(formatarData(h.etapas[3]?.data ?? "")).toBe(perguntaDeTeste("PT-04").deve_conter[0]);
  });

  it("pagamento previsto que já passou sem liquidar fica como etapa atual", () => {
    const h = historicoDeLiquidacao(operacao("OP-10014"), AGORA);
    expect(h.etapas.at(-1)).toMatchObject({ data: "2026-11-10", estado: "atual" });
    expect(h.nota).toBe("Previsto para 10/11/2026 e ainda não liquidado.");
  });

  it("a Timeline gerada passa pela biblioteca OpenUI do núcleo", () => {
    const ui = timelineOpenUI([historicoDeLiquidacao(operacao("OP-10007"), AGORA)], AGORA);
    expect(ui && analisarUi(ui).ok).toBe(true);
    expect(ui).toContain('Etapa("Dinheiro na conta", "seg, 07/12", "prevista")');
  });

  it("regra 10: a tool só devolve operações do cliente logado", async () => {
    const { liquidacoes, ui } = await consultar("C-0002");
    expect(liquidacoes.map((l) => l.idOperacao).sort()).toEqual(["OP-10007", "OP-10008"]);
    expect(ui).toMatch(/^root = Painel\(\[t0, t1\]\)/);
    expect((await consultar("C-0002", "OP-10005")).liquidacoes).toEqual([]);
  });

  it("sem cliente logado não há operações nem ui", async () => {
    expect(await consultar(null)).toMatchObject({ liquidacoes: [], ui: null });
  });
});
