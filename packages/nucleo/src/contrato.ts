import { z } from "zod";

export const MotivoId = z.enum([
  "onde_esta_meu_dinheiro",
  "duvida_produto",
  "rentabilidade_extrato",
  "acesso_seguranca",
  "impostos_documentos",
  "pedido_recomendacao",
  "reclamacao_cancelamento",
  "outros",
]);
export type MotivoId = z.infer<typeof MotivoId>;

export const Canal = z.enum(["web", "whatsapp"]);
export type Canal = z.infer<typeof Canal>;

export const KbId = z.string().regex(/^KB-\d{3}$/);
export type KbId = z.infer<typeof KbId>;

export const IdCliente = z.string().regex(/^C-\d{4}$/);

// ISO 8601 com fuso obrigatório. Segundos opcionais, como em perguntas_teste.jsonl.
export const Momento = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/)
  .refine((s) => !Number.isNaN(Date.parse(s)), "data inválida");

export const Fonte = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("kb"), id: KbId, titulo: z.string().min(1) }),
  z.object({ tipo: z.literal("conta"), descricao: z.string().min(1) }),
]);
export type Fonte = z.infer<typeof Fonte>;

export const Fila = z.enum(["atendimento", "seguranca", "especialista"]);
export type Fila = z.infer<typeof Fila>;

export const Handoff = z.object({
  protocolo: z.string().regex(/^CAQ-\d{8}-[0-9A-F]{6}$/),
  fila: Fila,
  humanoDisponivel: z.boolean(),
  retornoPrevisto: Momento.nullable(),
  resumo: z.string().min(1),
});
export type Handoff = z.infer<typeof Handoff>;

// Limites do WhatsApp (botões de resposta e mensagem de lista). Valem nos dois canais.
const TituloBotao = z.string().min(1).max(20);
const TituloLinha = z.string().min(1).max(24);

export const Interacao = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("botoes"),
    opcoes: z
      .array(z.object({ id: z.string().min(1), titulo: TituloBotao }))
      .min(1)
      .max(3),
  }),
  z
    .object({
      tipo: z.literal("lista"),
      botao: TituloBotao,
      secoes: z
        .array(
          z.object({
            titulo: TituloLinha,
            linhas: z
              .array(
                z.object({
                  id: z.string().min(1),
                  titulo: TituloLinha,
                  descricao: z.string().max(72).nullable(),
                }),
              )
              .min(1),
          }),
        )
        .min(1),
    })
    .refine((lista) => lista.secoes.reduce((n, s) => n + s.linhas.length, 0) <= 10, {
      message: "uma lista tem no máximo 10 linhas no total",
    }),
]);
export type Interacao = z.infer<typeof Interacao>;

const camposComuns = {
  motivo: MotivoId,
  texto: z.string().min(1),
  fontes: z.array(Fonte),
  interacao: Interacao.nullable(),
  // Componente OpenUI serializado. Só o canal web desenha; no WhatsApp vira null.
  ui: z.string().nullable(),
};

const comHandoff = <A extends string, F extends Fila>(acao: A, fila: F) =>
  z.object({
    ...camposComuns,
    acao: z.literal(acao),
    handoff: Handoff.extend({ fila: z.literal(fila) }),
  });

export const Resposta = z.discriminatedUnion("acao", [
  z.object({ ...camposComuns, acao: z.literal("responder"), handoff: z.null() }),
  comHandoff("encaminhar_humano", "atendimento"),
  comHandoff("encaminhar_seguranca", "seguranca"),
  comHandoff("encaminhar_especialista", "especialista"),
]);
export type Resposta = z.infer<typeof Resposta>;
export type Acao = Resposta["acao"];

export const Turno = z.discriminatedUnion("autor", [
  z.object({ autor: z.literal("cliente"), texto: z.string().min(1).max(2000) }),
  z.object({ autor: z.literal("caqui"), texto: z.string().min(1), motivo: MotivoId }),
]);
export type Turno = z.infer<typeof Turno>;

export const ChatRequest = z.object({
  canal: Canal,
  mensagem: z.string().trim().min(1).max(2000),
  historico: z.array(Turno).max(40),
  idCliente: IdCliente.nullable(),
  momento: Momento,
});
export type ChatRequest = z.infer<typeof ChatRequest>;
