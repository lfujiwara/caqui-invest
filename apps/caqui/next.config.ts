import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "../..");

const config: NextConfig = {
  output: "standalone",
  // Os pacotes do workspace exportam TypeScript cru; o Next transpila. Assim roda igual na Vercel.
  transpilePackages: ["@caqui/nucleo", "@caqui/motivos"],
  outputFileTracingRoot: raiz,
  // dados/ e as skills são lidos com fs em tempo de servidor; o tracing não os vê sozinho.
  outputFileTracingIncludes: {
    "/**": ["../../dados/**/*", "../../packages/motivos/src/*/skills/*.md"],
  },
};

export default config;
