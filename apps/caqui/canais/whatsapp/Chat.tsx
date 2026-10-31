import type { Enviar } from "@caqui/nucleo";
import { Simulador } from "./Simulador";

export function Chat({ enviar }: { enviar: Enviar }) {
  return <Simulador enviar={enviar} />;
}
