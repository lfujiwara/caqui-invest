import type {
  Encaminhamento,
  GuardrailEntrada,
  GuardrailSaida,
  GuardrailsDoMotivo,
} from "./camadas";
import { PEDIDO_DE_RECOMENDACAO, respostasSemEntender } from "./entrada";
import { recomenda } from "./saida";

export const TEXTO_SEM_RECOMENDACAO =
  "Eu não indico onde investir: isso depende do seu perfil e dos seus objetivos, e só um especialista em investimentos pode avaliar. Posso explicar como cada produto funciona, por exemplo liquidez, garantia do FGC e imposto de renda. Para uma orientação personalizada, vou te encaminhar para um especialista, que atende com agendamento.";

const paraEspecialista: Encaminhamento = {
  tipo: "encaminhar",
  fila: "especialista",
  motivo: "pedido_recomendacao",
  texto: TEXTO_SEM_RECOMENDACAO,
};

/** Regra 4 na entrada da fatia: o roteador mandou para cá um pedido de recomendação. */
export const pedidoDeRecomendacao: GuardrailEntrada = {
  id: "pedido_de_recomendacao",
  checar: ({ req }) => (PEDIDO_DE_RECOMENDACAO.test(req.mensagem) ? paraEspecialista : null),
};

/** Regra 4 na saída da fatia: o modelo cedeu e indicou produto. */
export const semRecomendacao: GuardrailSaida = {
  id: "sem_recomendacao",
  checar: (r) => (recomenda(r.texto) ? paraEspecialista : null),
};

/** Regra 8: depois de duas respostas sem entender, oferece pessoa. */
export const semEntender: GuardrailEntrada = {
  id: "sem_entender",
  checar: ({ req }) =>
    respostasSemEntender(req.historico) >= 2
      ? {
          tipo: "encaminhar",
          fila: "atendimento",
          texto: "Ainda não consegui entender o que você precisa. Vou te passar para uma pessoa.",
        }
      : null,
};

/** O par de toda fatia com LLM: o roteador pode errar a fatia e o modelo pode ceder. */
export const GUARDRAILS_DE_FATIA_COM_LLM: GuardrailsDoMotivo = {
  entrada: [pedidoDeRecomendacao],
  saida: [semRecomendacao],
};

export const SEM_GUARDRAILS_PROPRIOS: GuardrailsDoMotivo = { entrada: [], saida: [] };
