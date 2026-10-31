import { MotivoId, Resposta } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { fixturePorMotivo, fixtures } from "./fixtures";
import { analisarUi, especificacaoOpenUI } from "./openui/biblioteca";

const todas = Object.entries(fixtures);

describe("fixtures do canal web", () => {
  for (const [nome, resposta] of todas) {
    it(`${nome} é uma Resposta válida pelo contrato`, () => {
      expect(() => Resposta.parse(resposta)).not.toThrow();
    });
  }

  it("cobre os 8 motivos com o motivo certo", () => {
    for (const motivo of MotivoId.options) {
      expect(fixturePorMotivo[motivo].motivo).toBe(motivo);
    }
  });

  it("cobre todas as ações, os dois tipos de interação e humano indisponível", () => {
    const acoes = new Set(todas.map(([, r]) => r.acao));
    expect(acoes).toEqual(new Set(["responder", "encaminhar_humano", "encaminhar_seguranca", "encaminhar_especialista"]));
    const interacoes = new Set(todas.map(([, r]) => r.interacao?.tipo).filter(Boolean));
    expect(interacoes).toEqual(new Set(["botoes", "lista"]));
    expect(todas.some(([, r]) => r.handoff?.humanoDisponivel === false && r.handoff.retornoPrevisto)).toBe(true);
  });

  it("toda ui válida passa pela biblioteca e cobre cada componente de topo", () => {
    const usados = new Set<string>();
    for (const [nome, r] of todas) {
      if (!r.ui || nome === "uiInvalida") continue;
      const analise = analisarUi(r.ui);
      expect(analise, nome).toMatchObject({ ok: true });
      if (analise.ok) {
        for (const bloco of analise.raiz.props.blocos as { typeName: string }[]) usados.add(bloco.typeName);
      }
    }
    expect(usados).toEqual(new Set(["Timeline", "Comparativo", "CartaoProtocolo", "TabelaIR"]));
  });
});

describe("analisarUi", () => {
  it("descarta componente fora da biblioteca", () => {
    expect(analisarUi(fixtures.uiInvalida.ui)).toMatchObject({ ok: false });
  });

  it("descarta texto que não é OpenUI, programa incompleto e prop com tipo errado", () => {
    expect(analisarUi("isso não é openui")).toMatchObject({ ok: false });
    expect(analisarUi('root = Painel([t])\nt = Timeline("x", [e1])')).toMatchObject({ ok: false });
    expect(analisarUi('root = Painel([t])\nt = TabelaIR("x", [FaixaIR("Até 180 dias", "vinte")])')).toMatchObject({ ok: false });
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
