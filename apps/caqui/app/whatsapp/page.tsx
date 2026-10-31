import { Chat } from "../../canais/whatsapp";
import { enviarMensagem } from "../acoes";

export default function PaginaWhatsapp() {
  return <Chat enviar={enviarMensagem} />;
}
