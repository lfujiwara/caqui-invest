import { describe, expect, it } from "vitest";
import { diaBase, proximoDiaUtil, somarDiasCorridos, somarDiasUteis } from "./calendario";
import { produtoPorCodigo } from "./dados";
import { aliquotaIr, formatarPct, rendimentoPoupanca, tributar } from "./financas";

describe("regra 2: IR regressivo", () => {
  it.each([
    [180, 0.225],
    [181, 0.2],
    [360, 0.2],
    [361, 0.175],
    [720, 0.175],
    [721, 0.15],
  ])("%i dias corridos: %f", (dias, aliquota) => {
    expect(aliquotaIr(dias)).toBe(aliquota);
  });

  it("incide só sobre o rendimento, nunca sobre o valor total", () => {
    const cdb = produtoPorCodigo("CDB-LD-100");
    if (!cdb) throw new Error("produto sumiu de taxas.json");
    const t = tributar({
      produto: cdb,
      aplicadoEm: "2026-05-21",
      resgateEm: "2026-11-18",
      rendimentoBruto: 810.03,
    });
    expect(t).toEqual({
      dias: 181,
      aliquota: 0.2,
      rendimentoBruto: 810.03,
      ir: 162.01,
      rendimentoLiquido: 648.02,
    });
    expect(formatarPct(t.aliquota)).toBe("20%");
  });

  it.each(["LCI-90D-92", "LCA-1A-95"])("%s é isenta", (codigo) => {
    const produto = produtoPorCodigo(codigo);
    if (!produto) throw new Error(`${codigo} sumiu de taxas.json`);
    const t = tributar({
      produto,
      aplicadoEm: "2026-10-05",
      resgateEm: "2026-11-18",
      rendimentoBruto: 229.91,
    });
    expect(t.ir).toBe(0);
    expect(t.rendimentoLiquido).toBe(229.91);
  });

  it("poupança segue a convenção de taxas.json e não paga IR", () => {
    expect(rendimentoPoupanca(10_000, 30)).toBe(60);
  });
});

describe("calendário de dias úteis", () => {
  it("pula fim de semana e o feriado de 02/11/2026", () => {
    expect(proximoDiaUtil("2026-10-30")).toBe("2026-11-03");
    expect(somarDiasUteis("2026-11-03", 2)).toBe("2026-11-05");
    expect(somarDiasCorridos("2026-11-03", 30)).toBe("2026-12-03");
  });

  it("dia-base respeita o corte das 16h e o fuso de São Paulo", () => {
    expect(diaBase("2026-11-16T15:58:00-03:00")).toBe("2026-11-16");
    expect(diaBase("2026-11-16T16:00:00-03:00")).toBe("2026-11-16");
    expect(diaBase("2026-11-16T16:01:00-03:00")).toBe("2026-11-17");
    // 18:58 UTC é 15:58 em São Paulo.
    expect(diaBase("2026-11-16T18:58:00Z")).toBe("2026-11-16");
    expect(diaBase("2026-11-14T09:05:00-03:00")).toBe("2026-11-16");
  });
});
