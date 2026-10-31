import { calendario } from "./dados";

/** Data civil no formato AAAA-MM-DD. */
export type Data = string;

const FUSO = "America/Sao_Paulo";
const MS_DIA = 86_400_000;

const formatoSaoPaulo = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Data e minutos desde a meia-noite em São Paulo, para um instante ISO com fuso. */
export function emSaoPaulo(momento: string): { data: Data; minutos: number } {
  const partes = Object.fromEntries(
    formatoSaoPaulo.formatToParts(new Date(momento)).map((p) => [p.type, p.value]),
  );
  return {
    data: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  };
}

const paraMs = (data: Data) => Date.parse(`${data}T00:00:00Z`);
const deMs = (ms: number): Data => new Date(ms).toISOString().slice(0, 10);

export function somarDiasCorridos(data: Data, dias: number): Data {
  return deMs(paraMs(data) + dias * MS_DIA);
}

export function diasCorridos(de: Data, ate: Data): number {
  return Math.round((paraMs(ate) - paraMs(de)) / MS_DIA);
}

export function ehDiaUtil(data: Data): boolean {
  const util = calendario().diaUtil.get(data);
  if (util === undefined) throw new RangeError(`${data} está fora do calendário da Caqui`);
  return util;
}

export function proximoDiaUtil(data: Data): Data {
  let d = somarDiasCorridos(data, 1);
  while (!ehDiaUtil(d)) d = somarDiasCorridos(d, 1);
  return d;
}

export function ajustarParaDiaUtil(data: Data): Data {
  return ehDiaUtil(data) ? data : proximoDiaUtil(data);
}

export function somarDiasUteis(data: Data, dias: number): Data {
  let d = data;
  for (let i = 0; i < dias; i++) d = proximoDiaUtil(d);
  return d;
}

/** Regra 1: pedido até o corte (16h) de dia útil conta no mesmo dia; senão, no próximo dia útil. */
export function diaBase(pedidoEm: string): Data {
  const { data, minutos } = emSaoPaulo(pedidoEm);
  return ehDiaUtil(data) && minutos <= calendario().corteMinutos ? data : proximoDiaUtil(data);
}

export function feriado(data: Data): string | null {
  return calendario().feriado.get(data) ?? null;
}

export function formatarData(data: Data): string {
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}
