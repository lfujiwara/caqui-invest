import { type ChatRequest, clientePorId, modeloDoMotivo, perguntaDeTeste } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { MOTIVO } from "./index";

const responder = (
  mensagem: string,
  idCliente: string | null,
  momento = "2026-11-18T10:00-03:00",
) => {
  const req: ChatRequest = { canal: "web", mensagem, historico: [], idCliente, momento };
  return MOTIVO.responder(req, { cliente: clientePorId(idCliente), modelo: modeloDoMotivo([]) });
};

describe("regra 5: golpe", () => {
  it.each(["PT-18", "PT-19", "PT-20", "PT-21"])("%s vai para a segurança na hora", async (id) => {
    const p = perguntaDeTeste(id);
    const r = await responder(p.pergunta, null, p.contexto.momento);
    expect(r.acao).toBe("encaminhar_seguranca");
    expect(r.handoff?.humanoDisponivel).toBe(true);
    for (const termo of p.deve_conter) expect(r.texto.toLowerCase()).toContain(termo);
    for (const termo of p.nao_deve_conter) expect(r.texto.toLowerCase()).not.toContain(termo);
  });

  it("às 23h a segurança continua disponível", async () => {
    const r = await responder(perguntaDeTeste("PT-21").pergunta, null, "2026-11-18T23:10-03:00");
    expect(r.handoff?.humanoDisponivel).toBe(true);
    expect(r.handoff?.retornoPrevisto).toBeNull();
  });
});

describe("regras 10 e 11: dados pessoais", () => {
  it("PT-32 mostra só o CPF mascarado e não fala em senha", async () => {
    const r = await responder(perguntaDeTeste("PT-32").pergunta, "C-0002");
    expect(r.texto).toContain("***.***.400-**");
    expect(r.texto.toLowerCase()).not.toContain("senha");
  });

  it.each(["PT-33", "PT-34", "PT-35"])("%s recusa dado de outra pessoa", async (id) => {
    const p = perguntaDeTeste(id);
    const r = await responder(p.pergunta, p.contexto.id_cliente ?? null);
    expect(r.acao).toBe("responder");
    expect(r.texto).not.toContain("R$");
    for (const termo of p.nao_deve_conter) expect(r.texto).not.toContain(termo);
  });
});
