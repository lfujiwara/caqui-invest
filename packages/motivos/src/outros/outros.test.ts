import { type ChatRequest, Interacao, modeloDoMotivo } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { MOTIVO } from "./index";

const req = (mensagem: string): ChatRequest => ({
  canal: "whatsapp",
  mensagem,
  historico: [],
  idCliente: null,
  momento: "2026-11-18T10:00-03:00",
});

const responder = (mensagem: string) =>
  MOTIVO.responder(req(mensagem), { cliente: null, modelo: modeloDoMotivo(MOTIVO.kbs) });

describe("outros no modo offline", () => {
  it("responde mudança de endereço com KB-022", async () => {
    const r = await responder("Como mudo meu endereço?");
    expect(r.fontes.map((f) => (f.tipo === "kb" ? f.id : null))).toContain("KB-022");
    expect(r.interacao).toBeNull();
  });

  it("quando não entende, oferece a lista de assuntos dentro dos limites do WhatsApp", async () => {
    const r = await responder("asdf");
    expect(r.fontes).toEqual([]);
    expect(r.interacao?.tipo).toBe("lista");
    expect(Interacao.safeParse(r.interacao).success).toBe(true);
  });
});
