import { copyFileSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const publicFrom = path.join(root, "src", "public");
const publicTo = path.join(root, "dist", "public");
mkdirSync(publicTo, { recursive: true });
cpSync(publicFrom, publicTo, { recursive: true });
console.log(`Copied ${publicFrom} -> ${publicTo}`);

const i18nFrom = path.join(root, "src", "i18n");
const i18nTo = path.join(root, "dist", "i18n");
mkdirSync(i18nTo, { recursive: true });
for (const file of readdirSync(i18nFrom)) {
  if (!file.endsWith(".json")) {
    continue;
  }
  copyFileSync(path.join(i18nFrom, file), path.join(i18nTo, file));
  console.log(`Copied ${file} -> dist/i18n/`);
}
