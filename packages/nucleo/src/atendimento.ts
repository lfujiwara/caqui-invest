import { createHash } from "node:crypto";
import { emSaoPaulo, formatarData, somarDiasCorridos } from "./calendario";
import type { ChatRequest, Fila, Fonte, MotivoId, Resposta } from "./contrato";
import { fonteKb } from "./kb";

const ABRE = 8 * 60;
const FECHA = 20 * 60;

/** Regra 12: humano das 8h às 20h em São Paulo, todos os dias. Segurança atende 24h. */
export function humanoDisponivel(momento: string, fila: Fila): boolean {
  if (fila === "seguranca") return true;
  const { minutos } = emSaoPaulo(momento);
  return minutos >= ABRE && minutos < FECHA;
}

// São Paulo não tem horário de verão desde 2019, então o fuso é fixo em -03:00.
function proximaAbertura(momento: string): string {
  const { data, minutos } = emSaoPaulo(momento);
  const dia = minutos < ABRE ? data : somarDiasCorridos(data, 1);
  return `${dia}T08:00:00-03:00`;
}

/** Protocolo determinístico: a mesma conversa no mesmo instante gera o mesmo número. */
export function gerarProtocolo(req: ChatRequest, fila: Fila): string {
  const { data } = emSaoPaulo(req.momento);
  const hash = createHash("sha256")
    .update(`${req.momento}|${req.idCliente}|${req.mensagem}|${fila}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  return `CAQ-${data.replaceAll("-", "")}-${hash}`;
}

const ACAO_DA_FILA = {
  atendimento: "encaminhar_humano",
  seguranca: "encaminhar_seguranca",
  especialista: "encaminhar_especialista",
} as const satisfies Record<Fila, Resposta["acao"]>;

const FONTE_DA_FILA = { atendimento: "KB-025", seguranca: "KB-020", especialista: "KB-029" };

/** Artigos que qualquer encaminhamento pode citar, além dos da fatia. */
export const KBS_DO_ENCAMINHAMENTO: readonly string[] = Object.values(FONTE_DA_FILA);

// Regra 5 do "vale para qualquer caminho": quem recebe vê o histórico e não pede para repetir.
function resumir(req: ChatRequest, motivo: MotivoId): string {
  const anteriores = req.historico
    .filter((m) => m.autor === "cliente")
    .map((m) => `"${m.texto}"`)
    .join(", ");
  const antes = anteriores ? ` Antes disso: ${anteriores}.` : "";
  return `Motivo: ${motivo}. Última mensagem do cliente: "${req.mensagem}".${antes}`;
}

/**
 * Monta a Resposta de encaminhamento. A ação sai da fila, e o texto diz se há pessoa agora
 * ou quando ela retorna. `retornoPrevisto` explícito vale para demandas com prazo (reclamação).
 */
export function encaminhar(args: {
  req: ChatRequest;
  motivo: MotivoId;
  fila: Fila;
  texto: string;
  fontes?: Fonte[];
  retornoPrevisto?: string;
}): Resposta {
  const { req, fila } = args;
  const protocolo = gerarProtocolo(req, fila);
  const disponivel = humanoDisponivel(req.momento, fila);
  const abertura = proximaAbertura(req.momento);
  const retornoPrevisto = args.retornoPrevisto ?? (disponivel ? null : abertura);
  const quem = {
    atendimento: "Uma pessoa do nosso atendimento",
    seguranca: "A equipe de segurança, que atende a qualquer hora e sem fila,",
    especialista: "Um especialista em investimentos",
  }[fila];
  const situacao = disponivel
    ? `${quem} continua com você agora, já com o histórico desta conversa. Protocolo ${protocolo}.`
    : `Nosso atendimento por pessoa funciona das 8h às 20h, todos os dias. Registrei sua demanda no protocolo ${protocolo} e uma pessoa retorna a partir das 8h de ${formatarData(abertura.slice(0, 10))}, sem você precisar repetir nada.`;
  return {
    acao: ACAO_DA_FILA[fila],
    motivo: args.motivo,
    texto: `${args.texto}\n\n${situacao}`,
    fontes: [...(args.fontes ?? []), fonteKb(FONTE_DA_FILA[fila])],
    interacao: null,
    ui: null,
    handoff: {
      protocolo,
      fila,
      humanoDisponivel: disponivel,
      retornoPrevisto,
      resumo: resumir(req, args.motivo),
    },
  };
}
