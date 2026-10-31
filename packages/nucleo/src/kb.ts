import type { Fonte } from "./contrato";
import { artigosBrutos } from "./dados";

export type Artigo = { id: string; titulo: string; revisadoEm: string; texto: string };

// KB-007 foi substituído pelo KB-006 (corte das 16h). Nunca pode ser citado.
export const KB_OBSOLETAS: ReadonlySet<string> = new Set(["KB-007"]);

function lerArtigo(bruto: string): Artigo {
  const [, cabecalho = "", corpo = ""] = bruto.split(/^---$/m);
  const campo = (nome: string) => {
    const valor = cabecalho.match(new RegExp(`^${nome}:\\s*(.+)$`, "m"))?.[1]?.trim();
    if (!valor) throw new Error(`artigo sem ${nome}: ${bruto.slice(0, 60)}`);
    return valor;
  };
  const texto = corpo.replace(/^#.*$/m, "").replace(/\*\*/g, "").trim();
  return { id: campo("id"), titulo: campo("titulo"), revisadoEm: campo("revisado_em"), texto };
}

let artigos: Map<string, Artigo> | undefined;

export function artigosKb(): ReadonlyMap<string, Artigo> {
  artigos ??= new Map(
    artigosBrutos()
      .map(lerArtigo)
      .map((a) => [a.id, a]),
  );
  return artigos;
}

export function artigo(id: string): Artigo {
  const a = artigosKb().get(id);
  if (!a) throw new Error(`artigo inexistente: ${id}`);
  return a;
}

export function fonteKb(id: string): Fonte {
  return { tipo: "kb", id, titulo: artigo(id).titulo };
}

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

// Radical de 5 letras: "resgate"/"resgatei" e "cripto"/"criptomoedas" casam sem um stemmer.
const termos = (s: string) =>
  new Set(
    normalizar(s)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3)
      .map((t) => t.slice(0, 5)),
  );

/**
 * Busca por termos com peso IDF entre os artigos permitidos; no empate, ganha quem tem mais termos no título.
 * Artigos obsoletos nunca voltam.
 * Devolve do mais relevante para o menos; artigo sem nenhum termo em comum fica de fora.
 */
export function buscarKb(consulta: string, permitidos: readonly string[], limite = 3): Artigo[] {
  const todos = [...artigosKb().values()].filter((a) => !KB_OBSOLETAS.has(a.id));
  const termosPorArtigo = new Map(todos.map((a) => [a.id, termos(`${a.titulo} ${a.texto}`)]));
  const df = (t: string) => todos.filter((a) => termosPorArtigo.get(a.id)?.has(t)).length;
  const daConsulta = [...termos(consulta)];
  return todos
    .filter((a) => permitidos.includes(a.id))
    .map((a) => {
      const doArtigo = termosPorArtigo.get(a.id) ?? new Set<string>();
      const doTitulo = termos(a.titulo);
      const pontos = daConsulta
        .filter((t) => doArtigo.has(t))
        .reduce((soma, t) => soma + Math.log(todos.length / df(t)), 0);
      const noTitulo = daConsulta.filter((t) => doTitulo.has(t)).length;
      return { a, pontos, noTitulo };
    })
    .filter(({ pontos }) => pontos > 0)
    .sort((x, y) => y.pontos - x.pontos || y.noTitulo - x.noTitulo)
    .slice(0, limite)
    .map(({ a }) => a);
}
