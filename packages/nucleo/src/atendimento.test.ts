import { describe, expect, it } from "vitest";
import { encaminhar, humanoDisponivel } from "./atendimento";
import type { ChatRequest } from "./contrato";

const req = (momento: string): ChatRequest => ({
  canal: "web",
  mensagem: "Quero fazer uma reclamação",
  historico: [{ autor: "cliente", texto: "O resgate não caiu", em: momento }],
  idCliente: "C-0002",
  momento,
});

describe("regra 12: horário do atendimento humano", () => {
  it("14h tem pessoa, 23h não", () => {
    expect(humanoDisponivel("2026-11-18T14:00-03:00", "atendimento")).toBe(true);
    expect(humanoDisponivel("2026-11-18T23:00-03:00", "atendimento")).toBe(false);
  });

  it("bordas: 8h abre, 20h fecha", () => {
    expect(humanoDisponivel("2026-11-18T07:59-03:00", "atendimento")).toBe(false);
    expect(humanoDisponivel("2026-11-18T08:00-03:00", "atendimento")).toBe(true);
    expect(humanoDisponivel("2026-11-18T19:59-03:00", "atendimento")).toBe(true);
    expect(humanoDisponivel("2026-11-18T20:00-03:00", "atendimento")).toBe(false);
  });

  it("segurança atende a qualquer hora", () => {
    expect(humanoDisponivel("2026-11-18T23:00-03:00", "seguranca")).toBe(true);
    expect(humanoDisponivel("2026-11-18T03:00-03:00", "seguranca")).toBe(true);
  });

  it("usa o fuso de São Paulo, não o do servidor", () => {
    // 02:00 UTC do dia 19 é 23:00 do dia 18 em São Paulo.
    expect(humanoDisponivel("2026-11-19T02:00:00Z", "atendimento")).toBe(false);
  });
});

describe("encaminhar", () => {
  it("às 14h passa para uma pessoa agora, sem prazo de retorno", () => {
    const r = encaminhar({
      req: req("2026-11-18T14:00-03:00"),
      motivo: "outros",
      fila: "atendimento",
      texto: "Ok.",
    });
    expect(r.acao).toBe("encaminhar_humano");
    expect(r.handoff?.humanoDisponivel).toBe(true);
    expect(r.handoff?.retornoPrevisto).toBeNull();
  });

  it("às 23h registra protocolo e promete retorno às 8h do dia seguinte", () => {
    const r = encaminhar({
      req: req("2026-11-18T23:00-03:00"),
      motivo: "outros",
      fila: "atendimento",
      texto: "Ok.",
    });
    expect(r.handoff?.humanoDisponivel).toBe(false);
    expect(r.handoff?.retornoPrevisto).toBe("2026-11-19T08:00:00-03:00");
    expect(r.texto).toContain("8h");
    expect(r.texto).toContain(`protocolo ${r.handoff?.protocolo}`);
  });

  it("a ação acompanha a fila", () => {
    const m = "2026-11-18T23:00-03:00";
    expect(
      encaminhar({ req: req(m), motivo: "acesso_seguranca", fila: "seguranca", texto: "x" }).acao,
    ).toBe("encaminhar_seguranca");
    expect(
      encaminhar({ req: req(m), motivo: "pedido_recomendacao", fila: "especialista", texto: "x" })
        .acao,
    ).toBe("encaminhar_especialista");
  });

  it("o resumo leva o histórico, para o cliente não repetir", () => {
    const r = encaminhar({
      req: req("2026-11-18T14:00-03:00"),
      motivo: "outros",
      fila: "atendimento",
      texto: "x",
    });
    expect(r.handoff?.resumo).toContain("O resgate não caiu");
  });
});
