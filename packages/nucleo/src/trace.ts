import type { Canal, MotivoId, Resposta } from "./contrato";
import { mascararCpf } from "./guardrails/entrada";

export type Trace = {
  momento: string;
  canal: Canal;
  idCliente: string | null;
  mensagem: string;
  motivo: MotivoId;
  acao: Resposta["acao"];
  protocolo: string | null;
  guardrails: string[];
  erro: string | null;
};

export type Registrar = (trace: Trace) => void;

/** Uma linha JSON por atendimento. O CPF é mascarado de novo na linha inteira (regra 10). */
export function linhaDeTrace(trace: Trace): string {
  return mascararCpf(JSON.stringify({ evento: "atendimento", ...trace }));
}

export const registrarNoConsole: Registrar = (trace) => console.log(linhaDeTrace(trace));
