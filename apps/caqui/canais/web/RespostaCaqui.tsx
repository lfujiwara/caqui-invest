"use client";

import type { Fonte, Handoff, Interacao, Resposta } from "@caqui/nucleo";
import { useState } from "react";
import { ROTULO_FILA } from "./openui/componentes";
import { UiGerada } from "./openui/UiGerada";
import css from "./RespostaCaqui.module.css";

type AoEscolher = (texto: string) => void;

export function RespostaCaqui({
  resposta,
  ativa,
  aoEscolher,
}: {
  resposta: Resposta;
  /** Só a última resposta aceita cliques nas opções. */
  ativa: boolean;
  aoEscolher: AoEscolher;
}) {
  const seguranca = resposta.acao === "encaminhar_seguranca";
  return (
    <article className={css.resposta} data-seguranca={seguranca || undefined} role={seguranca ? "alert" : undefined}>
      {seguranca && (
        <p className={css.alertaTitulo}>
          <IconeAlerta />
          Pare agora. Isso pode ser golpe.
        </p>
      )}
      <Texto texto={resposta.texto} />
      {resposta.handoff && <CartaoHandoff handoff={resposta.handoff} />}
      {resposta.ui && <UiGerada ui={resposta.ui} />}
      {resposta.fontes.length > 0 && <Fontes fontes={resposta.fontes} />}
      {ativa && resposta.interacao && <Opcoes interacao={resposta.interacao} aoEscolher={aoEscolher} />}
    </article>
  );
}

function Texto({ texto }: { texto: string }) {
  return (
    <div className={css.texto}>
      {texto.split(/\n{2,}/).map((paragrafo, i) => (
        <p key={i}>{paragrafo}</p>
      ))}
    </div>
  );
}

const TITULO_HANDOFF = {
  atendimento: "Seu caso foi para o atendimento",
  seguranca: "A equipe de segurança já recebeu seu caso",
  especialista: "Seu pedido foi para um especialista",
} as const satisfies Record<Handoff["fila"], string>;

function CartaoHandoff({ handoff }: { handoff: Handoff }) {
  return (
    <section className={css.handoff} aria-label="Encaminhamento para uma pessoa">
      <h3 className={css.handoffTitulo}>{TITULO_HANDOFF[handoff.fila]}</h3>
      <p className={css.disponibilidade} data-disponivel={handoff.humanoDisponivel}>
        <span className={css.ponto} aria-hidden />
        {handoff.humanoDisponivel
          ? "Uma pessoa continua esta conversa em instantes."
          : `Agora não há atendimento por pessoa. Retorno previsto: ${handoff.retornoPrevisto ?? "a partir das 8h"}.`}
      </p>
      <dl className={css.ficha}>
        <div>
          <dt>Protocolo</dt>
          <dd className={css.protocolo}>
            {handoff.protocolo}
            <BotaoCopiar texto={handoff.protocolo} />
          </dd>
        </div>
        <div>
          <dt>Fila</dt>
          <dd>{ROTULO_FILA[handoff.fila]}</dd>
        </div>
      </dl>
      <div className={css.resumo}>
        <p className={css.resumoRotulo}>O que quem vai te atender já sabe</p>
        <p className={css.resumoTexto}>{handoff.resumo}</p>
      </div>
      <p className={css.semRepetir}>Você não precisa repetir nada. Quem atende vê esta conversa e o protocolo.</p>
    </section>
  );
}

function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className={css.copiar}
      onClick={async () => {
        await navigator.clipboard?.writeText(texto);
        setCopiado(true);
      }}
    >
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

function Fontes({ fontes }: { fontes: Fonte[] }) {
  return (
    <div className={css.fontes}>
      <p className={css.fontesRotulo}>De onde veio esta resposta</p>
      <ul className={css.chips}>
        {fontes.map((fonte, i) => (
          <li key={i} className={css.chip}>
            {fonte.tipo === "kb" ? (
              <>
                <span className={css.chipId}>{fonte.id}</span>
                {fonte.titulo}
              </>
            ) : (
              <>
                <span className={css.chipConta}>Dado da sua conta</span>
                {fonte.descricao}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Opcoes({ interacao, aoEscolher }: { interacao: Interacao; aoEscolher: AoEscolher }) {
  if (interacao.tipo === "botoes") {
    return (
      <div className={css.botoes} role="group" aria-label="Opções de resposta">
        {interacao.opcoes.map((opcao) => (
          <button key={opcao.id} type="button" className={css.opcao} onClick={() => aoEscolher(opcao.titulo)}>
            {opcao.titulo}
          </button>
        ))}
      </div>
    );
  }
  // No web a lista já vem aberta: um toque a menos do que no WhatsApp, onde `botao` abre o menu.
  return (
    <section className={css.lista} aria-label={interacao.botao}>
      <p className={css.listaRotulo}>{interacao.botao}</p>
      {interacao.secoes.map((secao) => (
        <div key={secao.titulo}>
          <p className={css.secaoTitulo}>{secao.titulo}</p>
          <ul className={css.linhas}>
            {secao.linhas.map((linha) => (
              <li key={linha.id}>
                <button type="button" className={css.linha} onClick={() => aoEscolher(linha.titulo)}>
                  <span className={css.linhaTitulo}>{linha.titulo}</span>
                  {linha.descricao && <span className={css.linhaDescricao}>{linha.descricao}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function IconeAlerta() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </svg>
  );
}
