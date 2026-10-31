import { produtoPorCodigo } from "@caqui/nucleo";
import { tool } from "ai";
import { z } from "zod";

export const tools = {
  consultarProduto: tool({
    description: "Regras de um produto da Caqui pelo código (taxas.json), ex. CDB-LD-100.",
    inputSchema: z.object({ codigo: z.string() }),
    execute: async ({ codigo }) =>
      produtoPorCodigo(codigo) ?? { erro: "a Caqui não tem produto com esse código" },
  }),
};
