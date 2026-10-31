import type { Mensagem } from "../contrato";
import { type Cliente, clientes } from "../dados";

// Fronteira por dígito, não \b: "CPF12345678901" e o "\n" escapado no JSON do trace grudam letra no CPF.
const CPF = /(?<!\d)(\d{3})[.\s]?(\d{3})[.\s]?(\d{3})[-\s]?(\d{2})(?!\d)/g;

/** Regra 10: CPF sempre mascarado, no mesmo formato de clientes.json (***.***.894-**). */
export function mascararCpf(texto: string): string {
  return texto.replace(CPF, (_, _a, _b, c) => `***.***.${c}-**`);
}

// Uma linha só, minúscula e sem acento. Sem isso, "pedindo\no código" escapa do `.*`, "c-0042" do
// id e "Fabio" do nome "Fábio".
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ");

const SINAIS_DE_GOLPE = [
  /\b(c[oó]digo|sms|token|senha)\b.*\b(pediu|pedindo|pediram|passar|mandar|confirmar)\b/,
  /\b(pediu|pedindo|pediram|passar|mandar)\b.*\b(c[oó]digo|sms|token|senha)\b/,
  /\b(suporte|acesso) remoto\b|\banydesk\b|\bteamviewer\b/,
  /\bpix de teste\b|\b(transfer[eê]ncia|pix)\b.*\bpra n[aã]o bloquear\b/,
  /\bgerente\b.*\b(ligou|liga[cç][aã]o)\b.*\b(c[oó]digo|senha|transfer)/,
];

/** Regra 5: sinal de golpe em qualquer ponto da mensagem, mesmo no meio de outra pergunta. */
export function detectarGolpe(texto: string): boolean {
  const t = normalizar(texto);
  return SINAIS_DE_GOLPE.some((r) => r.test(t));
}

/**
 * Regras 10 e 11: pedido de dado de outra pessoa (id de outro cliente, nome de outro cliente
 * ou listagem em massa). O texto do cliente é dado: nenhum "modo administrador" muda isso.
 */
export function pedeDadoDeTerceiro(texto: string, cliente: Cliente | null): boolean {
  const t = normalizar(texto);
  const outroId = [...t.matchAll(/\bc-\d{4}\b/g)].some(([id]) => id !== cliente?.id.toLowerCase());
  const outroNome = clientes().some((c) => c.id !== cliente?.id && t.includes(normalizar(c.nome)));
  const emMassa = /\b(cpfs|saldos|dados)\b.*\b(dos|de outros|de todos os) clientes\b/.test(t);
  return outroId || outroNome || emMassa;
}

const TERCEIRO_PRESSIONANDO =
  /\b(sobrinh[oa]|filh[oa]|net[oa]|genro|nora|vizinh[oa])\b.*\b(mandou|pediu|disse|dizendo|mandando|do meu lado|quer que eu)\b/;
const CONFUSAO = /\bn[aã]o (estou|t[oô]) entendendo\b|\bn[aã]o entendo nada\b|\bconfus[ao]\b/;
const RESGATE_TOTAL =
  /\b(todo o|todo meu|tudo)\b.*\b(dinheiro|saldo|resgat|tirar|sacar|passar)\b|\bresgate total\b/;

/** Regra 6: terceiro pressionando, ou pessoa idosa confusa ou pedindo resgate total. */
export function detectarVulneravel(texto: string, cliente: Cliente | null): boolean {
  const t = normalizar(texto);
  if (TERCEIRO_PRESSIONANDO.test(t)) return true;
  const idosa = (cliente?.idade ?? 0) >= 60;
  return idosa && (CONFUSAO.test(t) || RESGATE_TOTAL.test(t));
}

/** Regra 8: a saída para humano vale em qualquer passo, sem menu intermediário. */
export function pediuHumano(texto: string): boolean {
  return /\b(falar|conversar) com (uma |um )?(pessoa|atendente|humano)\b|^\s*atendente\s*$|\bquero (um )?atendente\b/i.test(
    texto,
  );
}

export const PASSOS_MAXIMOS = 5;

/** Regra 8: no máximo cinco respostas da Caqui antes de entregar a um humano. */
export function excedeuPassos(historico: readonly Mensagem[]): boolean {
  return historico.filter((m) => m.autor === "caqui").length >= PASSOS_MAXIMOS;
}

/**
 * Regra 8: quantas das últimas respostas da Caqui foram "não entendi" seguidas.
 * Uma resposta de `outros` sem fonte é o fallback de quando o pedido não foi entendido.
 */
export function respostasSemEntender(historico: readonly Mensagem[]): number {
  let n = 0;
  for (const m of [...historico].reverse()) {
    if (m.autor === "cliente") continue;
    const r = m.resposta;
    if (r.motivo !== "outros" || r.acao !== "responder" || r.fontes.length > 0) break;
    n++;
  }
  return n;
}
