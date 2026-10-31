import { describe, expect, it } from "vitest";
import { formatarRetorno } from "./momento";

describe("formatarRetorno", () => {
  it("ISO do núcleo vira data e hora de Brasília, nunca o ISO cru", () => {
    expect(formatarRetorno("2026-11-25T20:00:00-03:00")).toBe("qua., 25/11 às 20h");
    expect(formatarRetorno("2026-11-19T08:30:00-03:00")).toBe("qui., 19/11 às 8h30");
  });

  it("texto livre passa como veio", () => {
    expect(formatarRetorno("quinta, 19/11, a partir das 8h")).toBe(
      "quinta, 19/11, a partir das 8h",
    );
  });
});
