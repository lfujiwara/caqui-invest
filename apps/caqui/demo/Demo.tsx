"use client";

import type { Enviar } from "@caqui/nucleo";
import { useState } from "react";
import { Chat } from "../canais/web";
import type { OpcaoCliente } from "./busca";
import type { Caso } from "./casos";
import css from "./Demo.module.css";

/** Palco da demo: personas à esquerda, o chat num celular no meio e os cases à direita. */
export function Demo({
  opcoes,
  casos,
  enviar,
}: {
  opcoes: OpcaoCliente[];
  casos: Caso[];
  enviar: Enviar;
}) {
  const [idCliente, setIdCliente] = useState<string | null>("C-0001");
  const [caso, setCaso] = useState<Caso | null>(null);
  // Cada simulação remonta o chat com uma conversa nova.
  const [rodada, setRodada] = useState(0);

  const comCasos = new Set(casos.map((c) => c.idCliente));
  const destaques = opcoes.filter((o) => comCasos.has(o.id));
  const atual = opcoes.find((o) => o.id === idCliente) ?? opcoes[0];
  const doCliente = casos.filter((c) => c.idCliente !== null && c.idCliente === idCliente);
  const gerais = casos.filter((c) => c.idCliente === null);

  function trocarCliente(id: string | null) {
    setIdCliente(id);
    setCaso(null);
    setRodada((r) => r + 1);
  }

  function simular(c: Caso) {
    if (c.idCliente !== null) setIdCliente(c.idCliente);
    setCaso(c);
    setRodada((r) => r + 1);
  }

  return (
    <div className={css.palco}>
      <aside className={css.painel}>
        <h2 className={css.titulo}>
          <span className={css.selo}>Demo</span> Quem pede suporte
        </h2>
        <ul className={css.lista}>
          {destaques.map((o) => (
            <li key={o.id ?? "anonimo"}>
              <button
                type="button"
                className={css.pessoa}
                aria-pressed={o.id === idCliente}
                onClick={() => trocarCliente(o.id)}
              >
                <span className={css.nome}>{o.nome}</span>
                <span className={css.detalhe}>
                  {o.id ? `${o.id} · ` : ""}
                  {o.detalhe}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <label className={css.outro}>
          Outro cliente
          <select value={idCliente ?? ""} onChange={(e) => trocarCliente(e.target.value || null)}>
            {opcoes.map((o) => (
              <option key={o.id ?? "anonimo"} value={o.id ?? ""}>
                {o.id ? `${o.id} · ` : ""}
                {o.nome}
              </option>
            ))}
          </select>
        </label>
      </aside>

      <main className={css.centro}>
        <p className={css.legenda}>
          {atual?.nome}
          {caso ? ` · ${caso.id}` : ""}
          {caso?.momento ? ` · ${caso.momento.slice(0, 16).replace("T", " ")}` : ""}
        </p>
        <div className={css.celular}>
          <div className={css.tela}>
            <Chat
              key={`${idCliente}-${rodada}`}
              enviar={enviar}
              idCliente={idCliente}
              roteiro={caso?.mensagens}
              momentoFixo={caso?.momento ?? undefined}
            />
          </div>
        </div>
        <button type="button" className={css.limpar} onClick={() => trocarCliente(idCliente)}>
          Nova conversa
        </button>
      </main>

      <aside className={css.painel}>
        <Casos titulo={`Cases de ${atual?.nome ?? "?"}`} casos={doCliente} aoSimular={simular} />
        <Casos titulo="Qualquer cliente" casos={gerais} aoSimular={simular} />
      </aside>
    </div>
  );
}

function Casos({
  titulo,
  casos,
  aoSimular,
}: {
  titulo: string;
  casos: Caso[];
  aoSimular: (c: Caso) => void;
}) {
  if (casos.length === 0) return null;
  return (
    <section>
      <h2 className={css.titulo}>{titulo}</h2>
      <ul className={css.lista}>
        {casos.map((c) => (
          <li key={c.id}>
            <details className={css.caso}>
              <summary>
                <span className={css.etiqueta}>{c.regra}</span>
                <span className={css.pergunta}>{c.mensagens.join(" → ")}</span>
              </summary>
              <dl className={css.ficha}>
                {c.esperado && (
                  <>
                    <dt>Esperado</dt>
                    <dd>{c.esperado}</dd>
                  </>
                )}
                {c.acao && (
                  <>
                    <dt>Ação</dt>
                    <dd>{c.acao}</dd>
                  </>
                )}
                {c.momento && (
                  <>
                    <dt>Momento</dt>
                    <dd>{c.momento}</dd>
                  </>
                )}
                <dt>Id</dt>
                <dd>{c.id}</dd>
              </dl>
              <button type="button" className={css.simular} onClick={() => aoSimular(c)}>
                Simular no chat
              </button>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
