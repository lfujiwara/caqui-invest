// O Brasil não tem horário de verão desde 2019, então Brasília é sempre -03:00.
const FUSO_BRASILIA = "-03:00";

export const MOMENTOS_SIMULADOS = {
  real: { rotulo: "Relógio real", iso: null },
  dados_10h: { rotulo: "18/11 · 10h (agora dos dados)", iso: `2026-11-18T10:00${FUSO_BRASILIA}` },
  tarde_14h: { rotulo: "18/11 · 14h", iso: `2026-11-18T14:00${FUSO_BRASILIA}` },
  noite_23h: { rotulo: "18/11 · 23h", iso: `2026-11-18T23:00${FUSO_BRASILIA}` },
} as const satisfies Record<string, { rotulo: string; iso: string | null }>;

export type MomentoSimulado = keyof typeof MOMENTOS_SIMULADOS;

function agoraEmBrasilia(agora: Date): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(agora)
      .map((p) => [p.type, p.value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}${FUSO_BRASILIA}`;
}

/** ISO 8601 com fuso de Brasília, ex. 2026-11-18T10:00-03:00. */
export function momentoDe(simulado: MomentoSimulado, agora = new Date()): string {
  return MOMENTOS_SIMULADOS[simulado].iso ?? agoraEmBrasilia(agora);
}

/**
 * Só uma dica visual para o botão de humano. Quem decide o encaminhamento
 * e o prazo de retorno é o núcleo, na resposta.
 */
export function humanoNoHorario(momento: string): boolean {
  const hora = Number(momento.slice(11, 13));
  return hora >= 8 && hora < 20;
}

const DATA_E_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `retornoPrevisto` chega do núcleo em ISO 8601 e vira "qua., 25/11 às 20h". Texto livre passa igual. */
export function formatarRetorno(retorno: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(retorno)) return retorno;
  const data = new Date(retorno);
  if (Number.isNaN(data.getTime())) return retorno;
  const p = Object.fromEntries(DATA_E_HORA.formatToParts(data).map((x) => [x.type, x.value]));
  const minutos = p.minute === "00" ? "" : p.minute;
  return `${p.weekday}, ${p.day}/${p.month} às ${Number(p.hour)}h${minutos}`;
}
