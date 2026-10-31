"use client";

import { usePathname, useRouter } from "next/navigation";
import { type KeyboardEvent, useId, useMemo, useRef, useState } from "react";
import { buscarClientes, type OpcaoCliente } from "./busca";
import css from "./SeletorCliente.module.css";

/**
 * Controle da demo, fora do chat: escolhe quem está pedindo suporte. A escolha vai para
 * `?cliente=` e a página remonta o chat com o novo `idCliente`.
 */
export function SeletorCliente({
  opcoes,
  idCliente,
}: {
  opcoes: OpcaoCliente[];
  idCliente: string | null;
}) {
  const router = useRouter();
  const caminho = usePathname();
  const idLista = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [ativo, setAtivo] = useState(0);
  const atual = opcoes.find((o) => o.id === idCliente) ?? opcoes[0];
  const resultado = useMemo(() => buscarClientes(opcoes, busca), [opcoes, busca]);

  function escolher(opcao: OpcaoCliente) {
    setAberto(false);
    setBusca("");
    campo.current?.blur();
    router.replace(opcao.id ? `${caminho}?cliente=${opcao.id}` : caminho);
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setAberto(true);
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setAtivo((i) => (i + passo + resultado.length) % Math.max(resultado.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opcao = resultado[ativo];
      if (aberto && opcao) escolher(opcao);
    } else if (e.key === "Escape") {
      setAberto(false);
      setBusca("");
    }
  }

  return (
    <div className={css.barra}>
      <span className={css.selo}>Demo</span>
      <label className={css.rotulo} htmlFor={`${idLista}-campo`}>
        Cliente pedindo suporte
      </label>
      <div className={css.caixa}>
        <input
          ref={campo}
          id={`${idLista}-campo`}
          className={css.campo}
          role="combobox"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={aberto && resultado[ativo] ? `${idLista}-${ativo}` : undefined}
          autoComplete="off"
          placeholder={atual ? `${atual.nome}${atual.id ? ` · ${atual.id}` : ""}` : ""}
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setAtivo(0);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setAberto(false)}
          onKeyDown={aoTeclar}
        />
        {aberto && (
          <div id={idLista} className={css.lista} role="listbox">
            {resultado.length === 0 && <div className={css.vazio}>Ninguém parecido.</div>}
            {resultado.map((opcao, i) => (
              <div
                key={opcao.id ?? "anonimo"}
                id={`${idLista}-${i}`}
                role="option"
                tabIndex={-1}
                aria-selected={i === ativo}
                className={css.opcao}
                data-atual={opcao.id === idCliente}
                // mousedown antes do blur do campo, senão a lista fecha antes do clique.
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(opcao);
                }}
                onMouseEnter={() => setAtivo(i)}
              >
                <span className={css.nome}>{opcao.nome}</span>
                <span className={css.detalhe}>
                  {opcao.id ? `${opcao.id} · ` : ""}
                  {opcao.detalhe}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
