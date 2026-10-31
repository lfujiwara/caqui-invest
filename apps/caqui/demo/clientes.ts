import { clientePorId, lerDoRepo } from "@caqui/nucleo";
import type { OpcaoCliente } from "./busca";

type ClienteDoArquivo = { id: string; nome: string; idade: number; cidade: string; uf: string };

/** Opções do seletor da demo: o visitante anônimo e os clientes de dados/clientes.json. */
export function opcoesDeCliente(): OpcaoCliente[] {
  const clientes = JSON.parse(lerDoRepo("dados/clientes.json")) as ClienteDoArquivo[];
  return [
    { id: null, nome: "Anônimo", detalhe: "sem login" },
    ...clientes.map((c) => ({
      id: c.id,
      nome: c.nome,
      detalhe: `${c.idade} anos, ${c.cidade}/${c.uf}`,
    })),
  ];
}

/** `?cliente=` vem da URL: só vale se existir em clientes.json. */
export async function clienteDaUrl(
  params: Promise<Record<string, string | string[] | undefined>>,
): Promise<string | null> {
  const { cliente } = await params;
  return typeof cliente === "string" ? (clientePorId(cliente)?.id ?? null) : null;
}
