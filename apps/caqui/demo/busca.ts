export type OpcaoCliente = { id: string | null; nome: string; detalhe: string };

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[-,]/g, " ")
    .trim();

export function levenshtein(a: string, b: string): number {
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      const troca = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        (anterior[j] ?? 0) + 1,
        (atual[j - 1] ?? 0) + 1,
        (anterior[j - 1] ?? 0) + troca,
      );
    }
    anterior = atual;
  }
  return anterior[b.length] ?? 0;
}

/**
 * Menor distância entre a busca e o texto que começa em cada palavra do id ou do nome, para que "rafa" ache
 * "Rafael Okada" e "camla" ache "Camila". Busca vazia devolve tudo na ordem original.
 */
export function buscarClientes(opcoes: readonly OpcaoCliente[], busca: string): OpcaoCliente[] {
  const q = normalizar(busca);
  if (!q) return [...opcoes];
  const tolerancia = Math.floor(q.length / 3);
  return opcoes
    .map((opcao) => {
      // Só id e nome. "C-0003" vira "c 0003", então "0003" também acha.
      const palavras = normalizar(`${opcao.id ?? ""} ${opcao.nome}`).split(/\s+/);
      // Texto a partir de cada palavra, para a busca casar com "marta siq" ou "c 0003".
      const alvos = palavras.map((_, i) => palavras.slice(i).join(" "));
      // Prefixos de um a mais e um a menos absorvem letra faltando ou sobrando no fim.
      const prefixos = alvos.flatMap((p) => [-1, 0, 1].map((d) => p.slice(0, q.length + d)));
      const distancia = Math.min(...prefixos.map((p) => levenshtein(q, p)));
      return { opcao, distancia };
    })
    .filter((r) => r.distancia <= tolerancia)
    .sort((a, b) => a.distancia - b.distancia)
    .map((r) => r.opcao);
}
