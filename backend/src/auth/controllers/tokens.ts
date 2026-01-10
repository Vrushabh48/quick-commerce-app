import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { Role } from "../../../db/prisma/generated/client";
import type { StringValue } from "ms";
import crypto from "crypto";
import {
  JWT_SECRET,
  REFRESH_SECRET,
  REFRESH_EXPIRES_DAYS,
} from "../../config/env";

const ACCESS_EXPIRES: StringValue =
  (process.env.ACCESS_EXPIRES as StringValue) || "15m";

export function signAccessToken(params: {
  accountId: number;
  role: Role;
  sessionId: string;
}) {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES };

  return jwt.sign(
    {
      sub: String(params.accountId),
      role: params.role,
      sessionId: params.sessionId,
    },
    JWT_SECRET,
    options
  );
}

export function signRefreshToken(params: {
  accountId: number;
  sessionId: string;
}) {
  return jwt.sign(
    {
      sub: String(params.accountId),
      sessionId: params.sessionId,
    },
    REFRESH_SECRET,
    { expiresIn: `${REFRESH_EXPIRES_DAYS}d` }
  );
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,        // MUST be true in production
  sameSite: "strict" as const,
  path: "/auth/refresh",
};
