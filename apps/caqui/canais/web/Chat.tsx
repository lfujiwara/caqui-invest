import type { Enviar } from "@caqui/nucleo";
import { JetBrains_Mono, Newsreader, Source_Sans_3 } from "next/font/google";
import css from "./Chat.module.css";
import { Conversa } from "./Conversa";
import tokens from "./tokens.module.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--cq-fonte-sans", display: "swap" });
const serifa = Newsreader({
  subsets: ["latin"],
  variable: "--cq-fonte-newsreader",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--cq-fonte-jetbrains",
  display: "swap",
});

/** Canal web da Caqui Invest. `enviar` é a server action que fala com o núcleo. */
export function Chat({ enviar, idCliente = null }: { enviar: Enviar; idCliente?: string | null }) {
  return (
    <div className={`${tokens.tema} ${sans.variable} ${serifa.variable} ${mono.variable}`}>
      <Conversa enviar={enviar} idCliente={idCliente}>
        <Marca />
      </Conversa>
    </div>
  );
}

function Marca() {
  return (
    <p className={css.marca}>
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden>
        <circle cx="16" cy="18" r="12" fill="var(--cq-caqui)" />
        <path
          d="M16 6c-2-3-6-3-8-2 2 3 5 4 8 2Zm0 0c2-3 6-3 8-2-2 3-5 4-8 2Z"
          fill="var(--cq-folha)"
        />
      </svg>
      <span>
        Caqui <span className={css.invest}>Invest</span>
      </span>
    </p>
  );
}
