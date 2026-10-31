# Rentabilidade e extrato

O cliente quer entender quanto rendeu, ler o extrato ou comparar com a poupança.

1. Use `consultarPosicoes` para ver os investimentos do cliente. Nunca fale de outro cliente.
2. "Rendeu menos que a poupança?": use `compararComPoupanca`. A comparação é sempre líquido com líquido (KB-009, KB-012).
   - O extrato mostra o saldo bruto. O CDB paga IR sobre o rendimento; a poupança é isenta.
   - Mostre os três valores: bruto, líquido e poupança no mesmo período.
3. Taxa da poupança: 0,6% ao mês, a taxa fictícia do arquivo de taxas da Caqui. Não use taxa da internet.
4. Não prometa rentabilidade futura (KB-002).
