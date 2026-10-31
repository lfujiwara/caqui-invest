import type { MotivoId } from "@caqui/nucleo";
import {
  LIMITE_CORPO_INTERATIVO,
  LIMITE_TEXTO,
  MAX_BOTOES,
  MAX_LINHAS_LISTA,
  type Corte,
} from "./limites";
import estilos from "./Simulador.module.css";

export type Rodada = { pergunta: string; motivo: MotivoId; hora: string; cortes: Corte[] };

const NOME_DO_MOTIVO: Record<MotivoId, string> = {
  onde_esta_meu_dinheiro: "Onde está meu dinheiro",
  duvida_produto: "Dúvida de produto",
  rentabilidade_extrato: "Rentabilidade e extrato",
  acesso_seguranca: "Acesso e segurança",
  impostos_documentos: "Impostos e documentos",
  pedido_recomendacao: "Pedido de recomendação",
  reclamacao_cancelamento: "Reclamação ou cancelamento",
  outros: "Outros",
};

type Descricao = { titulo: string; detalhe: string; perda: boolean; codigo?: string };

function descrever(corte: Corte): Descricao {
  switch (corte.tipo) {
    case "ui_descartada":
      return {
        titulo: "Componente rico descartado",
        detalhe: "A versão web mostraria este componente. O canal só tem texto, botões e listas.",
        perda: true,
        codigo: corte.trecho,
      };
    case "formatacao_convertida":
      return { titulo: "Formatação convertida", detalhe: corte.detalhes.join(", "), perda: false };
    case "texto_dividido":
      return {
        titulo: `Texto dividido em ${corte.partes} mensagens`,
        detalhe: `${corte.caracteres} caracteres, e cada mensagem aceita ${LIMITE_TEXTO}.`,
        perda: false,
      };
    case "corpo_separado":
      return {
        titulo: "Texto saiu do corpo interativo",
        detalhe: `${corte.caracteres} caracteres não cabem nos ${LIMITE_CORPO_INTERATIVO} do corpo com botões ou lista. O texto foi antes, numa mensagem comum.`,
        perda: false,
      };
    case "botoes_viraram_lista":
      return {
        titulo: `${corte.quantidade} botões viraram lista`,
        detalhe: `O canal aceita até ${MAX_BOTOES} botões de resposta.`,
        perda: false,
      };
    case "opcoes_cortadas":
      return {
        titulo: `${corte.descartadas.length} ${corte.descartadas.length === 1 ? "opção cortada" : "opções cortadas"}`,
        detalhe: `A lista aceita até ${MAX_LINHAS_LISTA} linhas. Ficaram de fora: ${corte.descartadas.join(", ")}.`,
        perda: true,
      };
    case "encurtado":
      return { titulo: "Texto encurtado", detalhe: `"${corte.original}" virou "${corte.exibido}"`, perda: true };
  }
}

export function PainelCortes({ rodadas }: { rodadas: Rodada[] }) {
  if (rodadas.length === 0) {
    return <p className={estilos.painelVazio}>Mande uma mensagem. Cada resposta da Caqui aparece aqui com o que o canal teve de cortar ou adaptar.</p>;
  }
  return (
    <ol className={estilos.rodadas}>
      {rodadas.map((rodada, i) => (
        <li key={i} className={estilos.rodada}>
          <div className={estilos.rodadaTopo}>
            <span className={estilos.rodadaNumero}>Resposta {i + 1}</span>
            <span className={estilos.rodadaMotivo}>{NOME_DO_MOTIVO[rodada.motivo]}</span>
            <span className={estilos.rodadaHora}>{rodada.hora}</span>
          </div>
          <p className={estilos.rodadaPergunta}>“{rodada.pergunta}”</p>
          {rodada.cortes.length === 0 ? (
            <p className={estilos.semCorte}>Nada cortado: a resposta coube inteira no canal.</p>
          ) : (
            <ul className={estilos.cortes}>
              {rodada.cortes.map((corte, j) => {
                const d = descrever(corte);
                return (
                  <li key={j} className={d.perda ? estilos.cortePerda : estilos.corteAdaptado}>
                    <strong>{d.titulo}</strong>
                    <span>{d.detalhe}</span>
                    {d.codigo && <code className={estilos.trechoUi}>{d.codigo}</code>}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
