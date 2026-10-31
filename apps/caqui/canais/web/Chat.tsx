import type { Enviar } from "@caqui/nucleo";
import { Conversa } from "./Conversa";
import css from "./Chat.module.css";
import tokens from "./tokens.module.css";

/** Canal web da Caqui Invest. `enviar` é a server action que fala com o núcleo. */
export function Chat({ enviar, idCliente = null }: { enviar: Enviar; idCliente?: string | null }) {
  return (
    <div className={tokens.tema}>
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
        <path d="M16 6c-2-3-6-3-8-2 2 3 5 4 8 2Zm0 0c2-3 6-3 8-2-2 3-5 4-8 2Z" fill="var(--cq-folha)" />
      </svg>
      <span>
        Caqui <span className={css.invest}>Invest</span>
      </span>
    </p>
  );
}
