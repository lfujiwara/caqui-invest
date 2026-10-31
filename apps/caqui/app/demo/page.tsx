import { casosDaDemo } from "../../demo/casos";
import { opcoesDeCliente } from "../../demo/clientes";
import { Demo } from "../../demo/Demo";
import { enviarMensagem } from "../acoes";

export const maxDuration = 60;

export default function PaginaDemo() {
  return <Demo opcoes={opcoesDeCliente()} casos={casosDaDemo()} enviar={enviarMensagem} />;
}
