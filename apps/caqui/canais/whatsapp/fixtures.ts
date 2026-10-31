import type { MotivoId, Resposta } from "@caqui/nucleo";

export const fixtures: Record<MotivoId, Resposta> = {
  onde_esta_meu_dinheiro: {
    motivo: "onde_esta_meu_dinheiro",
    acao: "responder",
    texto:
      "Seu resgate de **R$ 12.000,00** do Caqui Renda Fixa FIF está em processamento. Ele foi pedido na sexta (13/11) às 17h05, depois do corte das 16h, então o dia-base é segunda (16/11). A cotização foi em 17/11 e o pagamento cai **hoje, 18/11**, na sua conta Caqui.",
    fontes: [
      { tipo: "kb", id: "KB-006", titulo: "Prazos de resgate e de aplicação" },
      { tipo: "conta", descricao: "operação OP-10001, resgate de 13/11 às 17h05" },
    ],
    interacao: {
      tipo: "botoes",
      opcoes: [
        { id: "acompanhar", titulo: "Acompanhar resgate" },
        { id: "humano", titulo: "Falar com atendente" },
      ],
    },
    ui: '<StatusResgate valor="12000" produto="FUNDO-RF-01"><Etapa nome="Pedido" em="2026-11-13T17:05" feita /><Etapa nome="Cotização" em="2026-11-17" feita /><Etapa nome="Pagamento" em="2026-11-18" atual /></StatusResgate>',
    handoff: null,
  },

  duvida_produto: {
    motivo: "duvida_produto",
    acao: "responder",
    texto: [
      "Liquidez diária quer dizer que você pode pedir o resgate em qualquer dia útil. No CDB com liquidez diária da Caqui, um pedido feito até as 16h de um dia útil cai na sua conta no mesmo dia. Depois das 16h, ou em fim de semana e feriado, o pedido conta a partir do próximo dia útil.",
      "Liquidez diária não é a mesma coisa que prazo de vencimento. O CDB tem uma data de vencimento, mas, com liquidez diária, você não precisa esperar até lá para resgatar. O rendimento acumulado até o dia do resgate é seu, e o imposto de renda é calculado só sobre o rendimento, pela tabela regressiva, de acordo com quanto tempo o dinheiro ficou aplicado.",
      "Sobre a garantia: CDB, LCI e LCA contam com o FGC, o Fundo Garantidor de Créditos, dentro dos limites do FGC por CPF e por instituição emissora. O limite conta por banco emissor do título, não pela Caqui, que é a corretora que distribui. Os valores e regras atualizados do limite ficam no site do próprio FGC, e é lá que vale conferir antes de aplicar.",
      "Fundos de investimento, Tesouro e ações funcionam de outro jeito: nenhum deles tem a garantia do FGC. Se quiser, explico qualquer um desses pontos com mais calma, um de cada vez.",
    ].join("\n\n"),
    fontes: [
      { tipo: "kb", id: "KB-004", titulo: "O que é liquidez diária" },
      { tipo: "kb", id: "KB-010", titulo: "Imposto de renda na renda fixa" },
      { tipo: "kb", id: "KB-013", titulo: "Garantia do FGC" },
    ],
    interacao: {
      tipo: "botoes",
      opcoes: [
        { id: "ir", titulo: "Como funciona o IR" },
        { id: "fgc", titulo: "Mais sobre o FGC" },
        { id: "humano", titulo: "Falar com atendente" },
      ],
    },
    ui: null,
    handoff: null,
  },

  rentabilidade_extrato: {
    motivo: "rentabilidade_extrato",
    acao: "responder",
    texto: [
      "## Comparando do jeito certo",
      "Seu CDB rendeu **R$ 41,20 bruto** no mês. Depois do IR de 22,5% (aplicação com menos de 180 dias), ficam **R$ 31,93 líquidos**. A poupança, que é isenta, teria rendido R$ 30,10 no mesmo período.",
      "Ou seja: no bruto parece que a diferença é grande, mas a comparação justa é <b>líquido com líquido</b>, e nela o CDB ainda rendeu mais. Veja a regra em [Comparar com a poupança](https://ajuda.caquiinvest.example/kb-012).",
    ].join("\n\n"),
    fontes: [
      { tipo: "kb", id: "KB-012", titulo: "Comparar com a poupança" },
      { tipo: "conta", descricao: "posição CDB-LD-100 e taxas de novembro" },
    ],
    interacao: null,
    ui: '<Comparativo titulo="Novembro" series=[{nome:"CDB líquido",valor:31.93},{nome:"Poupança",valor:30.10}] />',
    handoff: null,
  },

  acesso_seguranca: {
    motivo: "acesso_seguranca",
    acao: "encaminhar_seguranca",
    texto:
      "*Não passe o código.* A Caqui nunca liga pedindo senha, código do SMS ou transferência. Desligue a ligação. Bloqueamos sua sessão por segurança e uma pessoa da equipe de segurança já vai falar com você aqui.",
    fontes: [
      { tipo: "kb", id: "KB-019", titulo: "Segurança: a Caqui nunca pede" },
      { tipo: "kb", id: "KB-020", titulo: "Suspeita de golpe: o que fazer" },
    ],
    interacao: {
      tipo: "botoes",
      opcoes: [
        { id: "passei", titulo: "Já passei o código" },
        { id: "nao_passei", titulo: "Não passei nada" },
      ],
    },
    ui: null,
    handoff: {
      protocolo: "SEG-20261118-0031",
      fila: "seguranca",
      humanoDisponivel: true,
      retornoPrevisto: null,
      resumo: "Cliente relata ligação de suposto gerente pedindo código do SMS. Sessão bloqueada.",
    },
  },

  impostos_documentos: {
    motivo: "impostos_documentos",
    acao: "responder",
    texto: "O informe de rendimentos de 2025 já está disponível no app, em Perfil > Documentos. Escolha abaixo qual documento você quer receber por aqui.",
    fontes: [{ tipo: "kb", id: "KB-017", titulo: "Informe de rendimentos" }],
    interacao: {
      tipo: "lista",
      botao: "Ver documentos",
      secoes: [
        {
          titulo: "Imposto de renda",
          linhas: [
            { id: "informe_2025", titulo: "Informe 2025", descricao: "Ano-calendário 2025, todos os produtos" },
            { id: "informe_2024", titulo: "Informe 2024", descricao: "Ano-calendário 2024" },
          ],
        },
        {
          titulo: "Movimentação",
          linhas: [
            { id: "extrato_out", titulo: "Extrato de outubro", descricao: "Aplicações, resgates e rendimentos" },
            { id: "nota", titulo: "Notas de corretagem", descricao: "Operações em ações dos últimos 90 dias" },
            { id: "comprovante", titulo: "Comprovante de resgate" },
          ],
        },
      ],
    },
    ui: null,
    handoff: null,
  },

  pedido_recomendacao: {
    motivo: "pedido_recomendacao",
    acao: "encaminhar_especialista",
    texto:
      "Não posso indicar onde colocar o seu dinheiro: isso depende do seu perfil, dos seus objetivos e de quando você vai precisar do valor, e quem faz essa análise é um especialista. Posso explicar como funcionam CDB, LCI, Tesouro Selic e fundos enquanto isso. Já passei o seu pedido para um especialista, com o que você me contou.",
    fontes: [{ tipo: "kb", id: "KB-029", titulo: "Recomendação de investimento" }],
    interacao: null,
    ui: null,
    handoff: {
      protocolo: "ESP-20261118-0412",
      fila: "especialista",
      humanoDisponivel: true,
      retornoPrevisto: null,
      resumo: "Cliente com R$ 50 mil quer saber onde investir. Pedido de recomendação.",
    },
  },

  reclamacao_cancelamento: {
    motivo: "reclamacao_cancelamento",
    acao: "encaminhar_humano",
    texto:
      "Entendi, você quer encerrar a sua conta. Registrei o pedido com o motivo que você contou. Para encerrar, os investimentos precisam ser resgatados e o saldo transferido, e uma pessoa do atendimento cuida disso com você.",
    fontes: [{ tipo: "kb", id: "KB-027", titulo: "Reclamação e encerramento de conta" }],
    interacao: null,
    ui: null,
    handoff: {
      protocolo: "ATD-20261118-2307",
      fila: "atendimento",
      humanoDisponivel: false,
      retornoPrevisto: "2026-11-19T08:00:00-03:00",
      resumo: "Pedido de encerramento de conta na primeira mensagem. Motivo: insatisfação com tarifas.",
    },
  },

  outros: {
    motivo: "outros",
    acao: "responder",
    texto:
      "Endereço, telefone e e-mail você muda no app, em **Perfil > Meus dados**. Mudança de _nome_ exige documento e é feita com o atendimento.",
    fontes: [{ tipo: "kb", id: "KB-022", titulo: "Atualização de dados cadastrais" }],
    interacao: {
      tipo: "botoes",
      opcoes: [
        { id: "resolvido", titulo: "Resolvido, obrigado" },
        { id: "humano", titulo: "Falar com atendente" },
      ],
    },
    ui: null,
    handoff: null,
  },
};
