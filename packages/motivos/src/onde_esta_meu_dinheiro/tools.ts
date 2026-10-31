import {
  ajustarParaDiaUtil,
  type Contexto,
  type DaConta,
  type Data,
  diaBase,
  emSaoPaulo,
  formatarData,
  type Operacao,
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

export type EstadoEtapa = "concluida" | "atual" | "prevista";
export type EtapaLiquidacao = { rotulo: string; data: Data; hora?: string; estado: EstadoEtapa };
export type Liquidacao = {
  idOperacao: string;
  titulo: string;
  status: Operacao["status"];
  valor: number;
  etapas: EtapaLiquidacao[];
  nota: string | null;
};

const TITULO: Record<Operacao["tipo"], string> = {
  aplicacao: "Aplicação",
  resgate: "Resgate",
  transferencia_saida_pix: "Pix enviado",
  transferencia_entrada: "Transferência recebida",
};

/** Histórico de uma operação em etapas, com o estado de cada uma no instante `agora`. */
export function historicoDeLiquidacao(op: Operacao, agora: string): Liquidacao {
  const hoje = emSaoPaulo(agora).data;
  const pedido = emSaoPaulo(op.pedidoEm);
  const hora = `${Math.floor(pedido.minutos / 60)}h${String(pedido.minutos % 60).padStart(2, "0")}`;
  const previsao =
    op.tipo === "resgate" && op.produto ? preverLiquidacao(op.produto, op.pedidoEm) : null;
  const pagamento = previsao?.tipo === "prevista" ? previsao.pagamento : op.liquidacaoPrevista;

  const datas: Omit<EtapaLiquidacao, "estado">[] = [];
  if (previsao?.tipo === "prevista") {
    if (![pedido.data, pagamento].includes(previsao.diaBase))
      datas.push({ rotulo: "Dia-base do pedido", data: previsao.diaBase });
    if (previsao.cotizacao) datas.push({ rotulo: "Cotização", data: previsao.cotizacao });
  }
  if (pagamento && op.status !== "recusada")
    datas.push({ rotulo: "Dinheiro na conta", data: pagamento });

  const estadoPorData = (data: Data): EstadoEtapa =>
    op.status === "liquidada" || data < hoje ? "concluida" : data === hoje ? "atual" : "prevista";
  const etapas: EtapaLiquidacao[] = [
    { rotulo: "Pedido", data: pedido.data, hora, estado: "concluida" },
    ...datas.map((e) => ({ ...e, estado: estadoPorData(e.data) })),
  ];
  // Pagamento previsto já passou e a operação não liquidou: fica como etapa atual, não concluída.
  const ultima = etapas.at(-1);
  const atrasada =
    ultima !== etapas[0] && ultima?.estado === "concluida" && op.status !== "liquidada";
  if (ultima && atrasada) ultima.estado = "atual";

  const nota =
    op.status === "recusada"
      ? "Pedido recusado."
      : atrasada
        ? `Previsto para ${formatarData(pagamento ?? hoje)} e ainda não liquidado.`
        : previsao?.tipo === "prevista" && previsao.diaBase !== pedido.data
          ? "Pedido depois das 16h, em fim de semana ou feriado conta a partir do próximo dia útil."
          : null;

  return {
    idOperacao: op.id,
    titulo: `${TITULO[op.tipo]}${op.produto ? ` de ${produtoPorCodigo(op.produto)?.nome ?? op.produto}` : ""}`,
    status: op.status,
    valor: op.valor,
    etapas,
    nota,
  };
}

const DIA_DA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const aspas = (s: string) => JSON.stringify(s);

function quando(e: EtapaLiquidacao, hoje: Data): string {
  const [, m, d] = e.data.split("-");
  const semana = DIA_DA_SEMANA[new Date(`${e.data}T12:00:00Z`).getUTCDay()];
  return `${semana}, ${d}/${m}${e.hora ? ` às ${e.hora}` : ""}${e.data === hoje ? " (hoje)" : ""}`;
}

/** Programa OpenUI Lang com uma Timeline por liquidação, até as três que cabem no Painel. */
export function timelineOpenUI(liquidacoes: Liquidacao[], agora: string): string | null {
  if (liquidacoes.length === 0) return null;
  const hoje = emSaoPaulo(agora).data;
  const blocos = liquidacoes.slice(0, 3).map((l, i) => {
    const ids = l.etapas.map((_, j) => `e${i}_${j}`);
    const nota = l.nota ? `, ${aspas(l.nota)}` : "";
    return [
      `t${i} = Timeline(${aspas(l.titulo)}, [${ids.join(", ")}]${nota})`,
      ...l.etapas.map(
        (e, j) =>
          `${ids[j]} = Etapa(${[e.rotulo, quando(e, hoje), e.estado].map(aspas).join(", ")})`,
      ),
    ];
  });
  return [`root = Painel([${blocos.map((_, i) => `t${i}`).join(", ")}])`, ...blocos.flat()].join(
    "\n",
  );
}

/** `aoMontarUi` recebe a Timeline da última consulta, que vira `resposta.ui` no canal web. */
export function criarTools(ctx: Contexto, agora: string, aoMontarUi: (ui: string | null) => void) {
  return {
    consultarLiquidacoes: tool({
      description:
        "Histórico de liquidação das aplicações, resgates e transferências do cliente autenticado: etapas, datas e status. Sem idOperacao, traz as 10 mais recentes.",
      inputSchema: z.object({
        idOperacao: z.string().optional().describe("ex. OP-10007, para ver uma operação só"),
      }),
      execute: async ({ idOperacao }): Promise<DaConta<{ liquidacoes: Liquidacao[] }>> => {
        const doCliente = ctx.cliente
          ? operacoes().filter((o) => o.idCliente === ctx.cliente?.id)
          : [];
        const escolhidas = idOperacao
          ? doCliente.filter((o) => o.id === idOperacao)
          : doCliente.slice(-10);
        const liquidacoes = escolhidas.map((o) => historicoDeLiquidacao(o, agora));
        const emAndamento = liquidacoes.filter(
          (l) => l.status === "pendente" || l.status === "em_processamento",
        );
        aoMontarUi(timelineOpenUI(idOperacao ? liquidacoes : emAndamento, agora));
        return { fonte: "Suas operações na Caqui", liquidacoes };
      },
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
