import {
  type Contexto,
  type DaConta,
  formatarBrl,
  formatarPct,
  type Posicao,
  posicoes,
  produtoPorCodigo,
  type Tributacao,
  tributar,
} from "@caqui/nucleo";
import { tool } from "ai";
import { z } from "zod";

/**
 * Regra 2 para uma posição do cliente. O rendimento é o da data de referência dos dados;
 * a data do resgate muda só a faixa da alíquota.
 */
export function simularIr(posicao: Posicao, resgateEm: string): Tributacao {
  const produto = produtoPorCodigo(posicao.produto);
  if (!produto) throw new Error(`produto desconhecido: ${posicao.produto}`);
  return tributar({
    produto,
    aplicadoEm: posicao.dataAplicacao,
    resgateEm,
    rendimentoBruto: posicao.saldoBruto - posicao.valorAplicado,
  });
}

export function descreverIr(t: Tributacao): string {
  if (t.aliquota === 0)
    return `Produto isento de IR para pessoa física. Rendimento de ${formatarBrl(t.rendimentoBruto)}.`;
  return `${t.dias} dias corridos: alíquota de ${formatarPct(t.aliquota)} só sobre o rendimento, nunca sobre o que você aplicou. Rendimento bruto de ${formatarBrl(t.rendimentoBruto)}, IR de ${formatarBrl(t.ir)}.`;
}

export function criarTools(ctx: Contexto) {
  const doCliente = () => posicoes().filter((p) => p.idCliente === ctx.cliente?.id);
  return {
    simularIr: tool({
      description:
        "Calcula a alíquota e o IR de uma posição do cliente para uma data de resgate (AAAA-MM-DD).",
      inputSchema: z.object({
        idPosicao: z.string(),
        resgateEm: z.iso.date(),
      }),
      execute: async ({ idPosicao, resgateEm }): Promise<DaConta<{ resultado: string }>> => {
        const posicao = doCliente().find((p) => p.id === idPosicao);
        return {
          fonte: "Seus investimentos na Caqui",
          resultado: posicao
            ? descreverIr(simularIr(posicao, resgateEm))
            : "Posição não encontrada na conta do cliente.",
        };
      },
    }),
    consultarPosicoes: tool({
      description: "Lista os investimentos do cliente autenticado, com data de aplicação.",
      inputSchema: z.object({}),
      execute: async (): Promise<DaConta<{ posicoes: Posicao[] }>> => ({
        fonte: "Seus investimentos na Caqui",
        posicoes: doCliente(),
      }),
    }),
  };
}
