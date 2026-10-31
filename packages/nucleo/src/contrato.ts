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

export const Fonte = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("kb"), id: z.string(), titulo: z.string() }),
  z.object({ tipo: z.literal("conta"), descricao: z.string() }),
]);
export type Fonte = z.infer<typeof Fonte>;

export const Fila = z.enum(["atendimento", "seguranca", "especialista"]);
export type Fila = z.infer<typeof Fila>;

export const Handoff = z.object({
  protocolo: z.string(),
  fila: Fila,
  humanoDisponivel: z.boolean(),
  retornoPrevisto: z.string().nullable(),
  resumo: z.string(),
});
export type Handoff = z.infer<typeof Handoff>;

// Limites do WhatsApp (botões de resposta e mensagem de lista). Valem nos dois canais.
const Linha = z.object({
  id: z.string(),
  titulo: z.string().max(24),
  descricao: z.string().max(72).optional(),
});

export const Interacao = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("botoes"),
    opcoes: z
      .array(z.object({ id: z.string(), titulo: z.string().max(20) }))
      .min(1)
      .max(3),
  }),
  z.object({
    tipo: z.literal("lista"),
    botao: z.string().max(20),
    secoes: z
      .array(z.object({ titulo: z.string().max(24), linhas: z.array(Linha).min(1) }))
      .min(1)
      .refine((s) => s.reduce((n, x) => n + x.linhas.length, 0) <= 10, "no máximo 10 linhas"),
  }),
]);
export type Interacao = z.infer<typeof Interacao>;

const Base = {
  motivo: MotivoId,
  texto: z.string(),
  fontes: z.array(Fonte),
  interacao: Interacao.nullable(),
  ui: z.string().nullable(), // OpenUI Lang; só no canal web
};

export const Resposta = z.discriminatedUnion("acao", [
  z.object({ ...Base, acao: z.literal("responder"), handoff: z.null() }),
  z.object({
    ...Base,
    acao: z.enum(["encaminhar_humano", "encaminhar_seguranca", "encaminhar_especialista"]),
    handoff: Handoff,
  }),
]);
export type Resposta = z.infer<typeof Resposta>;

export const Mensagem = z.discriminatedUnion("autor", [
  z.object({ autor: z.literal("cliente"), texto: z.string(), em: z.string() }),
  z.object({ autor: z.literal("caqui"), resposta: Resposta, em: z.string() }),
]);
export type Mensagem = z.infer<typeof Mensagem>;

export const ChatRequest = z.object({
  canal: Canal,
  // 4096 é o limite de texto do WhatsApp. Sem teto, as regex dos guardrails de entrada, que são
  // quadráticas no tamanho do texto, travam o servidor: 240 KB seguravam o event loop por 23 s.
  mensagem: z.string().min(1).max(4096),
  historico: z.array(Mensagem),
  idCliente: z.string().nullable(),
  // ISO 8601 com fuso, ex. 2026-11-18T10:00-03:00. O tipo continua string; só a validação é estrita.
  momento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/)
    .refine((s) => !Number.isNaN(Date.parse(s)), "data inválida"),
});
export type ChatRequest = z.infer<typeof ChatRequest>;

// Fronteira entre página e canal: a página (server component) passa uma server action.
export type Enviar = (req: ChatRequest) => Promise<Resposta>;
