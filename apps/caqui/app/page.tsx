import { Chat } from "../canais/web";
import { enviarMensagem } from "./acoes";

export default function PaginaWeb() {
  return <Chat enviar={enviarMensagem} />;
}
