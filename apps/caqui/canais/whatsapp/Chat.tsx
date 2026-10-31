import type { Enviar } from "@caqui/nucleo";
import { Simulador } from "./Simulador";

export function Chat({ enviar, idCliente = null }: { enviar: Enviar; idCliente?: string | null }) {
  return <Simulador enviar={enviar} idCliente={idCliente} />;
}
