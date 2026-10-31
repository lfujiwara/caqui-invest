import type { Fonte, Handoff, Interacao, Resposta } from "@caqui/nucleo";

export const LIMITE_TEXTO = 4096;
export const LIMITE_CORPO_INTERATIVO = 1024;
export const MAX_BOTOES = 3;
export const LIMITE_TITULO_BOTAO = 20;
export const LIMITE_BOTAO_LISTA = 20;
export const MAX_LINHAS_LISTA = 10;
export const LIMITE_TITULO_SECAO = 24;
export const LIMITE_TITULO_LINHA = 24;
export const LIMITE_DESCRICAO_LINHA = 72;
export const LIMITE_TRECHO_UI = 160;

export const CABECALHO_ALERTA = "*⚠ ALERTA DE SEGURANÇA*";
export const CORPO_BOTOES_SEPARADO = "Escolha uma opção:";
export const CORPO_LISTA_SEPARADO = "Toque no botão abaixo para ver as opções.";
export const BOTAO_LISTA_DE_BOTOES = "Ver opções";
export const HORARIO_HUMANO = "das 8h às 20h, todos os dias";

export type Corte =
  | { tipo: "ui_descartada"; trecho: string }
  | { tipo: "formatacao_convertida"; detalhes: string[] }
  | { tipo: "texto_dividido"; caracteres: number; partes: number }
  | { tipo: "corpo_separado"; caracteres: number }
  | { tipo: "botoes_viraram_lista"; quantidade: number }
  | { tipo: "opcoes_cortadas"; descartadas: string[] }
  | { tipo: "encurtado"; original: string; exibido: string };

export type Opcao = { id: string; titulo: string };
export type LinhaLista = { id: string; titulo: string; descricao?: string };
export type SecaoLista = { titulo: string; linhas: LinhaLista[] };

export type MensagemWhatsApp =
  | { tipo: "texto"; texto: string; cortes: Corte[] }
  | { tipo: "botoes"; corpo: string; opcoes: Opcao[]; cortes: Corte[] }
  | { tipo: "lista"; corpo: string; botao: string; secoes: SecaoLista[]; cortes: Corte[] }
  | { tipo: "sistema"; texto: string; cortes: Corte[] };

export function paraWhatsApp(resposta: Resposta): MensagemWhatsApp[] {
  const cortesGerais: Corte[] = [];
  if (resposta.ui !== null && resposta.ui.trim() !== "") {
    cortesGerais.push({
      tipo: "ui_descartada",
      trecho: encurtar(resposta.ui.trim(), LIMITE_TRECHO_UI),
    });
  }

  const formatado = formatarParaWhatsApp(resposta.texto);
  if (formatado.detalhes.length > 0) {
    cortesGerais.push({ tipo: "formatacao_convertida", detalhes: formatado.detalhes });
  }

  const seguranca = resposta.acao === "encaminhar_seguranca";
  // A orientação vem antes de qualquer outra coisa (regra 5), então nunca vai para o corpo de um interativo.
  const corpoPrincipal = juntar(
    seguranca ? `${CABECALHO_ALERTA}\n${formatado.texto}` : formatado.texto,
    linhaDeFontes(resposta.fontes),
  );

  const mensagens: MensagemWhatsApp[] = [];
  const interativo = resposta.interacao && adaptarInteracao(resposta.interacao);

  const cabeNoCorpo = corpoPrincipal.length > 0 && corpoPrincipal.length <= LIMITE_CORPO_INTERATIVO;
  if (interativo && !seguranca && cabeNoCorpo) {
    mensagens.push(interativo.comCorpo(corpoPrincipal));
  } else {
    mensagens.push(...textoEmPartes(corpoPrincipal));
    if (interativo) {
      if (!seguranca && corpoPrincipal.length > 0) {
        mensagens.at(-1)?.cortes.push({
          tipo: "corpo_separado",
          caracteres: corpoPrincipal.length,
        });
      }
      mensagens.push(interativo.comCorpo(interativo.corpoSeparado));
    }
  }

  if (resposta.handoff) {
    mensagens.push({ tipo: "sistema", texto: avisoDeHandoff(resposta.handoff), cortes: [] });
  }

  mensagens[0]?.cortes.unshift(...cortesGerais);
  return mensagens;
}

function adaptarInteracao(interacao: Interacao) {
  const cortes: Corte[] = [];
  const titulo = (texto: string, limite: number) => {
    if (texto.length <= limite) return texto;
    const exibido = encurtar(texto, limite);
    cortes.push({ tipo: "encurtado", original: texto, exibido });
    return exibido;
  };

  if (interacao.tipo === "botoes" && interacao.opcoes.length <= MAX_BOTOES) {
    const opcoes = interacao.opcoes.map((o) => ({
      id: o.id,
      titulo: titulo(o.titulo, LIMITE_TITULO_BOTAO),
    }));
    return {
      corpoSeparado: CORPO_BOTOES_SEPARADO,
      comCorpo: (corpo: string): MensagemWhatsApp => ({ tipo: "botoes", corpo, opcoes, cortes }),
    };
  }

  // Botões acima do limite viram lista em vez de sumir: a opção cortada poderia ser a saída para o humano.
  let secoesOriginais: SecaoLista[];
  let botaoOriginal: string;
  if (interacao.tipo === "botoes") {
    cortes.push({ tipo: "botoes_viraram_lista", quantidade: interacao.opcoes.length });
    secoesOriginais = [{ titulo: "", linhas: interacao.opcoes }];
    botaoOriginal = BOTAO_LISTA_DE_BOTOES;
  } else {
    secoesOriginais = interacao.secoes;
    botaoOriginal = interacao.botao;
  }

  const botao = titulo(botaoOriginal, LIMITE_BOTAO_LISTA);
  const descartadas: string[] = [];
  let restantes = MAX_LINHAS_LISTA;
  const secoes: SecaoLista[] = [];
  for (const secao of secoesOriginais) {
    const linhas: LinhaLista[] = [];
    for (const linha of secao.linhas) {
      if (restantes === 0) {
        descartadas.push(linha.titulo);
        continue;
      }
      restantes--;
      linhas.push({
        id: linha.id,
        titulo: titulo(linha.titulo, LIMITE_TITULO_LINHA),
        ...(linha.descricao !== undefined && {
          descricao: titulo(linha.descricao, LIMITE_DESCRICAO_LINHA),
        }),
      });
    }
    if (linhas.length > 0)
      secoes.push({ titulo: titulo(secao.titulo, LIMITE_TITULO_SECAO), linhas });
  }
  if (descartadas.length > 0) cortes.push({ tipo: "opcoes_cortadas", descartadas });

  return {
    corpoSeparado: CORPO_LISTA_SEPARADO,
    comCorpo: (corpo: string): MensagemWhatsApp => ({
      tipo: "lista",
      corpo,
      botao,
      secoes,
      cortes,
    }),
  };
}

function textoEmPartes(texto: string): MensagemWhatsApp[] {
  if (texto.length === 0) return [];
  const partes: string[] = [];
  let resto = texto;
  while (resto.length > LIMITE_TEXTO) {
    const corte = pontoDeCorte(resto, LIMITE_TEXTO);
    partes.push(resto.slice(0, corte).trimEnd());
    resto = resto.slice(corte).trimStart();
  }
  partes.push(resto);
  const divisao: Corte[] =
    partes.length > 1
      ? [{ tipo: "texto_dividido", caracteres: texto.length, partes: partes.length }]
      : [];
  return partes.map((p, i) => ({ tipo: "texto", texto: p, cortes: i === 0 ? divisao : [] }));
}

function pontoDeCorte(texto: string, limite: number): number {
  const janela = texto.slice(0, limite);
  for (const separador of ["\n\n", "\n", ". ", " "]) {
    const i = janela.lastIndexOf(separador);
    if (i > limite / 2) return i + separador.length;
  }
  return limite;
}

function linhaDeFontes(fontes: Fonte[]): string {
  if (fontes.length === 0) return "";
  const nomes = fontes.map((f) =>
    f.tipo === "kb" ? `${f.id} ${f.titulo}` : `dados da sua conta (${f.descricao})`,
  );
  return `${fontes.length === 1 ? "Fonte" : "Fontes"}: ${nomes.join("; ")}`;
}

const NOME_DA_FILA: Record<Handoff["fila"], string> = {
  atendimento: "nosso atendimento",
  seguranca: "a equipe de segurança",
  especialista: "um especialista em investimentos",
};

function avisoDeHandoff(handoff: Handoff): string {
  if (handoff.fila === "seguranca") {
    return `Equipe de segurança acionada agora, sem fila. Protocolo ${handoff.protocolo}.`;
  }
  if (handoff.humanoDisponivel) {
    return `Você foi encaminhado para ${NOME_DA_FILA[handoff.fila]}. Uma pessoa continua esta conversa e já vê o histórico. Protocolo ${handoff.protocolo}.`;
  }
  const retorno = handoff.retornoPrevisto
    ? formatarRetorno(handoff.retornoPrevisto)
    : "a partir das 8h";
  return `Atendimento por pessoa ${HORARIO_HUMANO}. Sua demanda foi registrada com o protocolo ${handoff.protocolo} e ${NOME_DA_FILA[handoff.fila]} retorna ${retorno}. Você não vai precisar repetir nada.`;
}

const FORMATO_RETORNO = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatarRetorno(retorno: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(retorno)) return retorno;
  const data = new Date(retorno);
  if (Number.isNaN(data.getTime())) return retorno;
  const partes = Object.fromEntries(
    FORMATO_RETORNO.formatToParts(data).map((p) => [p.type, p.value]),
  );
  return `em ${partes.day}/${partes.month} a partir das ${Number(partes.hour)}h${partes.minute === "00" ? "" : partes.minute}`;
}

type Regra = { detalhe: string; padrao: RegExp; troca: string | ((...m: string[]) => string) };

const REGRAS_DE_FORMATACAO: Regra[] = [
  { detalhe: "HTML removido", padrao: /<br\s*\/?>/gi, troca: "\n" },
  { detalhe: "HTML removido", padrao: /<\/?p\b[^>]*>/gi, troca: "\n" },
  {
    detalhe: "HTML removido",
    padrao: /<(b|strong)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    troca: (_, __, t) => `*${t}*`,
  },
  {
    detalhe: "HTML removido",
    padrao: /<(i|em)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    troca: (_, __, t) => `_${t}_`,
  },
  {
    detalhe: "HTML removido",
    padrao: /<(s|del|strike)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    troca: (_, __, t) => `~${t}~`,
  },
  {
    detalhe: "link virou texto",
    padrao: /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    troca: (_, url, t) => linkEmTexto(t, url),
  },
  { detalhe: "HTML removido", padrao: /<\/?[a-z][^>]*>/gi, troca: "" },
  {
    detalhe: "imagem virou texto",
    padrao: /!\[([^\]]*)\]\(([^)\s]+)\)/g,
    troca: (_, alt, url) => linkEmTexto(alt, url),
  },
  {
    detalhe: "link virou texto",
    padrao: /\[([^\]]+)\]\(([^)\s]+)\)/g,
    troca: (_, t, url) => linkEmTexto(t, url),
  },
  {
    detalhe: "título virou negrito",
    padrao: /^#{1,6}[ \t]+(.+?)[ \t]*#*$/gm,
    troca: (_, t) => `*${t}*`,
  },
  {
    detalhe: "negrito markdown convertido",
    padrao: /\*\*([^*\n]+)\*\*/g,
    troca: (_, t) => `*${t}*`,
  },
  { detalhe: "negrito markdown convertido", padrao: /__([^_\n]+)__/g, troca: (_, t) => `*${t}*` },
  { detalhe: "riscado markdown convertido", padrao: /~~([^~\n]+)~~/g, troca: (_, t) => `~${t}~` },
  {
    detalhe: "código inline virou monoespaçado",
    padrao: /`([^`\n]+)`/g,
    troca: (_, t) => `\`\`\`${t}\`\`\``,
  },
];

const ENTIDADES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function linkEmTexto(texto: string, url: string): string {
  return texto.trim() === "" || texto === url ? url : `${texto} (${url})`;
}

export function formatarParaWhatsApp(entrada: string): { texto: string; detalhes: string[] } {
  const detalhes = new Set<string>();
  // Blocos ```mono``` já são formato do canal e não podem ser reescritos por dentro.
  const pedacos = entrada.split(/(```[\s\S]*?```)/g);
  const convertido = pedacos
    .map((pedaco, i) => {
      if (i % 2 === 1) return pedaco;
      let texto = pedaco;
      for (const regra of REGRAS_DE_FORMATACAO) {
        const antes = texto;
        texto =
          typeof regra.troca === "string"
            ? texto.replace(regra.padrao, regra.troca)
            : texto.replace(regra.padrao, regra.troca);
        if (texto !== antes) detalhes.add(regra.detalhe);
      }
      const semEntidades = texto.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTIDADES[e] ?? e);
      if (semEntidades !== texto) detalhes.add("HTML removido");
      return semEntidades;
    })
    .join("");
  return { texto: convertido.replace(/\n{3,}/g, "\n\n").trim(), detalhes: [...detalhes] };
}

function encurtar(texto: string, limite: number): string {
  return texto.length <= limite ? texto : `${texto.slice(0, limite - 1).trimEnd()}…`;
}

function juntar(...blocos: string[]): string {
  return blocos.filter((b) => b.length > 0).join("\n\n");
}
