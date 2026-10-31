import { describe, expect, it } from "vitest";
import { toolsDaConta } from "./conta";
import { clientePorId, conversas } from "./dados";
import type { Contexto } from "./motivo";

const ctx = (id: string | null) => ({ cliente: clientePorId(id) }) as Contexto;
const rodar = <T>(t: { execute?: (input: T, opts: never) => unknown }, input: T) =>
  t.execute?.(input, {} as never) as Promise<Record<string, unknown[]>>;

describe("toolsDaConta", () => {
  it("lê as 300 conversas, com vírgula dentro da transcrição entre aspas", () => {
    const todas = conversas();
    expect(todas).toHaveLength(300);
    expect(todas.every((c) => /^C-\d{4}$/.test(c.idCliente))).toBe(true);
    expect(todas.some((c) => c.turnos.some((t) => t.includes(",")))).toBe(true);
  });

  it("só enxerga o cliente autenticado (regra 10)", async () => {
    const tools = toolsDaConta(ctx("C-0001"));
    const { operacoes } = await rodar(tools.consultarExtrato, {});
    const { atendimentos } = await rodar(tools.consultarAtendimentos, { limite: 20 });
    expect(operacoes?.length).toBeGreaterThan(0);
    expect(operacoes?.every((o) => (o as { idCliente: string }).idCliente === "C-0001")).toBe(true);
    expect(atendimentos?.every((c) => (c as { idCliente: string }).idCliente === "C-0001")).toBe(
      true,
    );
  });

  it("sem login não devolve nada", async () => {
    const tools = toolsDaConta(ctx(null));
    expect((await rodar(tools.consultarPosicoes, {})).posicoes).toEqual([]);
    expect((await rodar(tools.consultarExtrato, {})).operacoes).toEqual([]);
  });

  it("filtra o extrato por tipo e período", async () => {
    const { operacoes } = await rodar(toolsDaConta(ctx("C-0001")).consultarExtrato, {
      tipo: "resgate",
      desde: "2026-11-01",
    });
    for (const o of operacoes as { tipo: string; pedidoEm: string }[]) {
      expect(o.tipo).toBe("resgate");
      expect(o.pedidoEm >= "2026-11-01").toBe(true);
    }
  });
});
