# Caqui Invest: atendimento que escala com confiança

Case aberto do **Hands On com IA: da concepção à produção**, 31/10/2026.

A Caqui Invest é uma corretora fictícia que vai sair de 400 mil para 2 milhões de clientes em 18 meses, e o time de atendimento só pode ir de 62 para 100 pessoas. O desafio é atender essa base sem a satisfação cair e sem perder a confiança de quem está entregando o próprio patrimônio.

Não há trilha, formato esperado nem resposta certa. O grupo lê os dados, escolhe a parte do problema que quer atacar, escreve a spec e leva a solução até uma URL pública no mesmo dia, com IA em todas as etapas.

> Tudo aqui é fictício: a empresa, as pessoas, os CPFs, as taxas, os saldos e as conversas. As regras são simplificadas para o desafio e não substituem a norma vigente.

## Por onde começar

1. Clique em **Use this template** para criar o repositório do grupo (público ou privado, como preferirem). Fork também funciona, mas um fork de repositório público fica público.
2. Leia o [CASE.md](CASE.md): contexto, números, personas e as doze regras.
3. Explore a pasta [`dados/`](dados/). O [README dos dados](dados/README.md) descreve cada arquivo e campo.
4. Antes de qualquer código, preencha o [SPEC.md](templates/SPEC.md) com as respostas às seis perguntas.
5. Construa, verifique e publique.

## Como rodar

Precisa de Node 22 e do pnpm via corepack (`corepack enable`). O modo padrão é `offline`: sem rede e determinístico.

```bash
pnpm install
pnpm dev        # http://localhost:3000 (web) e /whatsapp
pnpm check      # biome, tsc por pacote e dependency-cruiser
pnpm test       # vitest
pnpm eval       # perguntas_teste.jsonl pelo harness + checar_respostas.py
pnpm eval --url http://localhost:3000   # o mesmo, pela API publicada
pnpm build && pnpm start
```

O canal web desenha `resposta.ui` com o OpenUI (`@openuidev/react-lang` e `@openuidev/lang-core`, 1.0.2). Dois avisos sobre essas dependências:

- Em `pnpm dev`, o `react-lang` monta sozinho um widget de devtools (OpenUI Inspect) no canto da página. A versão 1.0.2 não tem opção pública para desligar; o widget some em `pnpm build && pnpm start`, porque o bundler elimina o bloco quando `NODE_ENV=production`.
- O `postinstall` do `lang-core` envia telemetria. O pnpm 10 bloqueia scripts de instalação por padrão e o pacote fica fora de `onlyBuiltDependencies` de propósito. O aviso "Ignored build scripts" no `pnpm install` é esperado: não rode `pnpm approve-builds` para ele.

Para usar um modelo de verdade, copie `.env.example` para `apps/caqui/.env` e troque `CAQUI_MODELO_ROTEADOR` e `CAQUI_MODELO_MOTIVO` para `ollama:<modelo>` ou `openrouter:<provedor>/<modelo>`. O `pnpm dev` e o `pnpm start` rodam o Next dentro de `apps/caqui`, e ele só lê o `.env` dessa pasta: um `.env` na raiz é ignorado. O `docker compose` faz o contrário e lê o `.env` da raiz. Para usar o mesmo arquivo nos dois, rode `docker compose --env-file apps/caqui/.env up --build`. O `pnpm eval` não lê nenhum dos dois, então exporte as variáveis no shell antes de rodá-lo.

### Deploy na Vercel

1. Em vercel.com, importe o repositório `lfujiwara/caqui-invest`.
2. Em **Root Directory**, escolha `apps/caqui`. O framework é detectado como Next.js, e o pnpm instala o workspace inteiro.
3. Em **Environment Variables**, defina:

| Variável | Valor |
| --- | --- |
| `CAQUI_MODELO_ROTEADOR` | `openrouter:nvidia/nemotron-3.5-super-vl:free` |
| `CAQUI_MODELO_MOTIVO` | `openrouter:nvidia/nemotron-3.5-super-vl:free` |
| `OPENROUTER_API_KEY` | a sua chave do OpenRouter |

Sem essas variáveis, o app sobe em modo `offline`. Se o OpenRouter falhar ou bater no limite de uso, o roteador cai nos gatilhos e a fatia encaminha para uma pessoa. O erro aparece no trace, nos logs da função. Para gastar metade das chamadas do plano gratuito, deixe `CAQUI_MODELO_ROTEADOR=offline`.

```bash
docker compose up --build                      # só o app, em http://localhost:3000
docker compose --profile ollama up --build     # app + ollama
```

O código fica assim. O app depende de `motivos`, que depende de `nucleo`. Uma fatia nunca importa outra; o `pnpm check` falha se isso acontecer.

```
apps/caqui/          Next.js, o único deployável: páginas, server action e /api/chat
packages/nucleo/     contrato zod, harness, roteador, guardrails, modelos, calendário, IR, KB
packages/motivos/    uma pasta por motivo de contato, cada uma com index, skills, tools e teste
ferramentas/         avaliar.ts (pnpm eval) e checar_respostas.py
```

## O que tem aqui

```
.
├── CASE.md                    o case completo: contexto, números, personas e regras
├── dados/                     pacote de dados sintéticos, igual para todos os grupos
│   ├── README.md              descrição dos arquivos e campos
│   ├── base_conhecimento/     30 artigos de ajuda (KB-001 a KB-030)
│   ├── clientes.json          50 clientes fictícios
│   ├── posicoes.csv           146 posições em 18/11/2026
│   ├── operacoes.csv          400 aplicações, resgates e transferências
│   ├── conversas.csv          300 conversas rotuladas do atendimento atual
│   ├── calendario.json        dias úteis e feriados de out/2026 a dez/2027
│   ├── taxas.json             CDI, poupança, IR e regras dos produtos
│   └── perguntas_teste.jsonl  40 perguntas com resposta esperada, por regra
├── templates/
│   ├── SPEC.md                as seis perguntas que a spec responde
│   └── COMO-USAMOS-IA.md      seção para colar no README do grupo
└── ferramentas/
    └── checar_respostas.py    confere as respostas da solução contra perguntas_teste.jsonl
```

**"Agora" nos dados é 18/11/2026, 10h (horário de Brasília).** Saldos, status de operações e prazos foram calculados a partir dessa data.

## O que vale para qualquer caminho

1. Saída para humano visível em qualquer passo, das 8h às 20h. Fora desse horário, a solução registra o protocolo e informa o prazo de retorno.
2. Nenhuma recomendação de investimento. A solução explica conceitos e encaminha o pedido de recomendação para um especialista humano.
3. Toda informação factual mostra de onde veio: o artigo da base de conhecimento ou o dado da conta.
4. Suspeita de golpe interrompe o fluxo e encaminha para segurança na hora, sem fila.
5. O cliente nunca repete a demanda. Quem recebe o caso vê o histórico e o protocolo.
6. Só dados sintéticos. Nenhum dado real de pessoa, mesmo que seja do próprio participante.

Se a solução não conversa com o cliente (uma ferramenta interna ou um painel, por exemplo), os itens 1, 3, 4 e 5 que não se aplicarem saem com justificativa na spec. Os itens 2 e 6 valem sempre.

## Conferir as respostas

O `perguntas_teste.jsonl` traz, para cada pergunta, a resposta esperada, a ação esperada e pistas de texto (`deve_conter` e `nao_deve_conter`). Façam a solução responder às perguntas das regras que vocês tratam e gravem um JSONL assim:

```json
{"id": "PT-01", "resposta": "O pagamento cai em 05/11/2026...", "acao": "responder"}
```

Depois rodem (Python 3.9 ou mais novo, sem dependências):

```bash
python3 ferramentas/checar_respostas.py respostas.jsonl --regras 1,4,5
```

O script confere as pistas e a ação, e mostra o resultado por regra. As pistas não substituem o critério, que é a `resposta_esperada`: uma resposta pode passar nas pistas e mesmo assim estar errada. Leiam as respostas que passaram também.

## Regras do dia

- O Hands On não é competição: ninguém ganha e ninguém é ranqueado.
- Ferramenta, licença, repositório, conta de nuvem e deploy são de cada participante.
- Os mentores tiram dúvidas e dão direção, mas não põem a mão no teclado nem escolhem o problema pelo grupo.
- Nenhum segredo (chave de API, token) vai para o repositório. Se vazar, o grupo gira a chave na hora. O `.gitignore` já ignora `.env`.
- Nada que imite marca real. O produto é da Caqui, que é fictícia.
- Só dados sintéticos, sempre.

## Como o dia termina

Cada grupo mostra em poucos minutos o problema que escolheu e por quê, o produto rodando na URL pública e um momento em que a IA errou e o grupo percebeu. Para facilitar a conversa, deixem no repositório do grupo:

- `SPEC.md` com as respostas às seis perguntas ([modelo](templates/SPEC.md))
- uma seção **Como usamos IA** no README: ferramentas, harness e skills, e o que foi verificado na mão ([modelo](templates/COMO-USAMOS-IA.md))
- o link da URL pública no topo do README

## Dúvidas e erros nos dados

Achou dado inconsistente, regra ambígua ou artigo desatualizado? Parte disso é de propósito (a base tem pelo menos um artigo desatualizado). Se não for, abra uma issue aqui. Questionar os dados também conta como resultado.
