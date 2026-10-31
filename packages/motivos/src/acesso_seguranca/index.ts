import {
  type ChatRequest,
  type Contexto,
  detectarGolpe,
  encaminhar,
  fonteKb,
  type Motivo,
  pedeDadoDeTerceiro,
  type Resposta,
  SEM_GUARDRAILS_PROPRIOS,
} from "@caqui/nucleo";

const responder = (texto: string, fontes: Resposta["fontes"]): Resposta => ({
  acao: "responder",
  motivo: "acesso_seguranca",
  texto,
  fontes,
  interacao: null,
  ui: null,
  handoff: null,
});

// Determinística: golpe e dado de terceiro nunca passam por um modelo.
async function atender(req: ChatRequest, { cliente }: Contexto): Promise<Resposta> {
  const t = req.mensagem;
  if (detectarGolpe(t)) {
    const r = encaminhar({
      req,
      motivo: "acesso_seguranca",
      fila: "seguranca",
      texto:
        "Pare agora: não passe nenhum código, senha ou valor. A Caqui nunca liga nem manda mensagem pedindo código, senha, transferência, Pix de teste ou instalação de aplicativo de acesso remoto. Isso é golpe. Por precaução, bloqueei o acesso à sua conta em todos os aparelhos (bloqueio simulado). Se você já passou algum código ou fez alguma transferência, conte para a segurança agora.",
      fontes: [fonteKb("KB-019")],
    });
    return {
      ...r,
      interacao: {
        tipo: "botoes",
        opcoes: [
          { id: "ja_passei", titulo: "Já passei o código" },
          { id: "nao_passei", titulo: "Não passei nada" },
        ],
      },
    };
  }
  if (pedeDadoDeTerceiro(t, cliente)) {
    return responder(
      "Só mostro dados da sua própria conta. Informações de outros clientes não são compartilhadas, nem com familiares, nem com quem diga ter autorização.",
      [],
    );
  }
  if (/\bcpf\b/i.test(t)) {
    return cliente
      ? responder(`Por segurança, o CPF aparece sempre mascarado: ${cliente.cpfMascarado}.`, [
          { tipo: "conta", descricao: "Seu cadastro na Caqui" },
        ])
      : responder("Entre na sua conta para ver seus dados. O CPF aparece sempre mascarado.", []);
  }
  if (/bloque|falar com (a )?seguran/i.test(t)) {
    return encaminhar({
      req,
      motivo: "acesso_seguranca",
      fila: "seguranca",
      texto: /bloque/i.test(t)
        ? "Bloqueei o acesso à sua conta em todos os aparelhos (bloqueio simulado). No app, o caminho é Segurança > Bloquear acesso."
        : "Vou te passar para a equipe de segurança.",
      fontes: [fonteKb("KB-020")],
    });
  }
  return {
    ...responder(
      "A troca de senha é feita só no app, em Perfil > Segurança. Para usar a Caqui em um aparelho novo, a confirmação é por biometria facial no próprio app. Ninguém da Caqui vai pedir sua senha.",
      [fonteKb("KB-021"), fonteKb("KB-019")],
    ),
    interacao: {
      tipo: "botoes",
      opcoes: [
        { id: "bloquear", titulo: "Bloquear acesso" },
        { id: "seguranca", titulo: "Falar com segurança" },
      ],
    },
  };
}

export const MOTIVO: Motivo = {
  id: "acesso_seguranca",
  descricao:
    "Acesso à conta, senha, aparelho novo, bloqueio, dados pessoais e qualquer suspeita de golpe.",
  exemplos: [
    "Um gerente da Caqui me ligou pedindo um código",
    "Esqueci minha senha",
    "Quero bloquear minha conta",
  ],
  gatilhos:
    /senha|golpe|bloque|\bacess(o|ar)\b|\blogin\b|aparelho|celular novo|biometria|invadi|hacke|\bcpf\b|\bc[oó]digo\b|\bsms\b/i,
  regras: [5, 10, 11],
  kbs: ["KB-019", "KB-020", "KB-021"],
  guardrails: SEM_GUARDRAILS_PROPRIOS,
  responder: atender,
};
