import type { Contexto, DaConta } from "@caqui/nucleo";
import { tool } from "ai";
import { z } from "zod";

export function criarTools(ctx: Contexto) {
  return {
    consultarCadastro: tool({
      description: "Dados cadastrais do cliente autenticado. O CPF vem sempre mascarado.",
      inputSchema: z.object({}),
      execute: async (): Promise<DaConta<{ cadastro: unknown }>> => ({
        fonte: "Seu cadastro na Caqui",
        cadastro: ctx.cliente
          ? { nome: ctx.cliente.nome, cpf: ctx.cliente.cpfMascarado }
          : "cliente não identificado",
      }),
    }),
  };
}
