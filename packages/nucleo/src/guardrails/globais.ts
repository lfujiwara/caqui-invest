import type { Mensagem, MotivoId } from "../contrato";
import { fonteKb } from "../kb";
import type { Desvio, Encaminhamento, GuardrailEntrada, GuardrailSaida } from "./camadas";
import {
  citaOutroCliente,
  detectarGolpe,
  detectarVulneravel,
  excedeuPassos,
  pedeDadoDeTerceiro,
  pediuHumano,
} from "./entrada";
import { pedeSenha, verificarFontes } from "./saida";

const ultimoMotivo = (historico: readonly Mensagem[]): MotivoId =>
  historico.findLast((m) => m.autor === "caqui")?.resposta.motivo ?? "outros";

const paraSeguranca: Desvio = { tipo: "desviar", motivo: "acesso_seguranca" };

/** Camada global de entrada, antes do roteador e na ordem da lista: o primeiro que dispara decide. */
export const GLOBAIS_ENTRADA: readonly GuardrailEntrada<Encaminhamento | Desvio>[] = [
  { id: "golpe", checar: ({ req }) => (detectarGolpe(req.mensagem) ? paraSeguranca : null) },
  {
    id: "dado_de_terceiro",
    checar: ({ req, cliente }) =>
      pedeDadoDeTerceiro(req.mensagem, cliente) ? paraSeguranca : null,
  },
  {
    id: "pediu_humano",
    checar: ({ req }) =>
      pediuHumano(req.mensagem)
        ? {
            tipo: "encaminhar",
            fila: "atendimento",
            motivo: ultimoMotivo(req.historico),
            texto: "Claro, vou te passar para uma pessoa.",
          }
        : null,
  },
  {
    id: "limite_de_passos",
    checar: ({ req }) =>
      excedeuPassos(req.historico)
        ? {
            tipo: "encaminhar",
            fila: "atendimento",
            motivo: ultimoMotivo(req.historico),
            texto: "Para não te deixar dando voltas, vou te passar para uma pessoa.",
          }
        : null,
  },
  {
    id: "cliente_vulneravel",
    checar: ({ req, cliente }) =>
      detectarVulneravel(req.mensagem, cliente)
        ? {
            tipo: "encaminhar",
            fila: "atendimento",
            texto:
              "Quero te ajudar com calma. Para decidir sobre o seu dinheiro, você fala agora com uma pessoa do nosso time de atendentes, com prioridade. Não precisa decidir nada com pressa. Lembre: a Caqui só transfere para conta de mesma titularidade, nunca para a conta de outra pessoa.",
            fontes: [fonteKb("KB-028"), fonteKb("KB-018")],
          }
        : null,
  },
];

const semFonteConfiavel: Encaminhamento = {
  tipo: "encaminhar",
  fila: "atendimento",
  texto:
    "Não encontrei uma fonte confiável para responder isso com segurança, então prefiro não arriscar.",
};

/** Camada global de saída: roda sobre a resposta de toda fatia, depois dos guardrails dela. */
export const GLOBAIS_SAIDA: readonly GuardrailSaida[] = [
  {
    id: "fonte_nao_permitida",
    checar: (r, { kbs }) =>
      verificarFontes(r, kbs) === "fonte_nao_permitida" ? semFonteConfiavel : null,
  },
  {
    id: "factual_sem_fonte",
    checar: (r, { kbs }) =>
      verificarFontes(r, kbs) === "factual_sem_fonte" ? semFonteConfiavel : null,
  },
  {
    id: "pede_senha",
    checar: (r) =>
      pedeSenha(r.texto)
        ? {
            tipo: "encaminhar",
            fila: "seguranca",
            texto: "A Caqui nunca pede senha, código ou token. Não informe nada disso.",
          }
        : null,
  },
  {
    id: "dado_de_terceiro_na_saida",
    checar: (r, { cliente }) =>
      citaOutroCliente(r.texto, cliente)
        ? {
            tipo: "encaminhar",
            fila: "atendimento",
            texto: "Só posso mostrar dados da sua própria conta.",
          }
        : null,
  },
];
