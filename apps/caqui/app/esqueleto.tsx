"use client";

import type { Canal, Enviar, Mensagem, Resposta } from "@caqui/nucleo";
import { useState, useTransition } from "react";

// Agora em São Paulo com fuso explícito; o domínio nunca lê o relógio sozinho.
function agoraEmSaoPaulo(): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}-03:00`;
}

/**
 * Esqueleto cru até a integração com a UI de verdade (canais/web e canais/whatsapp).
 * Mostra a Resposta como JSON.
 */
export function Esqueleto({ canal, enviar }: { canal: Canal; enviar: Enviar }) {
  const [historico, setHistorico] = useState<Mensagem[]>([]);
  const [ultima, setUltima] = useState<Resposta | null>(null);
  const [pendente, iniciar] = useTransition();

  function aoEnviar(dados: FormData) {
    const mensagem = String(dados.get("mensagem") ?? "").trim();
    if (!mensagem) return;
    const idCliente = String(dados.get("idCliente") ?? "").trim() || null;
    const momento = String(dados.get("momento") ?? "").trim() || agoraEmSaoPaulo();
    iniciar(async () => {
      const resposta = await enviar({ canal, mensagem, historico, idCliente, momento });
      setHistorico((h) => [
        ...h,
        { autor: "cliente", texto: mensagem, em: momento },
        { autor: "caqui", resposta, em: momento },
      ]);
      setUltima(resposta);
    });
  }

  return (
    <main>
      <h1>Caqui Invest ({canal})</h1>
      <form action={aoEnviar}>
        <input name="mensagem" placeholder="Sua mensagem" required />
        <input name="idCliente" placeholder="C-0001 (opcional)" />
        <input name="momento" placeholder="2026-11-18T14:00-03:00 (opcional)" />
        <button type="submit" disabled={pendente}>
          Enviar
        </button>
      </form>
      <pre>{ultima ? JSON.stringify(ultima, null, 2) : "Sem resposta ainda."}</pre>
    </main>
  );
}
