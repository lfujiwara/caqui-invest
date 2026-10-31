"use client";

import { analisarUi } from "@caqui/nucleo/openui";
import { Renderer } from "@openuidev/react-lang";
import { Component, type ReactNode, useEffect, useMemo } from "react";
import { bibliotecaReact } from "./componentes";

class SemQuebrar extends Component<{ children: ReactNode }, { quebrou: boolean }> {
  override state = { quebrou: false };
  static getDerivedStateFromError() {
    return { quebrou: true };
  }
  override componentDidCatch(erro: unknown) {
    console.warn("[caqui/openui] componente gerado falhou ao renderizar e foi descartado", erro);
  }
  override render() {
    return this.state.quebrou ? null : this.props.children;
  }
}

/** Renderiza `resposta.ui` só com a biblioteca da Caqui. Qualquer falha vira nada. */
export function UiGerada({ ui }: { ui: string }) {
  const analise = useMemo(() => analisarUi(ui), [ui]);
  useEffect(() => {
    if (!analise.ok) console.warn(`[caqui/openui] ui descartada: ${analise.motivo}`);
  }, [analise]);
  if (!analise.ok) return null;
  return (
    <SemQuebrar>
      <Renderer response={ui} library={bibliotecaReact} />
    </SemQuebrar>
  );
}
