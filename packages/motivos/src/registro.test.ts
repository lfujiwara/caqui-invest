import { artigo, KB_OBSOLETAS, MotivoId, ORDEM_DOS_GATILHOS } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { MOTIVOS } from "./index";

describe("registro de motivos", () => {
  it("tem exatamente as chaves de MotivoId, cada uma com o próprio id", () => {
    expect(Object.keys(MOTIVOS).sort()).toEqual([...MotivoId.options].sort());
    for (const [chave, motivo] of Object.entries(MOTIVOS)) expect(motivo.id).toBe(chave);
  });

  it("a ordem dos gatilhos cobre todos os motivos", () => {
    expect([...ORDEM_DOS_GATILHOS].sort()).toEqual([...MotivoId.options].sort());
  });

  it("cada fatia só declara artigos que existem e nunca um obsoleto", () => {
    for (const motivo of Object.values(MOTIVOS)) {
      for (const id of motivo.kbs) {
        expect(() => artigo(id)).not.toThrow();
        expect(KB_OBSOLETAS.has(id)).toBe(false);
      }
    }
  });

  it("cada exemplo cai na própria fatia pelo roteador offline", () => {
    for (const motivo of Object.values(MOTIVOS)) {
      for (const exemplo of motivo.exemplos) {
        const rota =
          ORDEM_DOS_GATILHOS.find((id) => MOTIVOS[id].gatilhos.test(exemplo)) ?? "outros";
        expect({ exemplo, rota }).toEqual({ exemplo, rota: motivo.id });
      }
    }
  });
});
