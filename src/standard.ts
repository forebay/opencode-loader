import type { LoaderStandard } from "@forebay/host";

export const standard: LoaderStandard = {
  application: {
    id: "opencode",
    label: "OpenCode",
    binary: "opencode",
    home: { envOverride: "HUB_OPENCODE_DIR", nativeEnv: "OPENCODE_CONFIG_DIR", xdgSubdir: "opencode", candidates: ["~/.config/opencode", "~/.opencode"] },
    packages: { npm: "opencode-ai" },
  },
  pathCommands: { requested: ["oc"], minimum: 1 },
  background: [],
  plugins: [],
};
