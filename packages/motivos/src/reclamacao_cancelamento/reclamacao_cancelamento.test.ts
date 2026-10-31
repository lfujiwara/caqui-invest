import { type ChatRequest, modeloDoMotivo, type Resposta } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { MOTIVO } from "./index";

const responder = (mensagem: string, momento: string, historico: ChatRequest["historico"] = []) =>
  MOTIVO.responder(
    { canal: "web", mensagem, historico, idCliente: null, momento },
    { cliente: null, modelo: modeloDoMotivo([]) },
  );

describe("regra 7: reclamação e encerramento", () => {
  it("PT-25: oferece o encerramento na primeira resposta, com uma retenção", async () => {
    const r = await responder("Quero encerrar minha conta", "2026-11-18T10:00-03:00");
    expect(r.acao).toBe("responder");
    expect(r.texto).toContain("encerr");
    expect(r.interacao?.tipo).toBe("botoes");
  });

  it("depois da retenção, não insiste: encaminha", async () => {
    const em = "2026-11-18T10:00-03:00";
    const primeira: Resposta = await responder("Quero encerrar minha conta", em);
    const r = await responder("Seguir encerramento", em, [
      { autor: "cliente", texto: "Quero encerrar minha conta", em },
      { autor: "caqui", resposta: primeira, em },
    ]);
    expect(r.acao).toBe("encaminhar_humano");
  });

  it("regra 12: a mesma reclamação às 14h e às 23h muda humanoDisponivel", async () => {
    const tarde = await responder("Quero fazer uma reclamação", "2026-11-18T14:00-03:00");
    const noite = await responder("Quero fazer uma reclamação", "2026-11-18T23:00-03:00");
    expect(tarde.handoff?.humanoDisponivel).toBe(true);
    expect(noite.handoff?.humanoDisponivel).toBe(false);
    expect(noite.texto).toContain("8h");
    expect(tarde.handoff?.retornoPrevisto).toBe("2026-11-25T20:00:00-03:00");
    expect(tarde.texto.toLowerCase()).toContain("protocolo");
  });
});
