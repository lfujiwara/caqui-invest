"use client";

import type { Enviar, Mensagem } from "@caqui/nucleo";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AvisoHorario, BotaoHumano, Composer, Digitando, ErroEnvio, SeletorMomento, Vazio } from "./Controles";
import { humanoNoHorario, momentoDe, type MomentoSimulado } from "./momento";
import { RespostaCaqui } from "./RespostaCaqui";
import css from "./Conversa.module.css";

const PEDIDO_HUMANO = "Quero falar com uma pessoa";

/** Mensagem do cliente que ainda não entrou no histórico: a caminho ou recusada pela rede. */
type Pendente = { texto: string; falhou: boolean } | null;

export function Conversa({
  enviar,
  idCliente,
  children: marca,
}: {
  enviar: Enviar;
  idCliente: string | null;
  children: ReactNode;
}) {
  const [historico, setHistorico] = useState<Mensagem[]>([]);
  const [pendente, setPendente] = useState<Pendente>(null);
  const [simulado, setSimulado] = useState<MomentoSimulado>("real");
  const enviando = pendente !== null && !pendente.falhou;
  const ultimoRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ultimoRef.current?.scrollIntoView({ block: "start", behavior: reduzir ? "auto" : "smooth" });
  }, [historico.length, pendente]);

  async function enviarTexto(texto: string) {
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;
    const momento = momentoDe(simulado);
    setPendente({ texto: mensagem, falhou: false });
    try {
      const resposta = await enviar({ canal: "web", mensagem, historico, idCliente, momento });
      setHistorico((h) => [
        ...h,
        { autor: "cliente", texto: mensagem, em: momento },
        { autor: "caqui", resposta, em: momentoDe(simulado) },
      ]);
      setPendente(null);
    } catch (erro) {
      console.error("[caqui/web] falha ao enviar mensagem", erro);
      setPendente({ texto: mensagem, falhou: true });
    }
  }

  const disponivel = humanoNoHorario(momentoDe(simulado));
  const vazia = historico.length === 0 && pendente === null;

  return (
    <div className={css.conversa}>
      <header className={css.topo}>
        <div className={css.barra}>
          {marca}
          <BotaoHumano disponivel={disponivel} desabilitado={enviando} aoClicar={() => enviarTexto(PEDIDO_HUMANO)} />
        </div>
        <AvisoHorario disponivel={disponivel} />
      </header>

      <main className={css.mensagens}>
        {vazia ? (
          <Vazio aoEscolher={enviarTexto} />
        ) : (
          <ol className={css.lista} aria-live="polite" aria-label="Conversa">
            {historico.map((m, i) => {
              const ultimo = i === historico.length - 1 && pendente === null;
              return (
                <li key={i} ref={ultimo ? ultimoRef : undefined} className={css.item} data-autor={m.autor}>
                  {m.autor === "cliente" ? (
                    <p className={css.balao}>{m.texto}</p>
                  ) : (
                    <RespostaCaqui resposta={m.resposta} ativa={ultimo} aoEscolher={enviarTexto} />
                  )}
                </li>
              );
            })}
            {pendente && (
              <li ref={ultimoRef} className={css.item} data-autor="cliente">
                <p className={css.balao} data-falhou={pendente.falhou || undefined}>
                  {pendente.texto}
                </p>
                {pendente.falhou ? <ErroEnvio aoTentar={() => enviarTexto(pendente.texto)} /> : <Digitando />}
              </li>
            )}
          </ol>
        )}
      </main>

      <footer className={css.rodape}>
        <Composer desabilitado={enviando} aoEnviar={enviarTexto} />
        <SeletorMomento valor={simulado} aoMudar={setSimulado} />
      </footer>
    </div>
  );
}
