import type { MotivoId } from "@caqui/nucleo";

/** Uma sugestão por motivo de contato. O Record garante que nenhum motivo fique de fora. */
export const SUGESTOES: Record<MotivoId, { assunto: string; pergunta: string }> = {
  onde_esta_meu_dinheiro: { assunto: "Onde está meu dinheiro", pergunta: "Resgatei e não caiu. Onde está meu dinheiro?" },
  duvida_produto: { assunto: "Dúvida sobre um produto", pergunta: "O que é liquidez diária? O CDB tem garantia?" },
  rentabilidade_extrato: { assunto: "Rendimento e extrato", pergunta: "Meu CDB rendeu menos que a poupança?" },
  acesso_seguranca: { assunto: "Acesso e segurança", pergunta: "Um gerente da Caqui me ligou pedindo um código" },
  impostos_documentos: { assunto: "Impostos e documentos", pergunta: "Quanto vou pagar de imposto de renda?" },
  pedido_recomendacao: { assunto: "Onde investir", pergunta: "Tenho R$ 50 mil, onde eu coloco?" },
  reclamacao_cancelamento: { assunto: "Reclamação ou encerramento", pergunta: "Quero encerrar minha conta" },
  outros: { assunto: "Outros assuntos", pergunta: "Quero atualizar meus dados cadastrais" },
};
