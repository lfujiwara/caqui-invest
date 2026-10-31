import type { Motivos } from "@caqui/nucleo";
import { MOTIVO as acesso_seguranca } from "./acesso_seguranca";
import { MOTIVO as duvida_produto } from "./duvida_produto";
import { MOTIVO as impostos_documentos } from "./impostos_documentos";
import { MOTIVO as onde_esta_meu_dinheiro } from "./onde_esta_meu_dinheiro";
import { MOTIVO as outros } from "./outros";
import { MOTIVO as pedido_recomendacao } from "./pedido_recomendacao";
import { MOTIVO as reclamacao_cancelamento } from "./reclamacao_cancelamento";
import { MOTIVO as rentabilidade_extrato } from "./rentabilidade_extrato";

export const MOTIVOS: Motivos = {
  onde_esta_meu_dinheiro,
  duvida_produto,
  rentabilidade_extrato,
  acesso_seguranca,
  impostos_documentos,
  pedido_recomendacao,
  reclamacao_cancelamento,
  outros,
};
