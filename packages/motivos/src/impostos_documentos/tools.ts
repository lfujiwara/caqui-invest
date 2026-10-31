import {
  type Contexto,
  type DaConta,
  formatarBrl,
  formatarPct,
  type Posicao,
  posicoes,
  produtoPorCodigo,
  type Tributacao,
  toolsDaConta,
  tributar,
} from "@caqui/nucleo";
import { tool } from "ai";
import { z } from "zod";

const TipoDocumento = z.enum(["informe_rendimentos", "extrato", "comprovante"]);
const FiltrosDocumentos = z.object({
  tipo: TipoDocumento.optional(),
  ano: z.number().int().min(1).max(9999).optional(),
  idDocumento: z.string().optional(),
});

type DocumentoMock = {
  idDocumento: string;
  idCliente: string;
  tipo: z.infer<typeof TipoDocumento>;
  ano: number;
  periodo: string;
  status: "disponivel" | "em_preparacao";
  idOperacao?: string;
};

// Metadados fictícios para exercitar o atendimento. Não são arquivos nem prazos de emissão.
const DOCUMENTOS_MOCK: readonly DocumentoMock[] = [
  {
    idDocumento: "DOC-MARTA-IR-2025",
    idCliente: "C-0001",
    tipo: "informe_rendimentos",
    ano: 2025,
    periodo: "2025-01-01 a 2025-12-31",
    status: "disponivel",
  },
  {
    idDocumento: "DOC-MARTA-EXTRATO-202610",
    idCliente: "C-0001",
    tipo: "extrato",
    ano: 2026,
    periodo: "2026-10-01 a 2026-10-31",
    status: "disponivel",
  },
  {
    idDocumento: "DOC-MARTA-COMP-10006",
    idCliente: "C-0001",
    tipo: "comprovante",
    ano: 2026,
    periodo: "2026-10-05",
    status: "disponivel",
    idOperacao: "OP-10006",
  },
  {
    idDocumento: "DOC-RAFAEL-IR-2025",
    idCliente: "C-0002",
    tipo: "informe_rendimentos",
    ano: 2025,
    periodo: "2025-01-01 a 2025-12-31",
    status: "disponivel",
  },
  {
    idDocumento: "DOC-RAFAEL-EXTRATO-202610",
    idCliente: "C-0002",
    tipo: "extrato",
    ano: 2026,
    periodo: "2026-10-01 a 2026-10-31",
    status: "disponivel",
  },
  {
    idDocumento: "DOC-CAMILA-IR-2025",
    idCliente: "C-0003",
    tipo: "informe_rendimentos",
    ano: 2025,
    periodo: "2025-01-01 a 2025-12-31",
    status: "em_preparacao",
  },
  {
    idDocumento: "DOC-CAMILA-EXTRATO-202610",
    idCliente: "C-0003",
    tipo: "extrato",
    ano: 2026,
    periodo: "2026-10-01 a 2026-10-31",
    status: "disponivel",
  },
];

export function consultarDocumentosMock(
  idCliente: string | null,
  filtros: z.infer<typeof FiltrosDocumentos> = {},
): DocumentoMock[] {
  return DOCUMENTOS_MOCK.filter((d) => d.idCliente === idCliente)
    .filter((d) => !filtros.tipo || d.tipo === filtros.tipo)
    .filter((d) => filtros.ano === undefined || d.ano === filtros.ano)
    .filter((d) => !filtros.idDocumento || d.idDocumento === filtros.idDocumento)
    .map((d) => ({ ...d }));
}

/**
 * Regra 2 para uma posição do cliente. O rendimento é o da data de referência dos dados;
 * a data do resgate muda só a faixa da alíquota.
 */
export function simularIr(posicao: Posicao, resgateEm: string): Tributacao {
  const produto = produtoPorCodigo(posicao.produto);
  if (!produto) throw new Error(`produto desconhecido: ${posicao.produto}`);
  if (produto.tipo === "ACOES")
    throw new RangeError("A base não contém regra de tributação de ações.");
  if (!z.iso.date().safeParse(resgateEm).success || resgateEm < posicao.dataAplicacao)
    throw new RangeError("Informe uma data válida de resgate, igual ou posterior à aplicação.");
  if (posicao.saldoBruto < posicao.valorAplicado)
    throw new RangeError("A base não contém regra de compensação de prejuízo.");
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
    ...toolsDaConta(ctx),
    consultarDocumentos: tool({
      description:
        "Consulta metadados e status MOCKADOS de informes, extratos e comprovantes da própria conta. Não gera arquivo, link nem download. Fixtures para Marta, Rafael e Camila.",
      inputSchema: FiltrosDocumentos,
      execute: async (
        filtros,
      ): Promise<
        DaConta<{
          simulado: true;
          identificado: boolean;
          dataReferencia: string;
          documentos: DocumentoMock[];
          aviso: string;
        }>
      > => ({
        fonte: "Seus documentos na Caqui (simulação)",
        simulado: true,
        identificado: ctx.cliente !== null,
        dataReferencia: "2026-11-18",
        documentos: consultarDocumentosMock(ctx.cliente?.id ?? null, filtros),
        aviso:
          "Somente metadados fictícios, sem arquivo ou download. Lista vazia indica ausência no mock, não inexistência real do documento. Não há prazo de emissão simulado.",
      }),
    }),
    simularIr: tool({
      description:
        "Calcula a alíquota e o IR de uma posição do cliente para uma data de resgate (AAAA-MM-DD).",
      inputSchema: z.object({
        idPosicao: z.string(),
        resgateEm: z.iso.date(),
      }),
      execute: async ({ idPosicao, resgateEm }): Promise<DaConta<{ resultado: string }>> => {
        const posicao = doCliente().find((p) => p.id === idPosicao);
        let resultado = "Posição não encontrada na conta do cliente.";
        if (posicao) {
          try {
            resultado = `${descreverIr(simularIr(posicao, resgateEm))} Rendimento registrado em ${posicao.dataReferencia}; a simulação altera apenas a faixa de IR, sem recalcular o rendimento para outra data.`;
          } catch (erro) {
            if (!(erro instanceof RangeError)) throw erro;
            resultado = erro.message;
          }
        }
        return {
          fonte: "Seus investimentos na Caqui",
          resultado,
        };
      },
    }),
  };
}
