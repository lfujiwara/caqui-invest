import { type Data, diasCorridos } from "./calendario";
import { type Produto, taxas } from "./dados";

/** Regra 2: alíquota do IR regressivo pelos dias corridos de aplicação (taxas.json). */
export function aliquotaIr(dias: number): number {
  for (const faixa of taxas().ir_regressivo) {
    if (faixa.ate_dias !== undefined && dias <= faixa.ate_dias) return faixa.aliquota;
    if (faixa.acima_de_dias !== undefined && dias > faixa.acima_de_dias) return faixa.aliquota;
  }
  throw new RangeError(`sem faixa de IR para ${dias} dias`);
}

export type Tributacao = {
  dias: number;
  aliquota: number;
  rendimentoBruto: number;
  ir: number;
  rendimentoLiquido: number;
};

/** O IR incide só sobre o rendimento. LCI, LCA e poupança são isentas para pessoa física. */
export function tributar(args: {
  produto: Pick<Produto, "tributavel">;
  aplicadoEm: Data;
  resgateEm: Data;
  rendimentoBruto: number;
}): Tributacao {
  const dias = diasCorridos(args.aplicadoEm, args.resgateEm);
  const aliquota = args.produto.tributavel ? aliquotaIr(dias) : 0;
  const ir = arredondar(args.rendimentoBruto * aliquota);
  return {
    dias,
    aliquota,
    rendimentoBruto: arredondar(args.rendimentoBruto),
    ir,
    rendimentoLiquido: arredondar(args.rendimentoBruto - ir),
  };
}

/** Convenção do desafio (taxas.json): (1 + poupanca_am)^(dias/30) - 1, isenta de IR. */
export function rendimentoPoupanca(valor: number, dias: number): number {
  return arredondar(valor * ((1 + taxas().poupanca_am) ** (dias / 30) - 1));
}

export const arredondar = (n: number) => Math.round(n * 100) / 100;

const brl = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatarBrl = (n: number) => `R$ ${brl.format(n)}`;
export const formatarPct = (n: number) =>
  `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(n * 100)}%`;
