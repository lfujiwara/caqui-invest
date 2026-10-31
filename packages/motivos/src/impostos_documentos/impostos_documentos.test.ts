import { perguntaDeTeste, posicoes } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { descreverIr, simularIr } from "./tools";

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
});
