// Respostas de exemplo, uma ou mais por motivo, para demo e para testar a UI sem o núcleo.
// Dados do cliente sintético C-0007 e "agora" = 18/11/2026 10h, como no CASE.
import type { MotivoId, Resposta } from "@caqui/nucleo";

const timelineResgate = [
  "root = Painel([linha])",
  'linha = Timeline("Resgate do Caqui Renda Fixa FIF", [e1, e2, e3, e4], "Pedido depois das 16h conta a partir do próximo dia útil. Domingo, 15/11, foi feriado.")',
  'e1 = Etapa("Pedido de resgate", "sex, 13/11 às 17h05", "concluida", "Depois do corte das 16h")',
  'e2 = Etapa("Dia-base do pedido", "seg, 16/11", "concluida")',
  'e3 = Etapa("Cotização", "ter, 17/11", "concluida", "Dia em que o valor das cotas é fixado")',
  'e4 = Etapa("Dinheiro na sua conta", "qua, 18/11 (hoje)", "atual", "Pagamento em D+2 úteis")',
].join("\n");

const comparativoPoupanca = [
  "root = Painel([comp])",
  'comp = Comparativo("Seus R$ 6.000 desde 03/08", 6000, "107 dias", [cdb, poup])',
  'cdb = ItemComparado("CDB Caqui Liquidez Diária 100", 189.28, 42.59, 146.69)',
  'poup = ItemComparado("Poupança no mesmo período", 108.65, 0, 108.65)',
].join("\n");

const tabelaIR = [
  "root = Painel([tab])",
  'tab = TabelaIR("Imposto de renda na renda fixa", [f1, f2, f3, f4], "O imposto incide só sobre o rendimento, nunca sobre o valor aplicado.")',
  'f1 = FaixaIR("Até 180 dias", 22.5, true)',
  'f2 = FaixaIR("De 181 a 360 dias", 20)',
  'f3 = FaixaIR("De 361 a 720 dias", 17.5)',
  'f4 = FaixaIR("Acima de 720 dias", 15)',
].join("\n");

const protocoloReclamacao = [
  "root = Painel([cartao])",
  'cartao = CartaoProtocolo("CQ-2026-118-0412", "atendimento", "Pedido de encerramento registrado", "até 25/11")',
].join("\n");

export const fixtures = {
  ondeEstaMeuDinheiro: {
    motivo: "onde_esta_meu_dinheiro",
    acao: "responder",
    texto:
      "Seu dinheiro está a caminho e cai hoje, quarta, 18/11.\n\nO resgate de R$ 12.000,00 do Caqui Renda Fixa FIF foi pedido na sexta às 17h05, depois do corte das 16h. Por isso o prazo começou a contar na segunda. A cotização foi ontem e o pagamento é hoje.",
    fontes: [
      { tipo: "kb", id: "KB-006", titulo: "Prazos de resgate e de aplicação" },
      { tipo: "conta", descricao: "Resgate OP-10001, pedido em 13/11 às 17h05" },
    ],
    interacao: null,
    ui: timelineResgate,
    handoff: null,
  },
  duvidaProduto: {
    motivo: "duvida_produto",
    acao: "responder",
    texto:
      "Liquidez diária quer dizer que você pode pedir o resgate em qualquer dia útil. Pedidos até as 16h caem no mesmo dia.\n\nO CDB é um título emitido por um banco: você empresta dinheiro e recebe juros. Ele tem garantia do FGC dentro dos limites do fundo.",
    fontes: [
      { tipo: "kb", id: "KB-004", titulo: "O que é liquidez diária" },
      { tipo: "kb", id: "KB-003", titulo: "O que é um CDB" },
      { tipo: "kb", id: "KB-013", titulo: "Garantia do FGC" },
    ],
    interacao: {
      tipo: "botoes",
      opcoes: [
        { id: "fgc", titulo: "Como funciona o FGC" },
        { id: "imposto", titulo: "Tem imposto?" },
        { id: "humano", titulo: "Falar com uma pessoa" },
      ],
    },
    ui: null,
    handoff: null,
  },
  rentabilidade: {
    motivo: "rentabilidade_extrato",
    acao: "responder",
    texto:
      "Não. Comparando o que fica com você depois do imposto, seu CDB rendeu R$ 146,69 e a poupança teria rendido R$ 108,65 no mesmo período.\n\nNo extrato aparece o rendimento bruto, antes do imposto. Por isso a comparação direta com a poupança, que é isenta, confunde.",
    fontes: [
      { tipo: "kb", id: "KB-012", titulo: "Comparar com a poupança" },
      { tipo: "kb", id: "KB-009", titulo: "Rentabilidade bruta e líquida" },
      { tipo: "conta", descricao: "CDB-LD-100 aplicado em 03/08, saldo de 18/11" },
    ],
    interacao: null,
    ui: comparativoPoupanca,
    handoff: null,
  },
  seguranca: {
    motivo: "acesso_seguranca",
    acao: "encaminhar_seguranca",
    texto:
      "Não passe o código para ninguém. A Caqui nunca liga pedindo senha, código ou transferência.\n\nPor segurança, encerramos sua sessão em todos os aparelhos. A equipe de segurança já está com o seu caso e atende agora, sem fila.",
    fontes: [
      { tipo: "kb", id: "KB-019", titulo: "Segurança: a Caqui nunca pede" },
      { tipo: "kb", id: "KB-020", titulo: "Suspeita de golpe: o que fazer" },
    ],
    interacao: null,
    ui: null,
    handoff: {
      protocolo: "CQ-2026-118-0007",
      fila: "seguranca",
      humanoDisponivel: true,
      retornoPrevisto: null,
      resumo:
        "Cliente recebeu ligação de suposto gerente da Caqui pedindo o código do SMS. Ainda não informou o código. Sessão bloqueada.",
    },
  },
  impostos: {
    motivo: "impostos_documentos",
    acao: "responder",
    texto:
      "Seu CDB foi aplicado há 107 dias, então hoje o imposto seria de 22,5% sobre o rendimento. A alíquota cai com o tempo, como na tabela.",
    fontes: [
      { tipo: "kb", id: "KB-010", titulo: "Imposto de renda na renda fixa" },
      { tipo: "conta", descricao: "CDB-LD-100 aplicado em 03/08" },
    ],
    interacao: {
      tipo: "lista",
      botao: "Outros documentos",
      secoes: [
        {
          titulo: "Documentos",
          linhas: [
            {
              id: "informe",
              titulo: "Informe de rendimentos",
              descricao: "Disponível a partir de fevereiro",
            },
            { id: "extrato", titulo: "Extrato do mês" },
            { id: "nota", titulo: "Nota de corretagem", descricao: "Para operações com ações" },
          ],
        },
      ],
    },
    ui: tabelaIR,
    handoff: null,
  },
  recomendacao: {
    motivo: "pedido_recomendacao",
    acao: "encaminhar_especialista",
    texto:
      "Não posso indicar onde colocar seu dinheiro: essa escolha depende do seu perfil e precisa de um especialista. Posso explicar como cada produto funciona enquanto isso.",
    fontes: [{ tipo: "kb", id: "KB-029", titulo: "Recomendação de investimento" }],
    interacao: {
      tipo: "botoes",
      opcoes: [
        { id: "cdb", titulo: "O que é CDB" },
        { id: "lci", titulo: "O que é LCI e LCA" },
      ],
    },
    ui: null,
    handoff: {
      protocolo: "CQ-2026-118-0233",
      fila: "especialista",
      humanoDisponivel: true,
      retornoPrevisto: null,
      resumo:
        "Cliente tem R$ 50 mil para investir e pediu indicação. Ainda sem perfil de investidor preenchido.",
    },
  },
  reclamacao: {
    motivo: "reclamacao_cancelamento",
    acao: "encaminhar_humano",
    texto:
      "Entendi, você quer encerrar sua conta. Já registrei o pedido e uma pessoa do atendimento vai cuidar dele com você.",
    fontes: [{ tipo: "kb", id: "KB-027", titulo: "Reclamação e encerramento de conta" }],
    interacao: null,
    ui: protocoloReclamacao,
    handoff: {
      protocolo: "CQ-2026-118-0412",
      fila: "atendimento",
      humanoDisponivel: true,
      retornoPrevisto: null,
      resumo:
        "Cliente pediu o encerramento da conta na primeira mensagem. Nenhuma tentativa de retenção feita.",
    },
  },
  outros: {
    motivo: "outros",
    acao: "responder",
    texto: "Claro. Qual dado você quer atualizar?",
    fontes: [{ tipo: "kb", id: "KB-022", titulo: "Atualização de dados cadastrais" }],
    interacao: {
      tipo: "lista",
      botao: "Escolher o dado",
      secoes: [
        {
          titulo: "Contato",
          linhas: [
            { id: "email", titulo: "E-mail" },
            { id: "telefone", titulo: "Telefone celular" },
          ],
        },
        {
          titulo: "Cadastro",
          linhas: [
            { id: "endereco", titulo: "Endereço", descricao: "Pede comprovante de residência" },
            { id: "renda", titulo: "Renda e patrimônio" },
          ],
        },
      ],
    },
    ui: null,
    handoff: null,
  },
  humanoIndisponivel: {
    motivo: "outros",
    acao: "encaminhar_humano",
    texto:
      "Agora não há atendimento por pessoa: ele funciona das 8h às 20h, todos os dias. Registrei seu pedido com um protocolo e retornamos a partir das 8h.",
    fontes: [
      { tipo: "kb", id: "KB-025", titulo: "Falar com uma pessoa" },
      { tipo: "kb", id: "KB-026", titulo: "Protocolo e prazo de resposta" },
    ],
    interacao: null,
    ui: null,
    handoff: {
      protocolo: "CQ-2026-118-0918",
      fila: "atendimento",
      humanoDisponivel: false,
      retornoPrevisto: "quinta, 19/11, a partir das 8h",
      resumo:
        "Cliente pediu para falar com uma pessoa às 23h. Sem outra demanda registrada até aqui.",
    },
  },
  humanoDisponivel: {
    motivo: "outros",
    acao: "encaminhar_humano",
    texto: "Certo, vou chamar uma pessoa do atendimento para continuar com você.",
    fontes: [{ tipo: "kb", id: "KB-025", titulo: "Falar com uma pessoa" }],
    interacao: null,
    ui: null,
    handoff: {
      protocolo: "CQ-2026-118-0917",
      fila: "atendimento",
      humanoDisponivel: true,
      retornoPrevisto: null,
      resumo: "Cliente pediu para falar com uma pessoa. Sem outra demanda registrada até aqui.",
    },
  },
  uiInvalida: {
    motivo: "outros",
    acao: "responder",
    texto:
      "Esta resposta traz um componente fora da biblioteca. O texto aparece; o componente, não.",
    fontes: [],
    interacao: null,
    ui: 'root = Painel([g])\ng = GraficoDePizza("Carteira", [1, 2, 3])',
    handoff: null,
  },
} satisfies Record<string, Resposta>;

/** A resposta principal de cada motivo. O Record garante cobertura dos 8. */
export const fixturePorMotivo: Record<MotivoId, Resposta> = {
  onde_esta_meu_dinheiro: fixtures.ondeEstaMeuDinheiro,
  duvida_produto: fixtures.duvidaProduto,
  rentabilidade_extrato: fixtures.rentabilidade,
  acesso_seguranca: fixtures.seguranca,
  impostos_documentos: fixtures.impostos,
  pedido_recomendacao: fixtures.recomendacao,
  reclamacao_cancelamento: fixtures.reclamacao,
  outros: fixtures.outros,
};
