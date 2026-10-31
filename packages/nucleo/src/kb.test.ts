import { describe, expect, it } from "vitest";
import { artigosKb, buscarKb } from "./kb";

describe("buscarKb", () => {
  const todos = [...artigosKb().keys()];

  it("lê os 30 artigos", () => {
    expect(todos).toHaveLength(30);
  });

  it("nunca devolve KB-007, mesmo quando permitido", () => {
    const achados = buscarKb("horário de corte para resgate de CDB 15h", todos, 30);
    expect(achados.map((a) => a.id)).not.toContain("KB-007");
    expect(achados[0]?.id).toBe("KB-006");
  });

  it("só devolve artigos permitidos", () => {
    const achados = buscarKb("o que é liquidez diária", ["KB-004", "KB-013"]);
    expect(achados.map((a) => a.id)).toEqual(["KB-004"]);
  });

  it("acha produto não oferecido pelo radical", () => {
    expect(buscarKb("prazo de resgate de criptomoedas", ["KB-006", "KB-030"])[0]?.id).toBe(
      "KB-030",
    );
  });

  it("devolve vazio quando nada casa, mesmo com palavras comuns", () => {
    expect(buscarKb("asdf", todos)).toEqual([]);
    expect(buscarKb("não é isso", todos)).toEqual([]);
  });
});
