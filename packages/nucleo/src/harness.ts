import { encaminhar, KBS_DO_ENCAMINHAMENTO } from "./atendimento";
import { type ChatRequest, type Mensagem, type MotivoId, Resposta } from "./contrato";
import { clientePorId } from "./dados";
import { type Encaminhamento, primeiroQueDispara } from "./guardrails/camadas";
import { mascararCpf } from "./guardrails/entrada";
import { GLOBAIS_ENTRADA, GLOBAIS_SAIDA } from "./guardrails/globais";
import { adaptarAoCanal } from "./guardrails/saida";
import { modeloDoMotivo, modeloDoRoteador } from "./modelos";
import type { Motivos } from "./motivo";
import { rotear } from "./roteador";
import { type Registrar, registrarNoConsole } from "./trace";

function mascararHistorico(historico: readonly Mensagem[]): Mensagem[] {
  return historico.map((m) => (m.autor === "cliente" ? { ...m, texto: mascararCpf(m.texto) } : m));
}

/**
 * Pipeline do atendimento, em duas camadas de guardrails: global de entrada, roteador, entrada
 * do motivo, fatia, saída do motivo, global de saída, adaptação ao canal e trace. O registro de
 * motivos chega por parâmetro: o núcleo não conhece nenhuma fatia.
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
  const anotarErro = (e: unknown) => {
    erro = e instanceof Error ? e.message : String(e);
  };

  let rota: Promise<MotivoId> | undefined;
  const rotaDaMensagem = () => {
    // Async para que o erro síncrono de modeloDoRoteador (chave ausente) também caia no catch.
    rota ??= (async () => rotear(req.mensagem, motivos, modeloDoRoteador()))().catch(
      (e: unknown) => {
        // Provedor fora ou com limite de uso (comum em modelo gratuito): o cliente segue atendido.
        anotarErro(e);
        guardrails.push("roteador_por_gatilhos");
        return rotear(req.mensagem, motivos, { tipo: "gatilhos" });
      },
    );
    return rota;
  };

  const encaminharPor = (e: Encaminhamento, motivo: MotivoId): Resposta =>
    encaminhar({ req, motivo: e.motivo ?? motivo, fila: e.fila, texto: e.texto, fontes: e.fontes });

  const daFatia = async (id: MotivoId): Promise<Resposta> => {
    const motivo = motivos[id];
    const ctx = { req, cliente, kbs: [...motivo.kbs, ...KBS_DO_ENCAMINHAMENTO] };
    const naEntrada = primeiroQueDispara(motivo.guardrails.entrada, (g) => g.checar(ctx));
    if (naEntrada) {
      guardrails.push(`${id}/${naEntrada.id}`);
      return encaminharPor(naEntrada.veredito, id);
    }
    let resposta: Resposta;
    try {
      resposta = await motivo.responder(req, { cliente, modelo: modeloDoMotivo(motivo.kbs) });
    } catch (e) {
      anotarErro(e);
      return encaminhar({
        req,
        motivo: id,
        fila: "atendimento",
        texto: "Tive um problema para responder agora.",
      });
    }
    const daFatiaNaSaida = primeiroQueDispara(motivo.guardrails.saida, (g) =>
      g.checar(resposta, ctx),
    );
    const naSaida = daFatiaNaSaida
      ? { ...daFatiaNaSaida, id: `${id}/${daFatiaNaSaida.id}` }
      : primeiroQueDispara(GLOBAIS_SAIDA, (g) => g.checar(resposta, ctx));
    if (!naSaida) return resposta;
    guardrails.push(naSaida.id);
    return encaminharPor(naSaida.veredito, id);
  };

  const decidir = async (): Promise<Resposta> => {
    const global = primeiroQueDispara(GLOBAIS_ENTRADA, (g) =>
      g.checar({ req, cliente, kbs: KBS_DO_ENCAMINHAMENTO }),
    );
    if (!global) return daFatia(await rotaDaMensagem());
    guardrails.push(global.id);
    const v = global.veredito;
    if (v.tipo === "desviar") return daFatia(v.motivo);
    return encaminharPor(v, v.motivo ?? (await rotaDaMensagem()));
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
