import type { LoaderStandard } from "@forebay/host";

/**
 * The plugin file OpenCode loads from its global plugin directory.
 *
 * @implNote The host starts once per process however often OpenCode calls the plugin, and the plugin
 * returns at once, so a slow or refused start never holds OpenCode's own start; a refusal goes to stderr,
 * which OpenCode does not parse. The bundle is found through javascript-host's boot hint, so the entry
 * follows an update of javascript-host and never names a version a sweep can delete.
 */
const PLUGIN_SOURCE = [
  'import { readFileSync } from "node:fs";',
  'import { join } from "node:path";',
  'import { pathToFileURL } from "node:url";',
  "",
  "const HINT = {{json:hint}};",
  "const BUNDLES = {{json:bundles}};",
  "const LOADER_ID = {{json:loaderId}};",
  'const REINSTALL_FIX = "run forebay-host install again";',
  "",
  "let started;",
  "",
  "function hostEntry() {",
  '  const { host } = JSON.parse(readFileSync(HINT, "utf8"));',
  '  if (typeof host !== "string") throw new Error(`no javascript-host version is hinted in ${HINT}`);',
  '  return pathToFileURL(join(BUNDLES, host, "host.js")).href;',
  "}",
  "",
  "function reportRefusal(error) {",
  "  const detail = error?.detail ?? error?.message ?? String(error);",
  "  process.stderr.write(`spisor did not start ${LOADER_ID}: ${detail}\\nfix: ${error?.fix ?? REINSTALL_FIX}\\n`);",
  "}",
  "",
  "export const SpisorHost = async () => {",
  "  started ??= Promise.resolve()",
  "    .then(() => import(hostEntry()))",
  "    .then((host) => host.runSessionHost(LOADER_ID))",
  "    .catch(reportRefusal);",
  "  return {};",
  "};",
  "",
].join("\n");

export const standard: LoaderStandard = {
  application: {
    id: "opencode",
    label: "OpenCode",
    binary: "opencode",
    home: { envOverride: "HUB_OPENCODE_DIR", nativeEnv: "OPENCODE_CONFIG_DIR", xdgSubdir: "opencode", candidates: ["~/.config/opencode", "~/.opencode"] },
    packages: { npm: "opencode-ai" },
    entry: {
      runsOnJavascriptHost: true,
      directories: ["{{home}}", "{{home}}/plugins"],
      files: [{ path: "{{home}}/plugins/spisor-{{loaderId}}.js", text: PLUGIN_SOURCE }],
      settings: [],
    },
  },
  pathCommands: { requested: ["oc"], minimum: 1 },
  background: [],
  plugins: [],
};
