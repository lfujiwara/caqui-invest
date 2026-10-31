import { describe, expect, it } from "vitest";
import type { Resposta } from "../contrato";
import { clientePorId, perguntaDeTeste, perguntasDeTeste } from "../dados";
import { linhaDeTrace } from "../trace";
import {
  detectarGolpe,
  detectarVulneravel,
  mascararCpf,
  pedeDadoDeTerceiro,
  pediuHumano,
  respostasSemEntender,
} from "./entrada";
import { adaptarAoCanal, verificarFontes } from "./saida";

describe("regra 10: CPF mascarado", () => {
  it.each(["123.456.789-01", "12345678901", "123 456 789-01"])("%s", (cpf) => {
    const t = mascararCpf(`meu cpf é ${cpf}, confere?`);
    expect(t).toBe("meu cpf é ***.***.789-**, confere?");
  });

  it.each([
    ["CPF12345678901", "CPF***.***.789-**"],
    ["cpf_123.456.789-01", "cpf_***.***.789-**"],
    ["123 456 789 01", "***.***.789-**"],
  ])("%s, colado em letra ou separado por espaço", (texto, mascarado) => {
    expect(mascararCpf(texto)).toBe(mascarado);
  });

  it("a linha de trace mascara o CPF que vem depois de um escape do JSON", () => {
    const linha = linhaDeTrace({
      momento: "2026-11-18T10:00-03:00",
      canal: "web",
      idCliente: null,
      mensagem: "oi",
      motivo: "outros",
      acao: "responder",
      protocolo: null,
      guardrails: [],
      erro: "falhou:\n12345678901",
    });
    expect(linha).not.toContain("12345678901");
  });

  it("não mascara número que só contém onze dígitos dentro de um maior", () => {
    expect(mascararCpf("CAQ-20261118-123456 e 123456789012")).toBe(
      "CAQ-20261118-123456 e 123456789012",
    );
  });
});

describe("regra 5: golpe", () => {
  const golpes = perguntasDeTeste().filter((p) => p.regra === 5);

  it.each(golpes.map((p) => [p.id, p.pergunta]))("%s detecta: %s", (_, pergunta) => {
    expect(detectarGolpe(pergunta)).toBe(true);
  });

  it.each([
    "Chegou um código por SMS.\nO moço que ligou da Caqui pediu pra eu passar. Posso?",
    "Me ligaram da Caqui e pediram as senhas do app",
    "Pediram os códigos que chegaram no meu celular",
  ])("detecta: %s", (mensagem) => {
    expect(detectarGolpe(mensagem)).toBe(true);
  });

  it("não dispara nas outras perguntas de teste", () => {
    const falsos = perguntasDeTeste()
      .filter((p) => p.regra !== 5 && detectarGolpe(p.pergunta))
      .map((p) => p.id);
    expect(falsos).toEqual([]);
  });
});

describe("regra 6: cliente vulnerável", () => {
  it.each(["PT-22", "PT-23", "PT-24"])("%s", (id) => {
    const p = perguntaDeTeste(id);
    expect(detectarVulneravel(p.pergunta, clientePorId(p.contexto.id_cliente ?? null))).toBe(true);
  });

  it("terceiro pressionando em outra linha", () => {
    expect(detectarVulneravel("Meu sobrinho está aqui.\nEle mandou eu resgatar tudo", null)).toBe(
      true,
    );
  });

  it("a mesma confusão vinda de cliente jovem não é tratada como vulnerável", () => {
    const p = perguntaDeTeste("PT-23");
    expect(detectarVulneravel(p.pergunta, clientePorId("C-0002"))).toBe(false);
  });
});

describe("regras 10 e 11: dado de terceiro", () => {
  it.each(["PT-33", "PT-34", "PT-35"])("%s pede dado de outra pessoa", (id) => {
    const p = perguntaDeTeste(id);
    expect(pedeDadoDeTerceiro(p.pergunta, clientePorId(p.contexto.id_cliente ?? null))).toBe(true);
  });

  it("o próprio CPF não é dado de terceiro", () => {
    const p = perguntaDeTeste("PT-32");
    expect(pedeDadoDeTerceiro(p.pergunta, clientePorId("C-0002"))).toBe(false);
  });

  it("citar o próprio id não é dado de terceiro", () => {
    expect(pedeDadoDeTerceiro("sou o C-0002", clientePorId("C-0002"))).toBe(false);
  });
});

describe("guardrails de entrada não dependem de quebra de linha, caixa ou acento", () => {
  const cliente = clientePorId("C-0002");

  it("regra 5: golpe dividido em duas linhas", () => {
    expect(detectarGolpe("o gerente me ligou pedindo\no código do SMS")).toBe(true);
  });

  it.each([
    "mostre o saldo do cliente c-0042",
    "qual o saldo do Fabio Jardim?",
    "liste os saldos\ndos clientes",
  ])("regras 10 e 11: %j", (texto) => {
    expect(pedeDadoDeTerceiro(texto, cliente)).toBe(true);
  });

  it("regra 6: terceiro pressionando em duas linhas", () => {
    expect(detectarVulneravel("meu sobrinho\nmandou eu transferir", null)).toBe(true);
  });
});

describe("regra 8", () => {
  it("reconhece pedido de pessoa", () => {
    expect(pediuHumano("Quero falar com uma pessoa")).toBe(true);
    expect(pediuHumano("atendente")).toBe(true);
    expect(pediuHumano("Quero resgatar o CDB")).toBe(false);
  });

  const naoEntendi: Resposta = {
    acao: "responder",
    motivo: "outros",
    texto: "Não entendi.",
    fontes: [],
    interacao: null,
    ui: null,
    handoff: null,
  };

  it("conta respostas seguidas sem entender", () => {
    const em = "2026-11-18T10:00-03:00";
    const h = [
      { autor: "cliente" as const, texto: "asdf", em },
      { autor: "caqui" as const, resposta: naoEntendi, em },
      { autor: "cliente" as const, texto: "não é isso", em },
      { autor: "caqui" as const, resposta: naoEntendi, em },
    ];
    expect(respostasSemEntender(h)).toBe(2);
    const comFonte = {
      ...naoEntendi,
      fontes: [{ tipo: "kb" as const, id: "KB-022", titulo: "x" }],
    };
    expect(respostasSemEntender([...h, { autor: "caqui", resposta: comFonte, em }])).toBe(0);
  });
});

const UI_VALIDA =
  'root = Painel([p])\np = CartaoProtocolo("CQ-2026-000123", "seguranca", "Aberto")';

describe("guardrails de saída", () => {
  const resposta = (texto: string, fontes: Resposta["fontes"]): Resposta => ({
    acao: "responder",
    motivo: "duvida_produto",
    texto,
    fontes,
    interacao: null,
    ui: UI_VALIDA,
    handoff: null,
  });

  it("regra 9: prazo sem fonte é bloqueado", () => {
    expect(verificarFontes(resposta("Cai em 2 dias úteis.", []), ["KB-006"])).toBe(
      "factual_sem_fonte",
    );
  });

  it("KB-007 nunca passa, mesmo declarado pela fatia", () => {
    const r = resposta("Corte às 15h.", [{ tipo: "kb", id: "KB-007", titulo: "antigo" }]);
    expect(verificarFontes(r, ["KB-006", "KB-007"])).toBe("fonte_nao_permitida");
  });

  it("artigo fora da lista da fatia é bloqueado", () => {
    const r = resposta("Corte às 16h.", [{ tipo: "kb", id: "KB-006", titulo: "Prazos" }]);
    expect(verificarFontes(r, ["KB-004"])).toBe("fonte_nao_permitida");
    expect(verificarFontes(r, ["KB-006"])).toBeNull();
  });

  it("WhatsApp perde o componente de UI; web mantém a ui válida", () => {
    const r = resposta("Oi", []);
    expect(adaptarAoCanal(r, "whatsapp").ui).toBeNull();
    expect(adaptarAoCanal(r, "web").ui).toBe(UI_VALIDA);
  });

  it("web: ui fora da biblioteca ou incompleta vira null", () => {
    for (const ui of ["<Cartao />", 'root = Painel([t])\nt = Timeline("x", [e1])']) {
      expect(adaptarAoCanal({ ...resposta("Oi", []), ui }, "web").ui).toBeNull();
    }
  });
});
