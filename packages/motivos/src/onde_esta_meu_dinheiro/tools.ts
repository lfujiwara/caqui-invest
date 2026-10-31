import {
  ajustarParaDiaUtil,
  type Contexto,
  type DaConta,
  type Data,
  diaBase,
  formatarData,
  operacoes,
  produtoPorCodigo,
  somarDiasCorridos,
  somarDiasUteis,
} from "@caqui/nucleo";
import { tool } from "ai";
import { z } from "zod";

export type Previsao =
  | { tipo: "prevista"; diaBase: Data; cotizacao: Data | null; pagamento: Data }
  | { tipo: "sem_liquidez" }
  | { tipo: "produto_desconhecido" };

// Prazos de KB-006 a partir do dia-base. A cotização só existe para fundos.
const PRAZOS: Record<string, (base: Data) => { cotizacao: Data | null; pagamento: Data }> = {
  CDB: (base) => ({ cotizacao: null, pagamento: base }),
  LCI: (base) => ({ cotizacao: null, pagamento: base }),
  "FUNDO-RF-01": (base) => ({
    cotizacao: somarDiasUteis(base, 1),
    pagamento: somarDiasUteis(base, 2),
  }),
  "FUNDO-MM-01": (base) => {
    const cotizacao = ajustarParaDiaUtil(somarDiasCorridos(base, 30));
    return { cotizacao, pagamento: somarDiasUteis(cotizacao, 2) };
  },
  TESOURO: (base) => ({ cotizacao: null, pagamento: somarDiasUteis(base, 1) }),
  ACOES: (base) => ({ cotizacao: null, pagamento: somarDiasUteis(base, 2) }),
};

/** Regra 1: quando um pedido de resgate liquida, pelo calendário da Caqui e o corte das 16h. */
export function preverLiquidacao(codigo: string, pedidoEm: string): Previsao {
  const produto = produtoPorCodigo(codigo);
  if (!produto) return { tipo: "produto_desconhecido" };
  if (produto.liquidez === "no_vencimento") return { tipo: "sem_liquidez" };
  const prazo = PRAZOS[produto.codigo] ?? PRAZOS[produto.tipo];
  if (!prazo) return { tipo: "produto_desconhecido" };
  const base = diaBase(pedidoEm);
  return { tipo: "prevista", diaBase: base, ...prazo(base) };
}

/** Versão legível da previsão, que o modelo repete ao cliente. */
export function descreverPrevisao(p: Previsao): string {
  if (p.tipo === "sem_liquidez")
    return "Produto sem liquidez diária: o resgate só acontece no vencimento.";
  if (p.tipo === "produto_desconhecido")
    return "Produto não encontrado entre os produtos da Caqui.";
  const cot = p.cotizacao ? `, cotização ${formatarData(p.cotizacao)}` : "";
  return `Dia-base ${formatarData(p.diaBase)}${cot}, pagamento ${formatarData(p.pagamento)}.`;
}

export function criarTools(ctx: Contexto) {
  return {
    consultarOperacoes: tool({
      description: "Lista aplicações, resgates e transferências do cliente autenticado.",
      inputSchema: z.object({}),
      execute: async (): Promise<DaConta<{ operacoes: unknown[] }>> => ({
        fonte: "Suas operações na Caqui",
        operacoes: ctx.cliente
          ? operacoes()
              .filter((o) => o.idCliente === ctx.cliente?.id)
              .slice(-10)
          : [],
      }),
    }),
    preverLiquidacao: tool({
      description:
        "Calcula dia-base, cotização e pagamento de um resgate pelo calendário de dias úteis e o corte das 16h.",
      inputSchema: z.object({
        produto: z.string().describe("código do produto, ex. CDB-LD-100 ou FUNDO-RF-01"),
        pedidoEm: z.string().describe("instante do pedido em ISO 8601 com fuso"),
      }),
      execute: async ({ produto, pedidoEm }) =>
        descreverPrevisao(preverLiquidacao(produto, pedidoEm)),
    }),
  };
}
