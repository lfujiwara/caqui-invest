import { describe, expect, it } from "vitest";
import { horaExibida, horaValida, mascararHora, momentoISO, msDoMomento } from "./momento";

describe("hora livre em 24h", () => {
  it.each([
    ["2300", "23:00"],
    ["23:00", "23:00"],
    ["7", "7"],
    ["073", "07:3"],
    ["11:00 PM", "11:00"],
    ["123456", "12:34"],
  ])("%s vira %s", (entrada, saida) => {
    expect(mascararHora(entrada)).toBe(saida);
  });

  it("aceita só horas de 00:00 a 23:59", () => {
    for (const ok of ["00:00", "08:00", "19:59", "23:00", "23:59"])
      expect(horaValida(ok)).toBe(true);
    for (const ruim of ["24:00", "23:60", "7:00", "23:0", "11:00 PM"]) {
      expect(horaValida(ruim)).toBe(false);
    }
  });

  it("23:00 escolhido é 23:00 em Brasília, no momento enviado e na hora exibida", () => {
    const iso = momentoISO(msDoMomento("2026-11-18", "23:00"));
    expect(iso).toBe("2026-11-18T23:00:00-03:00");
    expect(horaExibida(iso)).toBe("23:00");
  });
});
