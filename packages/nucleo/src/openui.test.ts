import { describe, expect, it } from "vitest";
import { analisarUi, especificacaoOpenUI } from "./openui";

describe("analisarUi", () => {
  it("aceita um programa completo com raiz Painel", () => {
    const ui = [
      "root = Painel([p])",
      'p = CartaoProtocolo("CQ-2026-000123", "atendimento", "Em análise", "até 25/11")',
    ].join("\n");
    expect(analisarUi(ui)).toMatchObject({ ok: true, raiz: { typeName: "Painel" } });
  });

  it("descarta componente fora da biblioteca", () => {
    expect(analisarUi('root = Painel([x])\nx = Grafico("pizza")')).toMatchObject({ ok: false });
  });

  it("descarta texto que não é OpenUI, programa incompleto e prop com tipo errado", () => {
    expect(analisarUi("isso não é openui")).toMatchObject({ ok: false });
    expect(analisarUi("<Cartao />")).toMatchObject({ ok: false });
    expect(analisarUi('root = Painel([t])\nt = Timeline("x", [e1])')).toMatchObject({ ok: false });
    expect(
      analisarUi('root = Painel([t])\nt = TabelaIR("x", [FaixaIR("Até 180 dias", "vinte")])'),
    ).toMatchObject({ ok: false });
  });

  it("descarta subcomponente usado como raiz", () => {
    expect(analisarUi('root = Etapa("Pedido", "hoje", "atual")')).toMatchObject({ ok: false });
  });
});

describe("especificacaoOpenUI", () => {
  it("descreve ao modelo os componentes da biblioteca e as regras da Caqui", () => {
    for (const nome of ["Painel(", "Timeline(", "Comparativo(", "CartaoProtocolo(", "TabelaIR("]) {
      expect(especificacaoOpenUI).toContain(nome);
    }
    expect(especificacaoOpenUI).toContain("Nunca marque um produto como melhor");
  });
});
