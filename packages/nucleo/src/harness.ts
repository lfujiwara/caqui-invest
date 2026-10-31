import { encaminhar, KBS_DO_ENCAMINHAMENTO } from "./atendimento";
import { type ChatRequest, type Mensagem, type MotivoId, Resposta } from "./contrato";
import { clientePorId } from "./dados";
import {
  detectarGolpe,
  detectarVulneravel,
  excedeuPassos,
  mascararCpf,
  pedeDadoDeTerceiro,
  pediuHumano,
  respostasSemEntender,
} from "./guardrails/entrada";
import { adaptarAoCanal, verificarFontes } from "./guardrails/saida";
import { fonteKb } from "./kb";
import { modeloDoMotivo, modeloDoRoteador } from "./modelos";
import type { Motivos } from "./motivo";
import { rotear } from "./roteador";
import { type Registrar, registrarNoConsole } from "./trace";

function mascararHistorico(historico: readonly Mensagem[]): Mensagem[] {
  return historico.map((m) => (m.autor === "cliente" ? { ...m, texto: mascararCpf(m.texto) } : m));
}

const ultimoMotivo = (historico: readonly Mensagem[]): MotivoId =>
  historico.findLast((m) => m.autor === "caqui")?.resposta.motivo ?? "outros";

/**
 * Pipeline do atendimento: guardrails de entrada, roteador, fatia, guardrails de saída,
 * adaptação ao canal e trace. O registro de motivos chega por parâmetro: o núcleo não
 * conhece nenhuma fatia.
 */
export async function atender(
  entrada: ChatRequest,
  motivos: Motivos,
  registrar: Registrar = registrarNoConsole,
): Promise<Resposta> {
  const req: ChatRequest = {
    ...entrada,
    mensagem: mascararCpf(entrada.mensagem),
    historico: mascararHistorico(entrada.historico),
  };
  const cliente = clientePorId(req.idCliente);
  const guardrails: string[] = [];
  let erro: string | null = null;

  const daFatia = async (id: MotivoId): Promise<Resposta> => {
    const motivo = motivos[id];
    try {
      const resposta = await motivo.responder(req, { cliente, modelo: modeloDoMotivo(motivo.kbs) });
      const bloqueio = verificarFontes(resposta, [...motivo.kbs, ...KBS_DO_ENCAMINHAMENTO]);
      if (!bloqueio) return resposta;
      guardrails.push(bloqueio);
      return encaminhar({
        req,
        motivo: id,
        fila: "atendimento",
        texto:
          "Não encontrei uma fonte confiável para responder isso com segurança, então prefiro não arriscar.",
      });
    } catch (e) {
      erro = e instanceof Error ? e.message : String(e);
      return encaminhar({
        req,
        motivo: id,
        fila: "atendimento",
        texto: "Tive um problema para responder agora.",
      });
    }
  };

  const decidir = async (): Promise<Resposta> => {
    if (detectarGolpe(req.mensagem)) {
      guardrails.push("golpe");
      return daFatia("acesso_seguranca");
    }
    if (pedeDadoDeTerceiro(req.mensagem, cliente)) {
      guardrails.push("dado_de_terceiro");
      return daFatia("acesso_seguranca");
    }
    if (pediuHumano(req.mensagem)) {
      guardrails.push("pediu_humano");
      return encaminhar({
        req,
        motivo: ultimoMotivo(req.historico),
        fila: "atendimento",
        texto: "Claro, vou te passar para uma pessoa.",
      });
    }
    if (excedeuPassos(req.historico)) {
      guardrails.push("limite_de_passos");
      return encaminhar({
        req,
        motivo: ultimoMotivo(req.historico),
        fila: "atendimento",
        texto: "Para não te deixar dando voltas, vou te passar para uma pessoa.",
      });
    }
    const vulneravel = detectarVulneravel(req.mensagem, cliente);
    const rota = await rotear(req.mensagem, motivos, modeloDoRoteador());
    if (vulneravel) {
      guardrails.push("cliente_vulneravel");
      return encaminhar({
        req,
        motivo: rota,
        fila: "atendimento",
        texto:
          "Quero te ajudar com calma. Para decidir sobre o seu dinheiro, você fala agora com uma pessoa do nosso time de atendentes, com prioridade. Não precisa decidir nada com pressa. Lembre: a Caqui só transfere para conta de mesma titularidade, nunca para a conta de outra pessoa.",
        fontes: [fonteKb("KB-028"), fonteKb("KB-018")],
      });
    }
    if (rota === "outros" && respostasSemEntender(req.historico) >= 2) {
      guardrails.push("sem_entender");
      return encaminhar({
        req,
        motivo: "outros",
        fila: "atendimento",
        texto: "Ainda não consegui entender o que você precisa. Vou te passar para uma pessoa.",
      });
    }
    return daFatia(rota);
  };

  const decidida = await decidir();
  const resposta = Resposta.parse(adaptarAoCanal(decidida, req.canal));
  if (req.canal === "web" && decidida.ui !== null && resposta.ui === null) {
    guardrails.push("ui_invalida");
  }
  registrar({
    momento: req.momento,
    canal: req.canal,
    idCliente: req.idCliente,
    mensagem: req.mensagem,
    motivo: resposta.motivo,
    acao: resposta.acao,
    protocolo: resposta.handoff?.protocolo ?? null,
    guardrails,
    erro,
  });
  return resposta;
}
