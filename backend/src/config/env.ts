// config/env.ts
export const JWT_SECRET: string = process.env.JWT_SECRET!;
export const REFRESH_SECRET: string = process.env.REFRESH_SECRET!;
const raw = Number(process.env.REFRESH_EXPIRES_DAYS ?? 7);
if (!Number.isInteger(raw) || raw <= 0) {
  throw new Error("REFRESH_EXPIRES_DAYS must be a positive integer");
}
export const REFRESH_EXPIRES_DAYS = raw;