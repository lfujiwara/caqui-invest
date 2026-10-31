import { Chat } from "../canais/web";
import { enviarMensagem } from "./acoes";

// A server action herda este limite. Modelo gratuito no OpenRouter pode levar dezenas de segundos.
export const maxDuration = 60;

export default function PaginaWeb() {
  return <Chat enviar={enviarMensagem} />;
}
