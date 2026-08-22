import { randomInt } from "node:crypto";
import { isReservedShortCode } from "../http/reserved.js";
import { shortCodeExists } from "./repository.js";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 6;
const MAX_COLLISION_RETRIES = 10;

export function generateRandomShortCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)]!;
  }
  return code;
}

export async function generateUniqueShortCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt += 1) {
    const code = generateRandomShortCode();
    if (isReservedShortCode(code)) {
      continue;
    }
    if (!(await shortCodeExists(code))) {
      return code;
    }
  }

  throw new Error("SHORT_CODE_COLLISION_LIMIT");
}
