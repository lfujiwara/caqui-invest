import { lerDoRepo } from "@caqui/nucleo";
import { tool } from "ai";
import { z } from "zod";

export const tools = {
  consultarProduto: tool({
    description: "Regras de um produto da Caqui pelo código (taxas.json), ex. CDB-LD-100.",
    inputSchema: z.object({ codigo: z.string() }),
    execute: async ({ codigo }) => {
      // Mantém todos os campos do catálogo, inclusive mínimo, vencimento e taxa de administração.
      const { produtos } = JSON.parse(lerDoRepo("dados/taxas.json")) as {
        produtos: Record<string, unknown>[];
      };
      return (
        produtos.find((p) => p.codigo === codigo) ?? {
          erro: "Código não encontrado no catálogo da Caqui.",
        }
      );
    },
  }),
};
