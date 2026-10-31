import { Chat } from "../canais/web";
import { clienteDaUrl, opcoesDeCliente } from "../demo/clientes";
import { SeletorCliente } from "../demo/SeletorCliente";
import { enviarMensagem } from "./acoes";

// A server action herda este limite. Modelo gratuito no OpenRouter pode levar dezenas de segundos.
export const maxDuration = 60;

export default async function PaginaWeb({ searchParams }: PageProps<"/">) {
  const idCliente = await clienteDaUrl(searchParams);
  return (
    <>
      <SeletorCliente opcoes={opcoesDeCliente()} idCliente={idCliente} />
      {/* key: trocar de cliente começa uma conversa nova. */}
      <Chat key={idCliente} enviar={enviarMensagem} idCliente={idCliente} />
    </>
  );
}
