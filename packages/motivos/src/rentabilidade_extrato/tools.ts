import {
  type Contexto,
  type DaConta,
  formatarBrl,
  type Posicao,
  posicoes,
  produtoPorCodigo,
  rendimentoPoupanca,
  tributar,
} from "@caqui/nucleo";
import { tool } from "ai";
import { z } from "zod";

export type Comparacao = {
  dias: number;
  bruto: number;
  liquido: number;
  poupanca: number;
  rendeuMais: boolean;
};

/** Regra 3: compara líquido com líquido. A poupança é isenta; o CDB paga IR sobre o rendimento. */
export function compararComPoupanca(posicao: Posicao): Comparacao {
  const produto = produtoPorCodigo(posicao.produto);
  if (!produto) throw new Error(`produto desconhecido: ${posicao.produto}`);
  const t = tributar({
    produto,
    aplicadoEm: posicao.dataAplicacao,
    resgateEm: posicao.dataReferencia,
    rendimentoBruto: posicao.saldoBruto - posicao.valorAplicado,
  });
  const poupanca = rendimentoPoupanca(posicao.valorAplicado, t.dias);
  return {
    dias: t.dias,
    bruto: t.rendimentoBruto,
    liquido: t.rendimentoLiquido,
    poupanca,
    rendeuMais: t.rendimentoLiquido > poupanca,
  };
}

export function descreverComparacao(c: Comparacao): string {
  return `Comparando líquido com líquido em ${c.dias} dias: rendimento bruto ${formatarBrl(c.bruto)}, líquido ${formatarBrl(c.liquido)}; a poupança renderia ${formatarBrl(c.poupanca)} no mesmo período. Rendeu ${c.rendeuMais ? "mais" : "menos"} que a poupança no líquido.`;
}

export function criarTools(ctx: Contexto) {
  const doCliente = () => posicoes().filter((p) => p.idCliente === ctx.cliente?.id);
  return {
    consultarPosicoes: tool({
      description: "Lista os investimentos do cliente autenticado com saldo bruto.",
      inputSchema: z.object({}),
      execute: async (): Promise<DaConta<{ posicoes: Posicao[] }>> => ({
        fonte: "Seus investimentos na Caqui",
        posicoes: doCliente(),
      }),
    }),
    compararComPoupanca: tool({
      description: "Compara o rendimento líquido de uma posição com a poupança no mesmo período.",
      inputSchema: z.object({ idPosicao: z.string() }),
      execute: async ({ idPosicao }): Promise<DaConta<{ resultado: string }>> => {
        const posicao = doCliente().find((p) => p.id === idPosicao);
        return {
          fonte: "Seus investimentos na Caqui",
          resultado: posicao
            ? descreverComparacao(compararComPoupanca(posicao))
            : "Posição não encontrada na conta do cliente.",
        };
      },
    }),
  };
}
