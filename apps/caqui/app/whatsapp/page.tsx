import type { Enviar } from "@caqui/nucleo";
import { enviarMensagem } from "../acoes";
import { Esqueleto } from "../esqueleto";

const enviar: Enviar = enviarMensagem;

export default function PaginaWhatsapp() {
  return <Esqueleto canal="whatsapp" enviar={enviar} />;
}
