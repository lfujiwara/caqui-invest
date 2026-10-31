import { type ChatRequest, modeloDoMotivo, perguntaDeTeste } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { MOTIVO } from "./index";

const pedir = (id: string) => {
  const p = perguntaDeTeste(id);
  const req: ChatRequest = {
    canal: "web",
    mensagem: p.pergunta,
    historico: [],
    idCliente: null,
    momento: "2026-11-18T10:00-03:00",
  };
  return {
    p,
    resposta: MOTIVO.responder(req, { cliente: null, modelo: modeloDoMotivo(MOTIVO.kbs) }),
  };
};

describe("duvida_produto no modo offline", () => {
  it.each(["PT-29", "PT-30", "PT-39", "PT-40"])(
    "%s cita o artigo certo e passa nas pistas",
    async (id) => {
      const { p, resposta } = pedir(id);
      const r = await resposta;
      const visto = `${r.texto} ${r.fontes.map((f) => (f.tipo === "kb" ? f.id : "")).join(" ")}`;
      for (const termo of p.deve_conter) expect(visto.toLowerCase()).toContain(termo.toLowerCase());
      expect(r.fontes.length).toBeGreaterThan(0);
    },
  );

  it("nunca cita artigo fora da lista da fatia", async () => {
    const r = await pedir("PT-31").resposta;
    for (const f of r.fontes) if (f.tipo === "kb") expect(MOTIVO.kbs).toContain(f.id);
  });
});
