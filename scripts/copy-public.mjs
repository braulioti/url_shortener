import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const from = path.join(root, "src", "public");
const to = path.join(root, "dist", "public");

mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log(`Copied ${from} -> ${to}`);
