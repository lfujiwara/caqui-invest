import { type ChatRequest, modeloDoMotivo, perguntasDeTeste } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { MOTIVO } from "./index";

const pedidos = perguntasDeTeste().filter((p) => p.acao_esperada === "encaminhar_especialista");

describe("regra 4: sem recomendação", () => {
  it.each(pedidos.map((p) => [p.id, p]))("%s encaminha ao especialista", async (_, p) => {
    expect(MOTIVO.gatilhos.test(p.pergunta)).toBe(true);
    const req: ChatRequest = {
      canal: "web",
      mensagem: p.pergunta,
      historico: [],
      idCliente: null,
      momento: "2026-11-18T10:00-03:00",
    };
    const r = await MOTIVO.responder(req, { cliente: null, modelo: modeloDoMotivo([]) });
    expect(r.acao).toBe("encaminhar_especialista");
    for (const termo of p.deve_conter) expect(r.texto.toLowerCase()).toContain(termo);
    for (const termo of p.nao_deve_conter) expect(r.texto.toLowerCase()).not.toContain(termo);
  });
});
