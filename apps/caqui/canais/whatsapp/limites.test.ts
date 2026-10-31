import { MotivoId, Resposta } from "@caqui/nucleo";
import { describe, expect, it } from "vitest";
import { fixtures } from "./fixtures";
import {
  CABECALHO_ALERTA,
  CORPO_BOTOES_SEPARADO,
  type Corte,
  LIMITE_CORPO_INTERATIVO,
  LIMITE_TEXTO,
  type MensagemWhatsApp,
  paraWhatsApp,
} from "./limites";

function textoVisivel(mensagens: MensagemWhatsApp[]): string {
  return mensagens
    .map((m) => {
      switch (m.tipo) {
        case "texto":
        case "sistema":
          return m.texto;
        case "botoes":
          return [m.corpo, ...m.opcoes.map((o) => o.titulo)].join("\n");
        case "lista":
          return [
            m.corpo,
            m.botao,
            ...m.secoes.flatMap((s) => [
              s.titulo,
              ...s.linhas.flatMap((l) => [l.titulo, l.descricao ?? ""]),
            ]),
          ].join("\n");
        default:
          return m satisfies never;
      }
    })
    .join("\n");
}

const cortes = (mensagens: MensagemWhatsApp[]): Corte[] => mensagens.flatMap((m) => m.cortes);
const interativas = (mensagens: MensagemWhatsApp[]) =>
  mensagens.filter(
    (m): m is Extract<MensagemWhatsApp, { tipo: "botoes" | "lista" }> =>
      m.tipo === "botoes" || m.tipo === "lista",
  );

const ehDoTipo = <T extends MensagemWhatsApp["tipo"]>(
  m: MensagemWhatsApp,
  tipo: T,
): m is Extract<MensagemWhatsApp, { tipo: T }> => m.tipo === tipo;

/** A mensagem na posição `i` (negativo conta do fim), que precisa ser do tipo dado. */
function mensagem<T extends MensagemWhatsApp["tipo"]>(
  msgs: MensagemWhatsApp[],
  i: number,
  tipo: T,
): Extract<MensagemWhatsApp, { tipo: T }> {
  const m = msgs.at(i);
  if (m === undefined || !ehDoTipo(m, tipo)) {
    throw new Error(`esperava ${tipo} na posição ${i}, veio ${m?.tipo ?? "nada"}`);
  }
  return m;
}

function resposta(parcial: Partial<Resposta>): Resposta {
  return {
    motivo: "outros",
    acao: "responder",
    texto: "Oi.",
    fontes: [],
    interacao: null,
    ui: null,
    handoff: null,
    ...parcial,
  } as Resposta;
}

describe("fixtures", () => {
  it("cobrem os 8 motivos e passam no schema", () => {
    expect(Object.keys(fixtures).sort()).toEqual([...MotivoId.options].sort());
    for (const [motivo, r] of Object.entries(fixtures)) {
      expect(Resposta.parse(r).motivo).toBe(motivo);
    }
  });

  it("incluem os casos que a demo precisa mostrar", () => {
    const todas = Object.values(fixtures);
    expect(todas.some((r) => r.ui !== null)).toBe(true);
    expect(
      todas.some((r) => r.texto.length > LIMITE_CORPO_INTERATIVO && r.interacao?.tipo === "botoes"),
    ).toBe(true);
    expect(todas.some((r) => r.acao === "encaminhar_seguranca")).toBe(true);
    expect(todas.some((r) => r.interacao?.tipo === "lista")).toBe(true);
    expect(todas.some((r) => r.handoff?.humanoDisponivel === false)).toBe(true);
  });
});

describe("ui rica", () => {
  it("é sempre descartada e o corte fica registrado", () => {
    const r = fixtures.onde_esta_meu_dinheiro;
    const msgs = paraWhatsApp(r);
    const visivel = textoVisivel(msgs);
    expect(visivel).not.toContain("StatusResgate");
    expect(visivel).not.toMatch(/<\/?[A-Z]/);
    expect(cortes(msgs)).toContainEqual({
      tipo: "ui_descartada",
      trecho: expect.stringContaining("<StatusResgate"),
    });
  });

  it("sem ui, não registra descarte", () => {
    expect(cortes(paraWhatsApp(fixtures.outros)).map((c) => c.tipo)).not.toContain("ui_descartada");
  });
});

describe("formatação", () => {
  it("converte markdown e HTML para o que o WhatsApp mostra, com links em texto", () => {
    const msgs = paraWhatsApp(fixtures.rentabilidade_extrato);
    const visivel = textoVisivel(msgs);
    expect(visivel).toContain("*Comparando do jeito certo*");
    expect(visivel).toContain("*R$ 41,20 bruto*");
    expect(visivel).toContain("*líquido com líquido*");
    expect(visivel).toContain("Comparar com a poupança (https://ajuda.caquiinvest.example/kb-012)");
    expect(visivel).not.toMatch(/\*\*|<b>|##|\]\(/);
    const corte = cortes(msgs).find((c) => c.tipo === "formatacao_convertida");
    expect(corte).toMatchObject({
      detalhes: expect.arrayContaining([
        "HTML removido",
        "link virou texto",
        "título virou negrito",
      ]),
    });
  });

  it("mantém os quatro formatos nativos e não mexe dentro de ```mono```", () => {
    const texto = "*negrito* _itálico_ ~riscado~ ```**literal** <b>x</b>``` e `cod`";
    const [m] = paraWhatsApp(resposta({ texto }));
    expect(m).toMatchObject({
      tipo: "texto",
      texto: "*negrito* _itálico_ ~riscado~ ```**literal** <b>x</b>``` e ```cod```",
    });
  });

  it("texto já no formato do canal não registra conversão", () => {
    expect(cortes(paraWhatsApp(resposta({ texto: "*ok* _ok_" })))).toEqual([]);
  });
});

describe("tamanho do texto", () => {
  it("corpo acima de 1024 com botões vai antes, em texto, e o interativo fica dentro do limite", () => {
    const r = fixtures.duvida_produto;
    const msgs = paraWhatsApp(r);
    expect(msgs.map((m) => m.tipo)).toEqual(["texto", "botoes"]);
    expect(msgs[0]).toMatchObject({ texto: expect.stringContaining("Liquidez diária quer dizer") });
    expect(msgs[0]).toMatchObject({
      texto: expect.stringContaining("nenhum deles tem a garantia do FGC"),
    });
    expect(msgs[1]).toMatchObject({
      corpo: CORPO_BOTOES_SEPARADO,
      opcoes: r.interacao?.tipo === "botoes" ? r.interacao.opcoes : [],
    });
    expect(cortes(msgs)).toContainEqual({ tipo: "corpo_separado", caracteres: expect.any(Number) });
  });

  it("corpo dentro de 1024 fica no próprio interativo", () => {
    const msgs = paraWhatsApp(fixtures.outros);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({
      tipo: "botoes",
      corpo: expect.stringContaining("Perfil > Meus dados"),
    });
    for (const m of interativas(Object.values(fixtures).flatMap(paraWhatsApp))) {
      expect(m.corpo.length).toBeLessThanOrEqual(LIMITE_CORPO_INTERATIVO);
    }
  });

  it("texto acima de 4096 quebra em várias mensagens sem perder palavra", () => {
    const palavras = Array.from({ length: 1800 }, (_, i) => `palavra${i}`);
    const msgs = paraWhatsApp(resposta({ texto: palavras.join(" ") }));
    expect(msgs.length).toBe(Math.ceil(palavras.join(" ").length / LIMITE_TEXTO));
    for (const m of msgs) {
      expect(m.tipo).toBe("texto");
      expect(textoVisivel([m]).length).toBeLessThanOrEqual(LIMITE_TEXTO);
    }
    expect(textoVisivel(msgs).split(/\s+/)).toEqual(palavras);
    expect(cortes(msgs)).toContainEqual({
      tipo: "texto_dividido",
      caracteres: expect.any(Number),
      partes: msgs.length,
    });
  });
});

describe("botões", () => {
  it("título acima de 20 é encurtado e registrado", () => {
    const msgs = paraWhatsApp(
      resposta({
        interacao: { tipo: "botoes", opcoes: [{ id: "a", titulo: "Quero falar com uma pessoa" }] },
      }),
    );
    const titulo = mensagem(msgs, 0, "botoes").opcoes[0]?.titulo ?? "";
    expect(titulo.length).toBeLessThanOrEqual(20);
    expect(titulo.startsWith("Quero falar com")).toBe(true);
    expect(cortes(msgs)).toContainEqual({
      tipo: "encurtado",
      original: "Quero falar com uma pessoa",
      exibido: titulo,
    });
  });

  it("mais de 3 viram lista, sem perder nenhuma opção", () => {
    const opcoes = ["Resgate", "Aplicação", "Extrato", "Falar com atendente"].map((titulo, i) => ({
      id: `o${i}`,
      titulo,
    }));
    const msgs = paraWhatsApp(resposta({ interacao: { tipo: "botoes", opcoes } }));
    const m = mensagem(msgs, 0, "lista");
    expect(m.secoes.flatMap((s) => s.linhas.map((l) => l.titulo))).toEqual(
      opcoes.map((o) => o.titulo),
    );
    expect(cortes(msgs)).toContainEqual({ tipo: "botoes_viraram_lista", quantidade: 4 });
  });

  it("clicar envia o título exibido, e é ele que o canal mostra", () => {
    const msgs = paraWhatsApp(fixtures.onde_esta_meu_dinheiro);
    expect(msgs[0]).toMatchObject({
      tipo: "botoes",
      opcoes: [{ titulo: "Acompanhar resgate" }, { titulo: "Falar com atendente" }],
    });
  });
});

describe("lista", () => {
  it("dentro dos limites passa intacta", () => {
    const r = fixtures.impostos_documentos;
    const msgs = paraWhatsApp(r);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({
      tipo: "lista",
      botao: "Ver documentos",
      secoes: r.interacao?.tipo === "lista" ? r.interacao.secoes : [],
    });
    expect(cortes(msgs)).toEqual([]);
  });

  it("corta além de 10 linhas e encurta botão, título e descrição", () => {
    const linhas = Array.from({ length: 12 }, (_, i) => ({ id: `l${i}`, titulo: `Linha ${i}` }));
    linhas[0] = {
      id: "l0",
      titulo: "Título de linha comprido demais",
      descricao: "d".repeat(80),
    } as (typeof linhas)[number];
    const msgs = paraWhatsApp(
      resposta({
        interacao: {
          tipo: "lista",
          botao: "Botão com texto longo demais",
          secoes: [{ titulo: "Seção", linhas }],
        },
      }),
    );
    const m = mensagem(msgs, 0, "lista");
    const exibidas = m.secoes.flatMap((s) => s.linhas);
    expect(exibidas).toHaveLength(10);
    expect(m.botao.length).toBeLessThanOrEqual(20);
    expect(exibidas[0]?.titulo.length).toBeLessThanOrEqual(24);
    expect(exibidas[0]?.descricao?.length).toBeLessThanOrEqual(72);
    expect(textoVisivel(msgs)).not.toContain("Linha 10");
    expect(cortes(msgs)).toContainEqual({
      tipo: "opcoes_cortadas",
      descartadas: ["Linha 10", "Linha 11"],
    });
    expect(cortes(msgs).filter((c) => c.tipo === "encurtado")).toHaveLength(3);
  });
});

describe("fontes", () => {
  it("viram uma linha de texto no fim", () => {
    const msgs = paraWhatsApp(fixtures.impostos_documentos);
    expect(mensagem(msgs, 0, "lista").corpo).toMatch(/\n\nFonte: KB-017 Informe de rendimentos$/);
  });

  it("várias fontes, incluindo dado da conta, ficam numa linha só", () => {
    const visivel = textoVisivel(paraWhatsApp(fixtures.onde_esta_meu_dinheiro));
    expect(visivel).toContain(
      "Fontes: KB-006 Prazos de resgate e de aplicação; dados da sua conta (operação OP-10001, resgate de 13/11 às 17h05)",
    );
  });

  it("quando o texto vai separado, a fonte fecha o texto e não o interativo", () => {
    const msgs = paraWhatsApp(fixtures.duvida_produto);
    expect(
      mensagem(msgs, 0, "texto").texto.endsWith(
        "Fontes: KB-004 O que é liquidez diária; KB-010 Imposto de renda na renda fixa; KB-013 Garantia do FGC",
      ),
    ).toBe(true);
  });
});

describe("handoff", () => {
  it("com humano disponível, mensagem de sistema com protocolo e continuidade", () => {
    const msgs = paraWhatsApp(fixtures.pedido_recomendacao);
    expect(textoVisivel([mensagem(msgs, -1, "sistema")])).toMatch(
      /especialista.*Uma pessoa continua esta conversa.*Protocolo ESP-20261118-0412/s,
    );
  });

  it("fora do horário, informa o horário humano, o protocolo e o prazo de retorno (regra 12)", () => {
    const msgs = paraWhatsApp(fixtures.reclamacao_cancelamento);
    const sistema = textoVisivel(msgs.filter((m) => m.tipo === "sistema"));
    expect(sistema).toContain("das 8h às 20h");
    expect(sistema).toContain("ATD-20261118-2307");
    expect(sistema).toContain("em 19/11 a partir das 8h");
    expect(sistema).not.toMatch(/Uma pessoa continua/);
  });

  it("sem retorno previsto, assume a abertura das 8h", () => {
    const base = fixtures.reclamacao_cancelamento;
    if (base.handoff === null) throw new Error("a fixture de reclamação encaminha");
    const msgs = paraWhatsApp({ ...base, handoff: { ...base.handoff, retornoPrevisto: null } });
    expect(textoVisivel(msgs)).toContain("retorna a partir das 8h");
  });

  it("segurança abre com o alerta e a orientação, e aciona a equipe sem fila (regra 5)", () => {
    const msgs = paraWhatsApp(fixtures.acesso_seguranca);
    expect(msgs.map((m) => m.tipo)).toEqual(["texto", "botoes", "sistema"]);
    const alerta = mensagem(msgs, 0, "texto").texto;
    expect(alerta.startsWith(`${CABECALHO_ALERTA}\n*Não passe o código.*`)).toBe(true);
    expect(msgs[1]).toMatchObject({ corpo: CORPO_BOTOES_SEPARADO });
    expect(mensagem(msgs, 2, "sistema").texto).toBe(
      "Equipe de segurança acionada agora, sem fila. Protocolo SEG-20261118-0031.",
    );
  });

  it("resposta sem handoff não gera mensagem de sistema", () => {
    expect(paraWhatsApp(fixtures.outros).some((m) => m.tipo === "sistema")).toBe(false);
  });
});
