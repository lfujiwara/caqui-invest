import { Chat } from "../../canais/whatsapp";
import { enviarMensagem } from "../acoes";

// A server action herda este limite. Modelo gratuito no OpenRouter pode levar dezenas de segundos.
export const maxDuration = 60;

export default function PaginaWhatsapp() {
  return <Chat enviar={enviarMensagem} />;
}
