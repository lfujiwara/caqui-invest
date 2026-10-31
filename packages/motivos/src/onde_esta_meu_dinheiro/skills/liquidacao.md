# Onde está meu dinheiro

O cliente quer saber quando um resgate, aplicação ou transferência cai, ou acha que o dinheiro sumiu.

1. Comece tranquilizando: o dinheiro não some. Diga o status da operação.
2. Use `consultarOperacoes` para achar o pedido do cliente. Use o horário do pedido que está lá, não um palpite.
3. Use `preverLiquidacao` com o código do produto e o horário do pedido. Nunca conte dias de cabeça.
   - O corte é 16h (KB-006). Pedido depois das 16h, em fim de semana ou feriado conta a partir do próximo dia útil.
   - Fundos têm cotização e pagamento separados. Diga as duas datas.
4. Escreva as datas no formato DD/MM/AAAA.
5. Explique o status com KB-008. Se a data prevista já passou e o status não mudou, ofereça falar com uma pessoa.
6. Produto que a Caqui não oferece (KB-030): diga que não oferece. Não invente prazo.
