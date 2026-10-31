import { lerDoRepo } from "@caqui/nucleo";
import { PERSONAS } from "../../../ferramentas/personas";

/** Um case da demo: o que a pessoa manda, quem é e o que se espera do atendimento. */
export type Caso = {
  id: string;
  mensagens: string[];
  idCliente: string | null;
  momento: string | null;
  esperado: string | null;
  acao: string | null;
  regra: string | null;
};

type PerguntaTeste = {
  id: string;
  regra: number | string;
  contexto: { id_cliente?: string; momento?: string };
  pergunta: string;
  resposta_esperada: string;
  acao_esperada: string;
};

/** Roteiros das personas (ferramentas/personas.ts) e as perguntas de dados/perguntas_teste.jsonl. */
export function casosDaDemo(): Caso[] {
  const roteiros = Object.entries(PERSONAS).flatMap(([nome, p]): Caso[] => [
    {
      id: `${nome}-roteiro`,
      mensagens: [...p.roteiro],
      idCliente: p.idCliente,
      momento: null,
      esperado: p.quem,
      acao: null,
      regra: "roteiro completo",
    },
    ...p.roteiro.map((mensagem, i) => ({
      id: `${nome}-${i + 1}`,
      mensagens: [mensagem],
      idCliente: p.idCliente,
      momento: null,
      esperado: null,
      acao: null,
      regra: "persona",
    })),
  ]);
  const perguntas = lerDoRepo("dados/perguntas_teste.jsonl")
    .trim()
    .split(/\r?\n/)
    .map((linha): Caso => {
      const p = JSON.parse(linha) as PerguntaTeste;
      return {
        id: p.id,
        // PT-27 junta três mensagens seguidas com " | ".
        mensagens: p.pergunta.split(" | "),
        idCliente: p.contexto.id_cliente ?? null,
        momento: p.contexto.momento ?? null,
        esperado: p.resposta_esperada,
        acao: p.acao_esperada,
        regra: `regra ${p.regra}`,
      };
    });
  return [...roteiros, ...perguntas];
}
