import { formatarData, operacoes, perguntaDeTeste } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { preverLiquidacao } from "./tools";

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
