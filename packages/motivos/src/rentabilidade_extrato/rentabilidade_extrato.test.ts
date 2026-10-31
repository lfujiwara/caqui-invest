import { formatarBrl, perguntaDeTeste, posicoes } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { compararComPoupanca, descreverComparacao } from "./tools";

// PT-10 perde no líquido e PT-11 ganha. Os valores esperados saem da resposta_esperada.
describe("regra 3: comparação líquida com a poupança", () => {
  it.each(["PT-10", "PT-11"])("%s", (id) => {
    const p = perguntaDeTeste(id);
    const posicao = posicoes().find(
      (x) => x.idCliente === p.contexto.id_cliente && x.produto.startsWith("CDB"),
    );
    if (!posicao) throw new Error(`sem CDB para ${p.contexto.id_cliente}`);
    const c = compararComPoupanca(posicao);
    const [bruto, liquido, poupanca] = [...p.resposta_esperada.matchAll(/R\$ [\d.,]+/g)].map(
      ([v]) => v,
    );
    const dias = p.resposta_esperada.match(/em (\d+) dias/)?.[1];
    expect(String(c.dias)).toBe(dias);
    expect(formatarBrl(c.bruto)).toBe(bruto);
    expect(formatarBrl(c.liquido)).toBe(liquido);
    // A poupança da resposta esperada arredonda o último centavo para baixo.
    expect(
      Math.abs(c.poupanca - Number(poupanca?.replace(/[R$ .]/g, "").replace(",", "."))),
    ).toBeLessThanOrEqual(0.01);
    expect(c.rendeuMais).toBe(p.resposta_esperada.includes("rendeu mais"));
    expect(descreverComparacao(c)).toContain("líquido");
  });
});
