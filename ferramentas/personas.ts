/** Personas do CASE.md, cada uma ligada a um cliente sintético de dados/clientes.json. */
export type Persona = {
  idCliente: string | null;
  quem: string;
  canal: "web" | "whatsapp";
  /** Mensagens típicas, para começar a conversa ou rodar sem digitar (--roteiro). */
  roteiro: readonly string[];
};

export const PERSONAS = {
  marta: {
    idCliente: "C-0001",
    quem: "Dona Marta, 63, aposentada. Primeiro CDB, quer ter certeza a cada passo de que o dinheiro está lá.",
    canal: "whatsapp",
    roteiro: [
      "Boa tarde, apliquei no CDB e não estou vendo o dinheiro, ele sumiu?",
      "Meu dinheiro está seguro mesmo? E se a Caqui quebrar?",
      "Quanto eu tenho hoje no total?",
    ],
  },
  rafael: {
    idCliente: "C-0002",
    quem: "Rafael, 27, dev. Quer resposta técnica certa em 30 segundos sobre liquidação e IR.",
    canal: "web",
    roteiro: [
      "Pedi resgate do CDB hoje às 16h10, cai quando?",
      "Meu CDB rendeu mais que a poupança no líquido?",
      "Qual a alíquota de IR se eu resgatar agora?",
    ],
  },
  camila: {
    idCliente: "C-0003",
    quem: "Camila, 41, empreendedora. Recebeu herança, nunca investiu, vai pedir recomendação.",
    canal: "whatsapp",
    roteiro: [
      "Recebi uma herança e não sei onde colocar. O que você me indica?",
      "Qual a diferença entre CDB e LCI?",
      "Quero falar com alguém de verdade",
    ],
  },
  anonimo: {
    idCliente: null,
    quem: "Visitante sem login. As tools da conta não enxergam nada.",
    canal: "web",
    roteiro: ["Como abro uma conta na Caqui?"],
  },
} as const satisfies Record<string, Persona>;

export type NomePersona = keyof typeof PERSONAS;
