import { describe, expect, it } from "vitest";
import { buscarClientes, levenshtein, type OpcaoCliente } from "./busca";

const OPCOES: OpcaoCliente[] = [
  { id: null, nome: "Anônimo", detalhe: "sem login" },
  { id: "C-0001", nome: "Marta Siqueira", detalhe: "63 anos, Campinas" },
  { id: "C-0002", nome: "Rafael Okada", detalhe: "27 anos, São Paulo" },
  { id: "C-0003", nome: "Camila Prates", detalhe: "41 anos, Recife" },
];

const nomes = (busca: string) => buscarClientes(OPCOES, busca).map((o) => o.nome);

describe("levenshtein", () => {
  it("conta inserção, remoção e troca", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("caqui", "caqui")).toBe(0);
  });
});

describe("buscarClientes", () => {
  it("busca vazia devolve todos", () => {
    expect(nomes("  ")).toHaveLength(4);
  });

  it("acha por nome, sem acento", () => {
    expect(nomes("rafa")).toEqual(["Rafael Okada"]);
    expect(nomes("marta siq")).toEqual(["Marta Siqueira"]);
    expect(nomes("anonimo")).toEqual(["Anônimo"]);
  });

  it("acha por id, com ou sem o prefixo", () => {
    expect(nomes("C-0003")[0]).toBe("Camila Prates");
    expect(nomes("0002")[0]).toBe("Rafael Okada");
  });

  it("não busca pelo detalhe", () => {
    expect(nomes("recife")).toEqual([]);
  });

  it("tolera erro de digitação proporcional ao tamanho da busca", () => {
    expect(nomes("camla")[0]).toBe("Camila Prates");
    expect(nomes("siqeira")).toEqual(["Marta Siqueira"]);
    expect(nomes("zzzz")).toEqual([]);
  });
});
