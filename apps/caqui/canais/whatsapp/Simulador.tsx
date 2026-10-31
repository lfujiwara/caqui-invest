"use client";

import type { Enviar, Mensagem } from "@caqui/nucleo";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { TextoWhatsApp } from "./formatacao";
import * as Icone from "./icones";
import { type MensagemWhatsApp, paraWhatsApp, type SecaoLista } from "./limites";
import {
  DATA_SIMULADA,
  HORAS_DA_DEMO,
  horaExibida,
  horaValida,
  mascararHora,
  momentoISO,
  msDoMomento,
} from "./momento";
import { PainelCortes, type Rodada } from "./PainelCortes";
import estilos from "./Simulador.module.css";

// Sem uma pausa mínima, a resposta de uma fixture chega antes de o "digitando..." aparecer.
const ESPERA_ENTREGUE_MS = 450;
const ESPERA_MINIMA_DIGITANDO_MS = 900;

type Fase = "ocioso" | "entregue" | "digitando";
type Relogio = { hora: string; base: number; desde: number };

// `id` vem da posição no histórico, que só cresce: é estável entre renderizações.
type Conteudo = { id: string } & (
  | { lado: "cliente"; texto: string; em: string; lida: boolean }
  | { lado: "caqui"; mensagem: MensagemWhatsApp; em: string }
);
type Item = Conteudo & { comCauda: boolean };

export function Simulador({ enviar }: { enviar: Enviar }) {
  const [historico, setHistorico] = useState<Mensagem[]>([]);
  const [fase, setFase] = useState<Fase>("ocioso");
  const [rascunho, setRascunho] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [relogio, setRelogio] = useState<Relogio>(() => novoRelogio(HORAS_DA_DEMO[0]));
  const [horaDigitada, setHoraDigitada] = useState<string>(HORAS_DA_DEMO[0]);
  const [, setPulso] = useState(0);
  const [listaAberta, setListaAberta] = useState<{ botao: string; secoes: SecaoLista[] } | null>(
    null,
  );
  const [painelAberto, setPainelAberto] = useState(false);

  const agora = () => momentoISO(relogio.base + (Date.now() - relogio.desde));

  useEffect(() => {
    const intervalo = setInterval(() => setPulso((n) => n + 1), 15_000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(min-width: 900px)").matches) setPainelAberto(true);
  }, []);

  const temLista = listaAberta !== null;
  useEffect(() => {
    if (!temLista) return;
    const fecharComEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setListaAberta(null);
    };
    document.addEventListener("keydown", fecharComEsc);
    return () => document.removeEventListener("keydown", fecharComEsc);
  }, [temLista]);

  const { itens, rodadas } = useMemo(() => montarConversa(historico, fase), [historico, fase]);
  const totalDeCortes = rodadas.reduce((n, r) => n + r.cortes.length, 0);

  async function mandar(texto: string) {
    const mensagem = texto.trim();
    if (!mensagem || fase !== "ocioso") return;
    const em = agora();
    const anterior = historico;
    setErro(null);
    setRascunho("");
    setListaAberta(null);
    setHistorico([...anterior, { autor: "cliente", texto: mensagem, em }]);
    setFase("entregue");
    const digitando = setTimeout(() => setFase("digitando"), ESPERA_ENTREGUE_MS);
    try {
      const [resposta] = await Promise.all([
        enviar({ canal: "whatsapp", mensagem, historico: anterior, idCliente: null, momento: em }),
        new Promise((pronto) =>
          setTimeout(pronto, ESPERA_ENTREGUE_MS + ESPERA_MINIMA_DIGITANDO_MS),
        ),
      ]);
      setHistorico([
        ...anterior,
        { autor: "cliente", texto: mensagem, em },
        { autor: "caqui", resposta, em: agora() },
      ]);
    } catch {
      setHistorico(anterior);
      setRascunho(mensagem);
      setErro("A mensagem não foi entregue. Tente de novo.");
    } finally {
      clearTimeout(digitando);
      setFase("ocioso");
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    void mandar(rascunho);
  }

  function escolherHora(hora: string) {
    setHoraDigitada(hora);
    if (horaValida(hora)) setRelogio(novoRelogio(hora));
  }

  const ocupado = fase !== "ocioso";

  return (
    <div className={estilos.pagina}>
      <aside className={estilos.lateral}>
        <h1 className={estilos.titulo}>Caqui no WhatsApp (simulador)</h1>
        <p className={estilos.subtitulo}>
          O mesmo atendimento num canal fechado: só texto simples, até 3 botões e listas. O que não
          cabe é cortado ou adaptado.
        </p>

        <fieldset className={estilos.momento}>
          <legend>Momento simulado</legend>
          <div className={estilos.momentoLinha}>
            <span className={estilos.momentoData}>qua, 18/11/2026</span>
            <fieldset className={estilos.segmentos} aria-label="Horário">
              {HORAS_DA_DEMO.map((hora) => (
                <button
                  key={hora}
                  type="button"
                  className={relogio.hora === hora ? estilos.segmentoAtivo : estilos.segmento}
                  aria-pressed={relogio.hora === hora}
                  onClick={() => escolherHora(hora)}
                >
                  {hora}
                </button>
              ))}
              {/* Texto com máscara em vez de type="time", que segue o locale e mostraria 11:00 PM. */}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                placeholder="hh:mm"
                className={estilos.horaLivre}
                aria-label="Outro horário, de 00:00 a 23:59"
                aria-invalid={!horaValida(horaDigitada)}
                value={horaDigitada}
                onChange={(e) => escolherHora(mascararHora(e.target.value))}
              />
            </fieldset>
          </div>
          <p className={estilos.momentoNota}>
            {foraDoHorarioHumano(relogio.hora)
              ? "Fora do horário humano (8h às 20h): handoff vira protocolo com prazo de retorno."
              : "Dentro do horário humano (8h às 20h): handoff vai para uma pessoa."}
          </p>
        </fieldset>

        <details
          className={estilos.painel}
          open={painelAberto}
          onToggle={(e) => setPainelAberto(e.currentTarget.open)}
        >
          <summary>
            O que o canal cortou
            <span className={totalDeCortes > 0 ? estilos.contadorAtivo : estilos.contador}>
              {totalDeCortes}
            </span>
          </summary>
          <div className={estilos.painelCorpo}>
            <PainelCortes rodadas={rodadas} />
          </div>
        </details>
      </aside>

      <div className={estilos.telefone}>
        <div className={estilos.tela}>
          <div className={estilos.barraDeStatus} aria-hidden>
            <span suppressHydrationWarning>{horaExibida(agora())}</span>
            <span className={estilos.ilha} />
            <span className={estilos.sinais}>
              <i />
              <i />
              <i />
              <b />
            </span>
          </div>

          <header className={estilos.cabecalho}>
            <Icone.Voltar className={estilos.iconeCabecalho} />
            <Icone.Caqui className={estilos.avatar} />
            <div className={estilos.contato}>
              <span className={estilos.nomeContato}>
                Caqui Invest <Icone.Verificado />
              </span>
              <span className={estilos.statusContato} aria-live="polite">
                {fase === "digitando" ? "digitando..." : "Conta comercial"}
              </span>
            </div>
            <Icone.Menu className={estilos.iconeCabecalho} />
          </header>

          <div className={estilos.conversa}>
            <div className={estilos.dia}>
              <span>Hoje</span>
            </div>
            <div className={estilos.avisoCanal}>
              <Icone.Cadeado /> Esta é uma conta comercial. Esta conversa é um simulador com dados
              fictícios.
            </div>

            {itens.map((item) => (
              <Bolha
                key={item.id}
                item={item}
                desativado={ocupado}
                aoEscolher={mandar}
                aoAbrirLista={setListaAberta}
              />
            ))}

            {fase === "digitando" && (
              <div className={`${estilos.linhaCaqui} ${estilos.comCauda}`}>
                <div className={`${estilos.bolhaCaqui} ${estilos.digitando}`} aria-hidden>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
            {erro && <div className={estilos.erro}>{erro}</div>}
            {/* Remonta a cada mensagem ou mudança de fase e rola a conversa até o fim. */}
            <div key={`${itens.length}-${fase}`} ref={rolarAteAqui} />
          </div>

          <form className={estilos.compositor} onSubmit={aoEnviar}>
            <input
              className={estilos.campo}
              placeholder="Mensagem"
              aria-label="Mensagem"
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
            />
            <button
              className={estilos.botaoEnviar}
              type="submit"
              disabled={ocupado || rascunho.trim() === ""}
              aria-label="Enviar"
            >
              <Icone.Enviar />
            </button>
          </form>

          {listaAberta && (
            <div className={estilos.vela}>
              <button
                type="button"
                className={estilos.velaFundo}
                aria-label="Fechar lista"
                tabIndex={-1}
                onClick={() => setListaAberta(null)}
              />
              <div
                className={estilos.folha}
                role="dialog"
                aria-modal
                aria-label={listaAberta.botao}
              >
                <div className={estilos.folhaTopo}>
                  <button
                    type="button"
                    className={estilos.fecharFolha}
                    onClick={() => setListaAberta(null)}
                    aria-label="Fechar"
                  >
                    ×
                  </button>
                  <span>{listaAberta.botao}</span>
                </div>
                {listaAberta.secoes.map((secao) => (
                  <section key={secao.linhas.map((l) => l.id).join()}>
                    {secao.titulo && <h3 className={estilos.secaoTitulo}>{secao.titulo}</h3>}
                    {secao.linhas.map((linha) => (
                      <button
                        key={linha.id}
                        type="button"
                        className={estilos.linhaLista}
                        disabled={ocupado}
                        onClick={() => void mandar(linha.titulo)}
                      >
                        <span className={estilos.linhaTitulo}>{linha.titulo}</span>
                        {linha.descricao && (
                          <span className={estilos.linhaDescricao}>{linha.descricao}</span>
                        )}
                        <span className={estilos.radio} aria-hidden />
                      </button>
                    ))}
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function rolarAteAqui(fim: HTMLDivElement | null) {
  fim?.scrollIntoView({ block: "end" });
}

function Bolha({
  item,
  desativado,
  aoEscolher,
  aoAbrirLista,
}: {
  item: Item;
  desativado: boolean;
  aoEscolher: (texto: string) => void;
  aoAbrirLista: (lista: { botao: string; secoes: SecaoLista[] }) => void;
}) {
  const cauda = item.comCauda ? estilos.comCauda : "";
  if (item.lado === "cliente") {
    return (
      <div className={`${estilos.linhaCliente} ${cauda}`}>
        <div className={estilos.bolhaCliente}>
          <TextoWhatsApp texto={item.texto} />
          <span className={estilos.meta}>
            {horaExibida(item.em)} <Icone.Ticks lida={item.lida} />
          </span>
        </div>
      </div>
    );
  }

  const m = item.mensagem;
  const hora = <span className={estilos.meta}>{horaExibida(item.em)}</span>;
  switch (m.tipo) {
    case "sistema":
      return (
        <div className={estilos.sistema}>
          <TextoWhatsApp texto={m.texto} />
        </div>
      );
    case "texto":
      return (
        <div className={`${estilos.linhaCaqui} ${cauda}`}>
          <div className={estilos.bolhaCaqui}>
            <TextoWhatsApp texto={m.texto} />
            {hora}
          </div>
        </div>
      );
    case "botoes":
      return (
        <div className={`${estilos.linhaCaqui} ${cauda}`}>
          <div className={estilos.interativo}>
            <div className={estilos.bolhaCaqui}>
              <TextoWhatsApp texto={m.corpo} />
              {hora}
            </div>
            {m.opcoes.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                className={estilos.botaoResposta}
                disabled={desativado}
                onClick={() => aoEscolher(opcao.titulo)}
              >
                <Icone.Responder /> {opcao.titulo}
              </button>
            ))}
          </div>
        </div>
      );
    case "lista":
      return (
        <div className={`${estilos.linhaCaqui} ${cauda}`}>
          <div className={estilos.interativo}>
            <div className={estilos.bolhaCaqui}>
              <TextoWhatsApp texto={m.corpo} />
              {hora}
              <button
                type="button"
                className={estilos.botaoLista}
                disabled={desativado}
                onClick={() => aoAbrirLista({ botao: m.botao, secoes: m.secoes })}
              >
                <Icone.Lista /> {m.botao}
              </button>
            </div>
          </div>
        </div>
      );
  }
}

function montarConversa(historico: Mensagem[], fase: Fase): { itens: Item[]; rodadas: Rodada[] } {
  const itens: Item[] = [];
  const rodadas: Rodada[] = [];
  let pergunta = "";
  let ladoAnterior: string | null = null;
  const adicionar = (item: Conteudo) => {
    const lado = item.lado === "caqui" && item.mensagem.tipo === "sistema" ? "sistema" : item.lado;
    itens.push({ ...item, comCauda: lado !== ladoAnterior });
    ladoAnterior = lado;
  };
  historico.forEach((mensagem, i) => {
    if (mensagem.autor === "cliente") {
      pergunta = mensagem.texto;
      const ultima = i === historico.length - 1;
      adicionar({
        id: `${i}`,
        lado: "cliente",
        texto: mensagem.texto,
        em: mensagem.em,
        lida: !(ultima && fase === "entregue"),
      });
      return;
    }
    const mensagens = paraWhatsApp(mensagem.resposta);
    mensagens.forEach((m, j) => {
      adicionar({ id: `${i}.${j}`, lado: "caqui", mensagem: m, em: mensagem.em });
    });
    rodadas.push({
      id: `${i}`,
      pergunta,
      motivo: mensagem.resposta.motivo,
      hora: horaExibida(mensagem.em),
      cortes: mensagens.flatMap((m, j) => m.cortes.map((corte, k) => ({ id: `${j}.${k}`, corte }))),
    });
  });
  return { itens, rodadas };
}

function novoRelogio(hora: string): Relogio {
  return { hora, base: msDoMomento(DATA_SIMULADA, hora), desde: Date.now() };
}

function foraDoHorarioHumano(hora: string): boolean {
  const h = Number(hora.slice(0, 2));
  return h < 8 || h >= 20;
}
