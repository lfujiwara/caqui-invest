import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { markdownSimples } from "./RespostaCaqui";

const html = (texto: string) =>
  renderToStaticMarkup(createElement(Fragment, null, ...markdownSimples(texto)));

test("negrito, item de lista e título viram marcação, sem asteriscos soltos", () => {
  expect(html("**OP-10007 — Resgate (R$ 3.000,00)**\nStatus: pendente.\n- Pedido: 30/10")).toBe(
    "<strong>OP-10007 — Resgate (R$ 3.000,00)</strong>\nStatus: pendente.\n• Pedido: 30/10",
  );
  expect(html("### Resumo")).toBe("<strong>Resumo</strong>");
  expect(html("2 * 3 = 6")).toBe("2 * 3 = 6");
});
