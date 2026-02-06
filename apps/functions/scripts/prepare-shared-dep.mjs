import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../..");

const sharedDistDir = resolve(repoRoot, "packages/shared/dist");
const sharedPackagePath = resolve(repoRoot, "packages/shared/package.json");
const vendorSharedDir = resolve(repoRoot, "apps/functions/vendor/shared");
const vendorDistDir = resolve(vendorSharedDir, "dist");
const vendorPackagePath = resolve(vendorSharedDir, "package.json");

if (!existsSync(sharedDistDir)) {
  throw new Error(
    "Missing packages/shared/dist. Run `pnpm --filter ./packages/shared build` before preparing functions.",
  );
}

const sharedPackageJson = JSON.parse(readFileSync(sharedPackagePath, "utf8"));

rmSync(vendorSharedDir, { recursive: true, force: true });
mkdirSync(vendorSharedDir, { recursive: true });
cpSync(sharedDistDir, vendorDistDir, { recursive: true });

const vendorPackageJson = {
  name: sharedPackageJson.name,
  version: sharedPackageJson.version,
  private: true,
  type: sharedPackageJson.type ?? "module",
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
  exports: sharedPackageJson.exports ?? {
    ".": {
      types: "./dist/index.d.ts",
      default: "./dist/index.js",
    },
  },
  dependencies: sharedPackageJson.dependencies ?? {},
};

writeFileSync(vendorPackagePath, `${JSON.stringify(vendorPackageJson, null, 2)}\n`, "utf8");
