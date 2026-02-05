import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateCode = customAlphabet(alphabet, 6);

export function generateTeamCode(): string {
  return generateCode();
}

export function isValidTeamCode(code: string): boolean {
  if (code.length !== 6) return false;
  return /^[A-Z0-9]+$/.test(code);
}
