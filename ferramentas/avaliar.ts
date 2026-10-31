/**
 * Passa dados/perguntas_teste.jsonl pelo atendimento e confere com checar_respostas.py.
 *
 *   pnpm eval                               harness direto, sem HTTP
 *   pnpm eval --url http://localhost:3000   API publicada
 *   pnpm eval --regras 1,4,5                repassado ao checador
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { MOTIVOS } from "@caqui/motivos";
import {
  atender,
  type ChatRequest,
  type Mensagem,
  type PerguntaTeste,
  perguntasDeTeste,
  Resposta,
} from "@caqui/nucleo";

const { values: opcoes } = parseArgs({
  options: {
    url: { type: "string" },
    regras: { type: "string" },
    saida: { type: "string", default: join(import.meta.dirname, "..", "respostas.jsonl") },
  },
});

// "Agora" dos dados (CASE.md), usado quando a pergunta não traz momento.
const AGORA = "2026-11-18T10:00-03:00";

async function responder(req: ChatRequest): Promise<Resposta> {
  if (!opcoes.url) return atender(req, MOTIVOS, () => {});
  const r = await fetch(new URL("/api/chat", opcoes.url), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return Resposta.parse(await r.json());
}

// O vocabulário do checador é outro: segurança é "seguranca_imediata" e um encaminhamento
// com retorno marcado (fora do horário ou reclamação com prazo) é "protocolo". O contrato não
// tem "recusar": a recusa de dado de terceiro é acesso_seguranca respondendo sem fonte.
function acaoDoChecador(r: Resposta): string {
  if (r.acao === "encaminhar_seguranca") return "seguranca_imediata";
  if (r.handoff?.retornoPrevisto) return "protocolo";
  if (r.acao === "responder" && r.motivo === "acesso_seguranca" && r.fontes.length === 0) {
    return "recusar";
  }
  return r.acao;
}

// Turnos separados por " | " (PT-27) viram uma conversa de verdade, um turno por vez.
async function conversar(p: PerguntaTeste): Promise<Resposta> {
  const momento = p.contexto.momento ?? AGORA;
  const historico: Mensagem[] = [];
  let ultima: Resposta | undefined;
  for (const mensagem of p.pergunta.split(" | ")) {
    ultima = await responder({
      canal: "web",
      mensagem,
      historico: [...historico],
      idCliente: p.contexto.id_cliente ?? null,
      momento,
    });
    historico.push(
      { autor: "cliente", texto: mensagem, em: momento },
      { autor: "caqui", resposta: ultima, em: momento },
    );
  }
  if (!ultima) throw new Error(`${p.id} sem mensagem`);
  return ultima;
}

const linhas: string[] = [];
for (const p of perguntasDeTeste()) {
  const r = await conversar(p);
  const fontes = r.fontes.map((f) => (f.tipo === "kb" ? f.id : f.descricao)).join(", ");
  linhas.push(
    JSON.stringify({
      id: p.id,
      resposta: fontes ? `${r.texto}\n\nFontes: ${fontes}` : r.texto,
      acao: acaoDoChecador(r),
      motivo: r.motivo,
    }),
  );
}
writeFileSync(opcoes.saida, `${linhas.join("\n")}\n`);
console.log(`${linhas.length} respostas em ${opcoes.saida} (${opcoes.url ?? "harness direto"})\n`);

const checador = spawnSync(
  "python3",
  [
    join(import.meta.dirname, "checar_respostas.py"),
    opcoes.saida,
    ...(opcoes.regras ? ["--regras", opcoes.regras] : []),
  ],
  { stdio: "inherit" },
);
process.exit(checador.status ?? 1);
