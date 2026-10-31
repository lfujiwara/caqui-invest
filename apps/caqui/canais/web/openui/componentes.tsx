import { createLibrary, type ComponentRenderer } from "@openuidev/react-lang";
import { definicoes, RAIZ, type NomeComponente, type PropsDe } from "./biblioteca";
import css from "./componentes.module.css";

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percentual = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export const ROTULO_FILA = {
  atendimento: "Atendimento",
  seguranca: "Segurança",
  especialista: "Especialista em investimentos",
} as const satisfies Record<PropsDe<"CartaoProtocolo">["fila"], string>;

const ROTULO_ESTADO = {
  concluida: "Concluída",
  atual: "Agora",
  prevista: "Prevista",
} as const satisfies Record<PropsDe<"Etapa">["estado"], string>;

export function Timeline({ titulo, etapas, nota }: PropsDe<"Timeline">) {
  return (
    <section className={css.cartao} aria-label={titulo}>
      <h3 className={css.titulo}>{titulo}</h3>
      <ol className={css.etapas}>
        {etapas.map(({ props: etapa }, i) => (
          <li key={i} className={css.etapa} data-estado={etapa.estado}>
            <span className={css.marcador} aria-hidden />
            <div>
              <p className={css.etapaRotulo}>
                {etapa.rotulo}
                <span className={css.etapaEstado}>{ROTULO_ESTADO[etapa.estado]}</span>
              </p>
              <p className={css.etapaQuando}>{etapa.quando}</p>
              {etapa.detalhe && <p className={css.etapaDetalhe}>{etapa.detalhe}</p>}
            </div>
          </li>
        ))}
      </ol>
      {nota && <p className={css.nota}>{nota}</p>}
    </section>
  );
}

export function Comparativo({ titulo, valorAplicado, periodo, itens }: PropsDe<"Comparativo">) {
  const maior = Math.max(...itens.map((i) => i.props.rendimentoLiquido), 0.01);
  return (
    <section className={css.cartao} aria-label={titulo}>
      <h3 className={css.titulo}>{titulo}</h3>
      <p className={css.subtitulo}>
        Valor aplicado <span className={css.numero}>{reais.format(valorAplicado)}</span> · {periodo}
      </p>
      <ul className={css.comparados}>
        {itens.map(({ props: item }, i) => (
          <li key={i} className={css.comparado}>
            <p className={css.comparadoProduto}>{item.produto}</p>
            <div className={css.barra} aria-hidden>
              <span style={{ width: `${Math.max(4, (item.rendimentoLiquido / maior) * 100)}%` }} />
            </div>
            <dl className={css.valores}>
              <div>
                <dt>Rendimento bruto</dt>
                <dd className={css.numero}>{reais.format(item.rendimentoBruto)}</dd>
              </div>
              <div>
                <dt>Imposto de renda</dt>
                <dd className={css.numero}>
                  {item.impostoRenda === 0 ? "Isento" : `− ${reais.format(item.impostoRenda)}`}
                </dd>
              </div>
              <div className={css.liquido}>
                <dt>Você recebe</dt>
                <dd className={css.numero}>{reais.format(item.rendimentoLiquido)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <p className={css.nota}>Comparação entre valores líquidos, depois do imposto. Não é uma recomendação.</p>
    </section>
  );
}

export function CartaoProtocolo({ protocolo, fila, situacao, prazo }: PropsDe<"CartaoProtocolo">) {
  return (
    <section className={css.cartao} aria-label={`Protocolo ${protocolo}`}>
      <p className={css.rotuloPequeno}>Protocolo</p>
      <p className={css.protocolo}>{protocolo}</p>
      <dl className={css.ficha}>
        <div>
          <dt>Fila</dt>
          <dd>{ROTULO_FILA[fila]}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>{situacao}</dd>
        </div>
        {prazo && (
          <div>
            <dt>Prazo</dt>
            <dd>{prazo}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export function TabelaIR({ titulo, faixas, nota }: PropsDe<"TabelaIR">) {
  return (
    <section className={css.cartao} aria-label={titulo}>
      <h3 className={css.titulo}>{titulo}</h3>
      <table className={css.tabela}>
        <thead>
          <tr>
            <th scope="col">Tempo aplicado</th>
            <th scope="col">Imposto sobre o rendimento</th>
          </tr>
        </thead>
        <tbody>
          {faixas.map(({ props: faixa }, i) => (
            <tr key={i} data-atual={faixa.atual || undefined}>
              <th scope="row">
                {faixa.prazo}
                {faixa.atual && <span className={css.selo}>Sua aplicação</span>}
              </th>
              <td className={css.numero}>{percentual.format(faixa.aliquota)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {nota && <p className={css.nota}>{nota}</p>}
    </section>
  );
}

const nada = () => null;

// O tipo obriga um visual para cada componente da biblioteca: ela continua fechada.
const visuais: { [N in NomeComponente]: ComponentRenderer<PropsDe<N>> } = {
  Painel: ({ props, renderNode }) => <div className={css.painel}>{renderNode(props.blocos)}</div>,
  Timeline: ({ props }) => <Timeline {...props} />,
  Comparativo: ({ props }) => <Comparativo {...props} />,
  CartaoProtocolo: ({ props }) => <CartaoProtocolo {...props} />,
  TabelaIR: ({ props }) => <TabelaIR {...props} />,
  // Subcomponentes são desenhados pelo pai, que lê as props deles.
  Etapa: nada,
  ItemComparado: nada,
  FaixaIR: nada,
};

export const bibliotecaReact = createLibrary({
  components: (Object.keys(definicoes) as NomeComponente[]).map((nome) => ({
    ...definicoes[nome],
    component: visuais[nome],
  })),
  root: RAIZ,
});
