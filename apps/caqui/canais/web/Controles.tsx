"use client";

import { useState } from "react";
import css from "./Controles.module.css";
import { MOMENTOS_SIMULADOS, type MomentoSimulado } from "./momento";
import { SUGESTOES } from "./sugestoes";

export function BotaoHumano({
  disponivel,
  desabilitado,
  aoClicar,
}: {
  disponivel: boolean;
  desabilitado: boolean;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      className={css.humano}
      disabled={desabilitado}
      onClick={aoClicar}
      data-disponivel={disponivel}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
      Falar com uma pessoa
    </button>
  );
}

export function AvisoHorario({ disponivel }: { disponivel: boolean }) {
  return (
    <p className={css.aviso} data-disponivel={disponivel}>
      <span className={css.ponto} aria-hidden />
      {disponivel
        ? "Pessoas atendendo agora, das 8h às 20h, todos os dias."
        : "Sem atendimento por pessoa agora. Registramos um protocolo e retornamos a partir das 8h. Segurança atende a qualquer hora."}
    </p>
  );
}

export function Vazio({ aoEscolher }: { aoEscolher: (texto: string) => void }) {
  return (
    <section className={css.vazio}>
      <h1 className={css.saudacao}>Olá! Como podemos ajudar?</h1>
      <p className={css.convite}>
        Escreva do seu jeito ou toque em um assunto. Se preferir, fale com uma pessoa a qualquer
        momento.
      </p>
      <ul className={css.sugestoes}>
        {Object.entries(SUGESTOES).map(([motivo, { assunto, pergunta }]) => (
          <li key={motivo}>
            <button type="button" className={css.sugestao} onClick={() => aoEscolher(pergunta)}>
              <span className={css.assunto}>{assunto}</span>
              <span className={css.pergunta}>{pergunta}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Digitando() {
  return (
    <p className={css.digitando} role="status">
      Escrevendo a resposta…
    </p>
  );
}

export function ErroEnvio({ aoTentar }: { aoTentar: () => void }) {
  return (
    <div className={css.erro} role="alert">
      <p>Não conseguimos enviar sua mensagem. Confira sua internet e tente de novo.</p>
      <button type="button" className={css.secundario} onClick={aoTentar}>
        Tentar de novo
      </button>
    </div>
  );
}

export function Composer({
  desabilitado,
  aoEnviar,
}: {
  desabilitado: boolean;
  aoEnviar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState("");
  function enviar() {
    if (!texto.trim() || desabilitado) return;
    aoEnviar(texto);
    setTexto("");
  }
  return (
    <form
      className={css.composer}
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <label htmlFor="caqui-mensagem" className={css.oculto}>
        Sua mensagem
      </label>
      <textarea
        id="caqui-mensagem"
        className={css.campo}
        rows={1}
        placeholder="Escreva sua mensagem"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviar();
          }
        }}
      />
      <button
        type="submit"
        className={css.enviar}
        disabled={desabilitado || !texto.trim()}
        aria-label="Enviar"
        aria-busy={desabilitado}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </form>
  );
}

export function SeletorMomento({
  valor,
  aoMudar,
}: {
  valor: MomentoSimulado;
  aoMudar: (m: MomentoSimulado) => void;
}) {
  return (
    <label className={css.momento}>
      Momento (demo)
      <select value={valor} onChange={(e) => aoMudar(e.target.value as MomentoSimulado)}>
        {Object.entries(MOMENTOS_SIMULADOS).map(([id, { rotulo }]) => (
          <option key={id} value={id}>
            {rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}
