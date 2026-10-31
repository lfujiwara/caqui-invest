// Biblioteca fechada de componentes que o modelo pode gerar em `resposta.ui`.
// Não importa React: o backend usa este arquivo para montar o prompt e validar a saída.
import {
  createLibrary,
  createParser,
  defineComponent,
  type ElementNode,
} from "@openuidev/lang-core";
import { z } from "zod/v4";

const Etapa = defineComponent({
  name: "Etapa",
  description: "Uma etapa da Timeline.",
  props: z.object({
    rotulo: z.string().describe('O que acontece, ex. "Pedido de resgate"'),
    quando: z.string().describe('Data e hora já calculadas pelo núcleo, ex. "ter, 17/11 às 10h"'),
    estado: z.enum(["concluida", "atual", "prevista"]),
    detalhe: z.string().optional().describe("Uma frase curta de explicação"),
  }),
  component: null,
});

const Timeline = defineComponent({
  name: "Timeline",
  description:
    "Etapas de uma aplicação, resgate, liquidação ou transferência, em ordem. Use só com datas calculadas pelo calendário da Caqui.",
  props: z.object({
    titulo: z.string(),
    etapas: z.array(Etapa.ref),
    nota: z.string().optional().describe("Regra que explica o prazo, ex. corte das 16h"),
  }),
  component: null,
});

const ItemComparado = defineComponent({
  name: "ItemComparado",
  description: "Uma linha do Comparativo. Valores em reais, número com ponto decimal, sem R$.",
  props: z.object({
    produto: z.string(),
    rendimentoBruto: z.number(),
    impostoRenda: z.number().describe("0 para produto isento"),
    rendimentoLiquido: z.number(),
  }),
  component: null,
});

const Comparativo = defineComponent({
  name: "Comparativo",
  description:
    "Rendimento líquido de produtos lado a lado, ex. CDB contra poupança. Mostra fatos; nunca indica qual escolher.",
  props: z.object({
    titulo: z.string(),
    valorAplicado: z.number(),
    periodo: z.string().describe('ex. "120 dias"'),
    itens: z.array(ItemComparado.ref),
  }),
  component: null,
});

const CartaoProtocolo = defineComponent({
  name: "CartaoProtocolo",
  description: "Um protocolo de atendimento já aberto e a situação dele.",
  props: z.object({
    protocolo: z.string(),
    fila: z.enum(["atendimento", "seguranca", "especialista"]),
    situacao: z.string().describe('ex. "Em análise"'),
    prazo: z.string().optional().describe('ex. "até 25/11"'),
  }),
  component: null,
});

const FaixaIR = defineComponent({
  name: "FaixaIR",
  description: "Uma faixa da TabelaIR.",
  props: z.object({
    prazo: z.string().describe('ex. "De 181 a 360 dias"'),
    aliquota: z.number().describe("Percentual, ex. 17.5"),
    atual: z.boolean().optional().describe("true na faixa em que a aplicação do cliente está"),
  }),
  component: null,
});

const TabelaIR = defineComponent({
  name: "TabelaIR",
  description:
    "Tabela regressiva do imposto de renda da renda fixa, com a faixa do cliente marcada.",
  props: z.object({
    titulo: z.string(),
    faixas: z.array(FaixaIR.ref),
    nota: z.string().optional(),
  }),
  component: null,
});

const Painel = defineComponent({
  name: "Painel",
  description: "Raiz obrigatória. Agrupa de um a três blocos visuais.",
  props: z.object({
    blocos: z.array(z.union([Timeline.ref, Comparativo.ref, CartaoProtocolo.ref, TabelaIR.ref])),
  }),
  component: null,
});

export const definicoes = {
  Painel,
  Timeline,
  Etapa,
  Comparativo,
  ItemComparado,
  CartaoProtocolo,
  TabelaIR,
  FaixaIR,
};
export type NomeComponente = keyof typeof definicoes;
export type PropsDe<N extends NomeComponente> = z.infer<(typeof definicoes)[N]["props"]>;

export const RAIZ = "Painel" satisfies NomeComponente;

export const bibliotecaOpenUI = createLibrary({
  components: Object.values(definicoes),
  root: RAIZ,
});

/** Texto que descreve a biblioteca ao modelo. O backend o anexa ao prompt do canal web. */
export const especificacaoOpenUI: string = bibliotecaOpenUI.prompt({
  preamble:
    "No canal web, além do texto, devolva em `ui` um pequeno programa OpenUI Lang que ilustra a resposta. " +
    "O cliente entende melhor vendo: sempre que a resposta tiver datas, prazos, etapas, valores, rendimento, imposto ou protocolo, monte a `ui`. " +
    "Na dúvida, monte. Omita `ui` só quando a resposta não tiver nenhum dado que caiba num componente. " +
    "O texto continua completo sozinho: `ui` é um complemento visual, não um substituto.",
  additionalRules: [
    "Use apenas os componentes listados. Qualquer outro é descartado sem aviso ao cliente.",
    "Prazo de resgate, aplicação, liquidação ou transferência: Timeline. Rendimento de dois ou mais produtos: Comparativo. Imposto de renda da renda fixa: TabelaIR. Protocolo de atendimento: CartaoProtocolo.",
    "Combine blocos quando a resposta tiver mais de um desses assuntos, até três no Painel.",
    "O programa vai só no campo `ui`. Nunca escreva código OpenUI no `texto`: o cliente leria o código cru.",
    "A raiz é sempre Painel([...]), com de um a três blocos.",
    "Datas, prazos, taxas e valores vêm do núcleo e da base de conhecimento. Nunca invente um número.",
    "Comparativo compara sempre valores líquidos, depois do imposto. Nunca marque um produto como melhor nem sugira qual escolher.",
    "Valores em reais são números com ponto decimal, sem R$ e sem separador de milhar.",
    "Não use ui em respostas de segurança: ali o texto precisa ser direto.",
  ],
  examples: [
    [
      "root = Painel([linha])",
      'linha = Timeline("Resgate do Caqui Renda Fixa FIF", [e1, e2, e3], "Pedido depois das 16h conta a partir do próximo dia útil.")',
      'e1 = Etapa("Pedido de resgate", "sex, 13/11 às 17h05", "concluida")',
      'e2 = Etapa("Cotização", "ter, 17/11", "atual", "Dia em que o valor das cotas é fixado")',
      'e3 = Etapa("Dinheiro na conta", "qua, 18/11", "prevista")',
    ].join("\n"),
    [
      "root = Painel([comp])",
      'comp = Comparativo("Seus R$ 10.000 em 120 dias", 10000, "120 dias", [cdb, poup])',
      'cdb = ItemComparado("CDB Caqui 100% do CDI", 347.12, 78.10, 269.02)',
      'poup = ItemComparado("Poupança", 241.55, 0, 241.55)',
    ].join("\n"),
  ],
});

const COMPONENTES_DE_TOPO = new Set<string>([
  "Painel",
  "Timeline",
  "Comparativo",
  "CartaoProtocolo",
  "TabelaIR",
]);
const parser = createParser(bibliotecaOpenUI.toJSONSchema(), RAIZ);

export type AnaliseUi = { ok: true; raiz: ElementNode } | { ok: false; motivo: string };

/** Aceita só programas completos, sem erro e com raiz conhecida. Qualquer outra coisa é descartada. */
export function analisarUi(ui: string): AnaliseUi {
  const resultado = parser.parse(ui);
  if (resultado.meta.errors.length > 0) {
    return { ok: false, motivo: resultado.meta.errors.map((e) => e.message).join("; ") };
  }
  if (resultado.meta.incomplete || resultado.meta.unresolved.length > 0) {
    return { ok: false, motivo: "programa incompleto ou com referência sem definição" };
  }
  if (!resultado.root) return { ok: false, motivo: "nenhuma raiz encontrada" };
  if (!COMPONENTES_DE_TOPO.has(resultado.root.typeName)) {
    return { ok: false, motivo: `raiz ${resultado.root.typeName} não pode aparecer sozinha` };
  }
  return { ok: true, raiz: resultado.root };
}
