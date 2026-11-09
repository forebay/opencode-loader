import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { standard } from "./standard.js";

const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST_BUNDLE = join(REPOSITORY_ROOT, "dist", "host");
const PACKAGE = JSON.parse(readFileSync(join(REPOSITORY_ROOT, "package.json"), "utf8")) as { version: string };
const HOST_ROOT = dirname(createRequire(import.meta.url).resolve("@forebay/host/package.json"));
const LIBRARY_BUILD = join(HOST_ROOT, "siblings", "library", "build", "bin");
const NATIVE_HOST = process.platform === "win32" ? join(LIBRARY_BUILD, "Release", "forebay-host.exe") : join(LIBRARY_BUILD, "forebay-host");

const RULED_STANDARD = {
  application: {
    id: "opencode",
    label: "OpenCode",
    binary: "opencode",
    home: { envOverride: "HUB_OPENCODE_DIR", nativeEnv: "OPENCODE_CONFIG_DIR", xdgSubdir: "opencode", candidates: ["~/.config/opencode", "~/.opencode"] },
    packages: { npm: "opencode-ai" },
    entry: standard.application.entry,
  },
  pathCommands: { requested: ["oc"], minimum: 1 },
  background: [],
  plugins: [],
};

let base: string;

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), "loader-standard-"));
});

afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

describe("the loader's host bundle", () => {
  it("holds only a host.json carrying the ruled standard under the loader's name, version and the native runtime", () => {
    expect(readdirSync(HOST_BUNDLE)).toEqual(["host.json"]);
    const manifest = JSON.parse(readFileSync(join(HOST_BUNDLE, "host.json"), "utf8")) as Record<string, unknown>;
    expect(manifest).toEqual({ id: "opencode-loader", version: PACKAGE.version, runtime: "native", ...RULED_STANDARD });
  });

  it("is listed by the native host's catalog build with its application and the native runtime", () => {
    execFileSync(NATIVE_HOST, ["catalog", "build", "--host", HOST_BUNDLE, "--out", base], { encoding: "utf8" });
    const catalog = JSON.parse(readFileSync(join(base, "catalog.json"), "utf8")) as { items: Record<string, { kind: string; runtime?: string; application?: unknown }> };
    expect(catalog.items["opencode-loader"]).toMatchObject({ kind: "host", runtime: "native", application: RULED_STANDARD.application });
  });
});
