import type { ReactNode } from "react";

const MARCAS = /```([\s\S]+?)```|\*([^*\n]+?)\*|_([^_\n]+?)_|~([^~\n]+?)~/g;
const FRONTEIRA = /[\s\p{P}]/u;

// Como no app: a marca só vale se não estiver colada numa palavra ("arquivo_v2_final" não vira itálico).
function ehFronteira(texto: string, i: number): boolean {
  return i < 0 || i >= texto.length || FRONTEIRA.test(texto[i]);
}

export function TextoWhatsApp({ texto }: { texto: string }): ReactNode {
  return renderizar(texto);
}

function renderizar(texto: string): ReactNode[] {
  const nos: ReactNode[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(MARCAS)) {
    const inicio = m.index;
    const fim = inicio + m[0].length;
    if (!ehFronteira(texto, inicio - 1) || !ehFronteira(texto, fim)) continue;
    const [, mono, negrito, italico, riscado] = m;
    const interno = mono ?? negrito ?? italico ?? riscado;
    if (interno.trim() !== interno) continue;
    nos.push(texto.slice(ultimo, inicio));
    if (mono !== undefined) nos.push(<code key={inicio}>{mono}</code>);
    else if (negrito !== undefined) nos.push(<strong key={inicio}>{renderizar(negrito)}</strong>);
    else if (italico !== undefined) nos.push(<em key={inicio}>{renderizar(italico)}</em>);
    else nos.push(<s key={inicio}>{renderizar(riscado)}</s>);
    ultimo = fim;
  }
  nos.push(texto.slice(ultimo));
  return nos;
}
