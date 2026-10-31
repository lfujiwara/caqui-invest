import type { Enviar } from "@caqui/nucleo";
import { enviarMensagem } from "./acoes";
import { Esqueleto } from "./esqueleto";

const enviar: Enviar = enviarMensagem;

export default function PaginaWeb() {
  return <Esqueleto canal="web" enviar={enviar} />;
}
