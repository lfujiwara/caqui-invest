/**
 * Conversa com o atendimento no terminal, como uma das personas do CASE.
 *
 *   pnpm conversar --persona marta                          REPL pelo atendimento completo
 *   pnpm conversar --persona rafael --motivo rentabilidade_extrato   direto na fatia, mostra tools
 *   pnpm conversar --persona camila "oi" "e o CDB?"          um turno por argumento e sai
 *   pnpm conversar --persona marta --roteiro                 manda as mensagens típicas da persona
 *   pnpm conversar --momento 2026-11-18T16:10-03:00          muda o "agora"
 *
 * Com --motivo a mensagem vai direto para a fatia, sem roteador nem guardrails do harness.
 * O modelo offline não chama tools: para exercitar uma, use CAQUI_MODELO_MOTIVO online.
 */
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { MOTIVOS } from "@caqui/motivos";
import {
  atender,
  type ChatRequest,
  clientePorId,
  type Mensagem,
  MotivoId,
  modeloDoMotivo,
  type Resposta,
  TOOL_DA_RESPOSTA,
} from "@caqui/nucleo";
import { type LanguageModel, wrapLanguageModel } from "ai";
import { type NomePersona, PERSONAS } from "./personas";

const { values: opcoes, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    persona: { type: "string", default: "marta" },
    motivo: { type: "string" },
    momento: { type: "string", default: "2026-11-18T10:00-03:00" },
    roteiro: { type: "boolean", default: false },
  },
});

if (!(opcoes.persona in PERSONAS)) {
  console.error(`persona inexistente: ${opcoes.persona}. Use ${Object.keys(PERSONAS).join(", ")}`);
  process.exit(1);
}
const persona = PERSONAS[opcoes.persona as NomePersona];
const motivo = opcoes.motivo ? MOTIVOS[MotivoId.parse(opcoes.motivo)] : null;
const cliente = clientePorId(persona.idCliente);

const cinza = (s: string) => `\x1b[2m${s}\x1b[0m`;
const curto = (x: unknown) => {
  const s = typeof x === "string" ? x : JSON.stringify(x);
  return s.length > 300 ? `${s.slice(0, 300)}…` : s;
};

// Mostra cada tool chamada pela fatia e o que ela devolveu, sem tocar no núcleo.
const comLogDeTools = (modelo: Exclude<LanguageModel, string>) =>
  wrapLanguageModel({
    model: modelo,
    middleware: {
      specificationVersion: "v4",
      wrapGenerate: async ({ doGenerate, params }) => {
        const ultima = params.prompt.at(-1);
        if (ultima?.role === "tool")
          for (const p of ultima.content)
            if (p.type === "tool-result")
              console.log(
                cinza(
                  `  ← ${p.toolName} ${curto(p.output.type === "json" ? p.output.value : p.output)}`,
                ),
              );
        const r = await doGenerate();
        for (const p of r.content)
          if (p.type === "tool-call" && p.toolName !== TOOL_DA_RESPOSTA)
            console.log(cinza(`  → ${p.toolName} ${curto(p.input)}`));
        return r;
      },
    },
  });

async function responder(req: ChatRequest): Promise<Resposta> {
  if (!motivo)
    return atender(req, MOTIVOS, (t) => console.log(cinza(`  trace ${JSON.stringify(t)}`)));
  const modelo = comLogDeTools(modeloDoMotivo(motivo.kbs) as Exclude<LanguageModel, string>);
  return motivo.responder(req, { cliente, modelo });
}

const historico: Mensagem[] = [];
async function turno(mensagem: string) {
  const r = await responder({
    canal: persona.canal,
    mensagem,
    historico: [...historico],
    idCliente: persona.idCliente,
    momento: opcoes.momento,
  });
  historico.push(
    { autor: "cliente", texto: mensagem, em: opcoes.momento },
    { autor: "caqui", resposta: r, em: opcoes.momento },
  );
  console.log(`\ncaqui [${r.acao} · ${r.motivo}]: ${r.texto}`);
  for (const f of r.fontes)
    console.log(cinza(`  fonte: ${f.tipo === "kb" ? `${f.id} ${f.titulo}` : f.descricao}`));
  if (r.interacao) console.log(cinza(`  interação: ${curto(r.interacao)}`));
  if (r.handoff) console.log(cinza(`  handoff: ${curto(r.handoff)}`));
  console.log();
}

console.log(
  cinza(
    `${persona.quem}\n${cliente ? `${cliente.id} ${cliente.nome}` : "sem login"} · ${persona.canal} · ${opcoes.momento} · ${motivo ? `fatia ${motivo.id}` : "atendimento completo"}\n`,
  ),
);

if (opcoes.roteiro || positionals.length) {
  for (const m of opcoes.roteiro ? persona.roteiro : positionals) {
    console.log(`${opcoes.persona}: ${m}`);
    await turno(m);
  }
} else {
  console.log(cinza(`sugestões: ${persona.roteiro.join(" / ")}\nCtrl+D sai\n`));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  rl.on("close", () => process.exit(0));
  for (;;) {
    const m = (await rl.question(`${opcoes.persona}: `)).trim();
    if (m) await turno(m);
  }
}
