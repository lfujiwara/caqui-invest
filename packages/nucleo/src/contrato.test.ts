import { describe, expect, it } from "vitest";
import { ChatRequest, Interacao, Resposta } from "./contrato";

const handoff = {
  protocolo: "CAQ-20261118-0A1B2C",
  fila: "atendimento",
  humanoDisponivel: true,
  retornoPrevisto: null,
  resumo: "Cliente pediu para falar com uma pessoa.",
};

const base = {
  motivo: "outros",
  texto: "Olá",
  fontes: [],
  interacao: null,
  ui: null,
};

describe("Resposta", () => {
  it("aceita responder sem handoff", () => {
    expect(Resposta.safeParse({ ...base, acao: "responder", handoff: null }).success).toBe(true);
  });

  it("recusa responder com handoff", () => {
    const r = { ...base, acao: "responder", handoff };
    expect(Resposta.safeParse(r).success).toBe(false);
  });

  it("exige handoff para encaminhar", () => {
    expect(Resposta.safeParse({ ...base, acao: "encaminhar_humano", handoff: null }).success).toBe(
      false,
    );
  });
});

describe("Interacao (limites do WhatsApp)", () => {
  const opcao = (i: number) => ({ id: `o${i}`, titulo: `Opção ${i}` });

  it("aceita até 3 botões e recusa 4", () => {
    const botoes = (n: number) => ({
      tipo: "botoes",
      opcoes: Array.from({ length: n }, (_, i) => opcao(i)),
    });
    expect(Interacao.safeParse(botoes(3)).success).toBe(true);
    expect(Interacao.safeParse(botoes(4)).success).toBe(false);
  });

  it("recusa título de botão com mais de 20 caracteres", () => {
    const r = { tipo: "botoes", opcoes: [{ id: "x", titulo: "a".repeat(21) }] };
    expect(Interacao.safeParse(r).success).toBe(false);
  });

  it("conta as linhas de todas as seções: 10 passa, 11 não", () => {
    const linha = (i: number) => ({ id: `l${i}`, titulo: `Linha ${i}`, descricao: "x" });
    const lista = (a: number, b: number) => ({
      tipo: "lista",
      botao: "Ver opções",
      secoes: [
        { titulo: "A", linhas: Array.from({ length: a }, (_, i) => linha(i)) },
        { titulo: "B", linhas: Array.from({ length: b }, (_, i) => linha(i + a)) },
      ],
    });
    expect(Interacao.safeParse(lista(5, 5)).success).toBe(true);
    expect(Interacao.safeParse(lista(6, 5)).success).toBe(false);
  });
});

describe("ChatRequest", () => {
  const req = {
    canal: "web",
    mensagem: "Oi",
    historico: [],
    idCliente: null,
    momento: "2026-11-18T10:00:00-03:00",
  };

  it("exige momento com fuso", () => {
    expect(ChatRequest.safeParse(req).success).toBe(true);
    expect(ChatRequest.safeParse({ ...req, momento: "2026-11-18T10:00:00" }).success).toBe(false);
  });

  it("aceita o formato curto de momento usado em perguntas_teste.jsonl", () => {
    expect(ChatRequest.safeParse({ ...req, momento: "2026-10-31T10:00-03:00" }).success).toBe(true);
  });
});
