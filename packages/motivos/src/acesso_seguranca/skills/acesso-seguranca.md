---
name: acesso_seguranca
description: Orienta a implementação e revisão do motivo de acesso à conta e segurança na Caqui Invest, cobrindo senha, aparelho, bloqueio, privacidade e suspeita de golpe.
---

# Acesso e segurança — Caqui Invest

Use esta skill ao implementar, revisar ou ajustar o motivo `acesso_seguranca` da Caqui Invest. Leia e aplique também [`guardrails.md`](guardrails.md): ele contém as regras obrigatórias para respostas e tratamento seguro dos dados.

## Antes de mudar o código

1. Confirme o repositório, a branch e as instruções locais (`AGENTS.md`, README e scripts). A estrutura pode mudar.
2. Leia o case e as regras vigentes, especialmente 5, 6, 10, 11 e 12. Trate código e testes como retrato da implementação, não como substitutos do case.
3. Consulte as fontes relevantes:
   - `dados/base_conhecimento/KB-019.md`: a Caqui nunca pede senha, código SMS/token, transferência/Pix de teste ou instalação de acesso remoto.
   - `dados/base_conhecimento/KB-020.md`: suspeita de golpe, bloqueio pelo app e contato imediato com segurança.
   - `dados/base_conhecimento/KB-021.md`: troca de senha e validação de aparelho novo.
   - `dados/perguntas_teste.jsonl`: cenários de segurança e privacidade, incluindo PT-18–21 e PT-32–35.
4. Verifique se fontes e procedimentos continuam atuais e permitidos. Não invente telas, canais, ferramentas ou capacidades.

## Área e arquitetura

O motivo fica em `packages/motivos/src/acesso_seguranca/`. Leia `index.ts` e `acesso_seguranca.test.ts`. Para regras compartilhadas, consulte `packages/nucleo/src/guardrails/entrada.ts`, `saida.ts`, `atendimento.ts`, `roteador.ts` e os testes relacionados.

- Mantenha lógica específica dentro do motivo e regras compartilhadas no núcleo. Não importe dados ou lógica privada de outro motivo.
- O código atual verifica golpe por `detectarGolpe` antes de qualquer modelo e pedidos de dados de terceiros por `pedeDadoDeTerceiro`. Preserve a precedência determinística.
- O roteador prioriza `acesso_seguranca`. Ao mexer em gatilhos, verifique colisões com outros motivos.
- Reutilize `encaminhar` para criar handoffs com protocolo, fila, disponibilidade, resumo e fonte. Respeite os contratos do núcleo e os formatos aceitos por cada canal.
- As KBs declaradas pelo motivo são KB-019, KB-020 e KB-021. Encaminhamentos de segurança também podem usar a fonte comum KB-020. Não cite artigo obsoleto ou não permitido.
- O case usa dados sintéticos. Não adicione dados reais nem declare integrações inexistentes.

## Como implementar e revisar

1. Faça a menor mudança coerente com as regras e os contratos existentes.
2. Atualize testes do motivo e do núcleo quando a mudança afetar esses comportamentos. Use `perguntas_teste.jsonl` como referência e cubra: golpe fora de horário, credencial já compartilhada, pedido de dado de terceiro, CPF mascarado, prompt injection, vulnerabilidade, pedido de humano e fallback sem fonte.
3. Verifique que sinais de golpe são tratados antes do modelo, que o encaminhamento possui fonte permitida e que nenhuma saída revela credencial ou informação de outra pessoa.
4. Quando a tarefa pedir validação, rode os comandos documentados pelo repositório e informe exatamente o que foi executado. Nunca declare bloqueio real, contato humano concluído ou teste aprovado sem evidência.

## Revisão final

Confirme os itens do checklist em [`guardrails.md`](guardrails.md), além de verificar precedência de roteamento, fonte KB permitida, handoff completo e testes pertinentes.

