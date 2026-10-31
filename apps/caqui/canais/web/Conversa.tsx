"use client";

import type { Enviar, Mensagem, Resposta } from "@caqui/nucleo";
import { Fragment, type ReactNode, useState } from "react";
import {
  AvisoHorario,
  BotaoHumano,
  Composer,
  Digitando,
  ErroEnvio,
  SeletorMomento,
  Vazio,
} from "./Controles";
import css from "./Conversa.module.css";
import { humanoNoHorario, type MomentoSimulado, momentoDe } from "./momento";
import { RespostaCaqui } from "./RespostaCaqui";

const PEDIDO_HUMANO = "Quero falar com uma pessoa";

/** Mensagem do cliente que ainda não entrou no histórico: a caminho ou recusada pela rede. */
type Pendente = { texto: string; falhou: boolean } | null;

/** Uma pergunta e a resposta dela. `id` é a ordem de chegada: a conversa só cresce. */
type Troca = {
  id: number;
  pergunta: string;
  resposta: Resposta;
  perguntaEm: string;
  respostaEm: string;
};

const paraHistorico = (trocas: readonly Troca[]): Mensagem[] =>
  trocas.flatMap((t) => [
    { autor: "cliente", texto: t.pergunta, em: t.perguntaEm },
    { autor: "caqui", resposta: t.resposta, em: t.respostaEm },
  ]);

// Ref estável: o React só a chama quando o último item da conversa muda de elemento.
function rolarAte(ultimo: HTMLLIElement | null) {
  if (!ultimo) return;
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ultimo.scrollIntoView({ block: "start", behavior: reduzir ? "auto" : "smooth" });
}

export function Conversa({
  enviar,
  idCliente,
  children: marca,
}: {
  enviar: Enviar;
  idCliente: string | null;
  children: ReactNode;
}) {
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [pendente, setPendente] = useState<Pendente>(null);
  const [simulado, setSimulado] = useState<MomentoSimulado>("real");
  const enviando = pendente !== null && !pendente.falhou;

  async function enviarTexto(texto: string) {
    const mensagem = texto.trim();
    if (!mensagem || enviando) return;
    const momento = momentoDe(simulado);
    setPendente({ texto: mensagem, falhou: false });
    try {
      const historico = paraHistorico(trocas);
      const resposta = await enviar({ canal: "web", mensagem, historico, idCliente, momento });
      const respostaEm = momentoDe(simulado);
      const kbs = resposta.fontes.flatMap((f) => (f.tipo === "kb" ? [`${f.id} ${f.titulo}`] : []));
      if (kbs.length) console.info("[caqui/web] fontes da KB", kbs);
      setTrocas((ts) => [
        ...ts,
        { id: ts.length, pergunta: mensagem, resposta, perguntaEm: momento, respostaEm },
      ]);
      setPendente(null);
    } catch (erro) {
      console.error("[caqui/web] falha ao enviar mensagem", erro);
      setPendente({ texto: mensagem, falhou: true });
    }
  }

  const disponivel = humanoNoHorario(momentoDe(simulado));
  const vazia = trocas.length === 0 && pendente === null;

  return (
    <div className={css.conversa}>
      <header className={css.topo}>
        <div className={css.barra}>
          {marca}
          <BotaoHumano
            disponivel={disponivel}
            desabilitado={enviando}
            aoClicar={() => enviarTexto(PEDIDO_HUMANO)}
          />
        </div>
        <AvisoHorario disponivel={disponivel} />
      </header>

      <main className={css.mensagens}>
        {vazia ? (
          <Vazio aoEscolher={enviarTexto} />
        ) : (
          <ol className={css.lista} aria-live="polite" aria-label="Conversa">
            {trocas.map((troca) => {
              const ultima = troca.id === trocas.length - 1 && pendente === null;
              return (
                <Fragment key={troca.id}>
                  <li className={css.item} data-autor="cliente">
                    <p className={css.balao}>{troca.pergunta}</p>
                  </li>
                  <li ref={ultima ? rolarAte : undefined} className={css.item} data-autor="caqui">
                    <RespostaCaqui
                      resposta={troca.resposta}
                      ativa={ultima}
                      aoEscolher={enviarTexto}
                    />
                  </li>
                </Fragment>
              );
            })}
            {pendente && (
              <li ref={rolarAte} className={css.item} data-autor="cliente">
                <p className={css.balao} data-falhou={pendente.falhou || undefined}>
                  {pendente.texto}
                </p>
                {pendente.falhou ? (
                  <ErroEnvio aoTentar={() => enviarTexto(pendente.texto)} />
                ) : (
                  <Digitando />
                )}
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
