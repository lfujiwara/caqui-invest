// Brasília não tem horário de verão desde 2019, então o fuso é fixo.
const FUSO_BRASILIA_MS = -3 * 60 * 60 * 1000;

// "Agora" nos dados do case.
export const DATA_SIMULADA = "2026-11-18";
export const HORAS_DA_DEMO = ["14:00", "23:00"] as const;

export function msDoMomento(data: string, hora: string): number {
  return Date.parse(`${data}T${hora}:00-03:00`);
}

export function momentoISO(ms: number): string {
  return `${new Date(ms + FUSO_BRASILIA_MS).toISOString().slice(0, 19)}-03:00`;
}

export function horaExibida(iso: string): string {
  return new Date(Date.parse(iso) + FUSO_BRASILIA_MS).toISOString().slice(11, 16);
}
