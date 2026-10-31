import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

// Sobe a partir do cwd até achar dados/. Funciona no dev (apps/caqui), nos testes, no build
// standalone (que copia dados/ para a raiz do bundle) e no Docker. O turbopackIgnore abaixo evita
// que o Next trace o repo inteiro; next.config.ts inclui dados/ e as skills explicitamente.
function acharRaiz(): string {
  const doAmbiente = process.env.CAQUI_RAIZ;
  if (doAmbiente) return doAmbiente;
  let dir = process.cwd();
  while (!existsSync(join(dir, "dados", "calendario.json"))) {
    const pai = dirname(dir);
    if (pai === dir) throw new Error(`pasta dados/ não encontrada a partir de ${process.cwd()}`);
    dir = pai;
  }
  return dir;
}

let raiz: string | undefined;

export function lerDoRepo(caminho: string): string {
  raiz ??= acharRaiz();
  return readFileSync(join(/*turbopackIgnore: true*/ raiz, caminho), "utf8");
}

function listarDoRepo(pasta: string): string[] {
  raiz ??= acharRaiz();
  return readdirSync(join(/*turbopackIgnore: true*/ raiz, pasta));
}

// Campo entre aspas pode ter vírgula e "" escapado (conversas.csv). Não trata quebra de linha
// dentro do campo: nenhum arquivo do pacote tem.
function separarLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"' && aspas && linha[i + 1] === '"') {
      campo += '"';
      i++;
    } else if (c === '"') aspas = !aspas;
    else if (c === "," && !aspas) {
      campos.push(campo);
      campo = "";
    } else campo += c;
  }
  return [...campos, campo];
}

function lerCsv(caminho: string): Record<string, string>[] {
  const [cabecalho, ...linhas] = lerDoRepo(caminho).trim().split(/\r?\n/);
  const campos = separarLinhaCsv(cabecalho ?? "");
  return linhas.map((linha) => {
    const valores = separarLinhaCsv(linha);
    return Object.fromEntries(campos.map((campo, i) => [campo, valores[i] ?? ""]));
  });
}

function memo<T>(carregar: () => T): () => T {
  let valor: T | undefined;
  return () => {
    valor ??= carregar();
    return valor;
  };
}

const vazioComoNull = (s: string) => (s === "" ? null : s);

const ClienteBruto = z
  .object({
    id: z.string(),
    nome: z.string(),
    idade: z.number().int(),
    cpf_mascarado: z.string(),
    saldo_em_conta_brl: z.number(),
  })
  .transform((c) => ({
    id: c.id,
    nome: c.nome,
    idade: c.idade,
    cpfMascarado: c.cpf_mascarado,
    saldoEmConta: c.saldo_em_conta_brl,
  }));
export type Cliente = z.output<typeof ClienteBruto>;

const PosicaoBruta = z
  .object({
    id_posicao: z.string(),
    id_cliente: z.string(),
    produto: z.string(),
    data_aplicacao: z.iso.date(),
    valor_aplicado_brl: z.coerce.number(),
    taxa_contratada: z.string(),
    vencimento: z.string(),
    saldo_bruto_brl: z.coerce.number(),
    data_referencia: z.iso.date(),
  })
  .transform((p) => ({
    id: p.id_posicao,
    idCliente: p.id_cliente,
    produto: p.produto,
    dataAplicacao: p.data_aplicacao,
    valorAplicado: p.valor_aplicado_brl,
    taxaContratada: p.taxa_contratada,
    vencimento: vazioComoNull(p.vencimento),
    saldoBruto: p.saldo_bruto_brl,
    dataReferencia: p.data_referencia,
  }));
export type Posicao = z.output<typeof PosicaoBruta>;

const OperacaoBruta = z
  .object({
    id_operacao: z.string(),
    id_cliente: z.string(),
    tipo: z.enum(["aplicacao", "resgate", "transferencia_saida_pix", "transferencia_entrada"]),
    produto: z.string(),
    valor_brl: z.coerce.number(),
    pedido_em: z.string(),
    status: z.enum(["pendente", "em_processamento", "liquidada", "recusada"]),
    liquidacao_prevista: z.string(),
    observacao: z.string(),
  })
  .transform((o) => ({
    id: o.id_operacao,
    idCliente: o.id_cliente,
    tipo: o.tipo,
    produto: vazioComoNull(o.produto),
    valor: o.valor_brl,
    pedidoEm: o.pedido_em,
    status: o.status,
    liquidacaoPrevista: vazioComoNull(o.liquidacao_prevista),
    observacao: vazioComoNull(o.observacao),
  }));
export type Operacao = z.output<typeof OperacaoBruta>;

const ConversaBruta = z
  .object({
    id_conversa: z.string(),
    id_cliente: z.string(),
    canal: z.string(),
    inicio: z.string(),
    motivo: z.string(),
    desfecho: z.string(),
    transcricao: z.string(),
  })
  .transform((c) => ({
    id: c.id_conversa,
    idCliente: c.id_cliente,
    canal: c.canal,
    inicio: c.inicio,
    motivo: c.motivo,
    desfecho: c.desfecho,
    turnos: c.transcricao.split(" | "),
  }));
/** Atendimento anterior. Ficam de fora os rótulos internos (risco, sinais, não conformidade). */
export type Conversa = z.output<typeof ConversaBruta>;

const Calendario = z.object({
  horario_corte: z.string().regex(/^\d{2}:\d{2}$/),
  dias: z.array(
    z.object({ data: z.iso.date(), dia_util: z.boolean(), feriado: z.string().nullable() }),
  ),
});

const Produto = z.object({
  codigo: z.string(),
  nome: z.string(),
  tipo: z.enum(["CDB", "LCI", "LCA", "FUNDO", "TESOURO", "ACOES"]),
  pct_cdi: z.number().nullable(),
  tributavel: z.boolean(),
  liquidez: z.string(),
  carencia_dias: z.number().optional(),
});
export type Produto = z.infer<typeof Produto>;

const Taxas = z.object({
  cdi_aa: z.number(),
  poupanca_am: z.number(),
  ir_regressivo: z.array(
    z.object({
      ate_dias: z.number().optional(),
      acima_de_dias: z.number().optional(),
      aliquota: z.number(),
    }),
  ),
  produtos: z.array(Produto),
});
export type Taxas = z.infer<typeof Taxas>;

const lerJson = (caminho: string): unknown => JSON.parse(lerDoRepo(caminho));

export const clientes = memo(() => z.array(ClienteBruto).parse(lerJson("dados/clientes.json")));
export const posicoes = memo(() => z.array(PosicaoBruta).parse(lerCsv("dados/posicoes.csv")));
export const operacoes = memo(() => z.array(OperacaoBruta).parse(lerCsv("dados/operacoes.csv")));
export const conversas = memo(() => z.array(ConversaBruta).parse(lerCsv("dados/conversas.csv")));
export const taxas = memo(() => Taxas.parse(lerJson("dados/taxas.json")));
export const calendario = memo(() => {
  const c = Calendario.parse(lerJson("dados/calendario.json"));
  const [h, m] = c.horario_corte.split(":").map(Number);
  return {
    corteMinutos: (h ?? 0) * 60 + (m ?? 0),
    diaUtil: new Map(c.dias.map((d) => [d.data, d.dia_util])),
    feriado: new Map(c.dias.flatMap((d) => (d.feriado ? [[d.data, d.feriado] as const] : []))),
  };
});

export const artigosBrutos = memo(() =>
  listarDoRepo("dados/base_conhecimento")
    .filter((nome) => nome.endsWith(".md"))
    .sort()
    .map((nome) => lerDoRepo(`dados/base_conhecimento/${nome}`)),
);

export function clientePorId(id: string | null): Cliente | null {
  if (id === null) return null;
  return clientes().find((c) => c.id === id) ?? null;
}

export function produtoPorCodigo(codigo: string): Produto | null {
  return taxas().produtos.find((p) => p.codigo === codigo) ?? null;
}

const PerguntaTeste = z.object({
  id: z.string(),
  regra: z.union([z.number(), z.literal("geral")]),
  contexto: z.object({ id_cliente: z.string().optional(), momento: z.string().optional() }),
  pergunta: z.string(),
  resposta_esperada: z.string(),
  acao_esperada: z.string(),
  deve_conter: z.array(z.string()),
  nao_deve_conter: z.array(z.string()),
});
export type PerguntaTeste = z.infer<typeof PerguntaTeste>;

export const perguntasDeTeste = memo(() =>
  lerDoRepo("dados/perguntas_teste.jsonl")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => PerguntaTeste.parse(JSON.parse(l))),
);

export function perguntaDeTeste(id: string): PerguntaTeste {
  const p = perguntasDeTeste().find((x) => x.id === id);
  if (!p) throw new Error(`pergunta inexistente: ${id}`);
  return p;
}
