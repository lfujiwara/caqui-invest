/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "nucleo-nao-conhece-fatias",
      comment: "O núcleo recebe o registro de motivos por parâmetro; nunca importa uma fatia.",
      severity: "error",
      from: { path: "^packages/nucleo/" },
      to: { path: "^(packages/motivos|apps)/" },
    },
    {
      name: "fatias-isoladas",
      comment: "Uma fatia não importa outra. Lógica compartilhada vai para o núcleo.",
      severity: "error",
      from: { path: "^packages/motivos/src/([^/]+)/" },
      to: {
        path: "^packages/motivos/src/[^/]+/",
        pathNot: "^packages/motivos/src/$1/",
      },
    },
    {
      name: "pacotes-nao-conhecem-o-app",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "sem-ciclos",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    includeOnly: "^(packages|apps|ferramentas)/",
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(\\.next|node_modules)/" },
    tsPreCompilationDeps: true,
    combinedDependencies: false,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
    },
  },
};
