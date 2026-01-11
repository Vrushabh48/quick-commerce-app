import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { Role } from "../../../db/prisma/generated/client";
import type { StringValue } from "ms";
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


import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../lib";
import { hashToken, REFRESH_COOKIE_OPTIONS, verifyRefreshToken } from "./tokens";

const allowedRoles = Object.values(Role);
type RoleValue = (typeof allowedRoles)[number];

function parseRole(input: unknown): Role {
  if (typeof input === "string" && allowedRoles.includes(input as RoleValue)) {
    return input as Role;
  }
  return Role.USER;
}
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const accountRole = parseRole(role);
    if (accountRole === Role.ADMIN) {
      return res.status(403).json({ error: "Forbidden role" });
    }

    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { account, session } = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: { email, password: hashedPassword, role: accountRole },
      });

      if (accountRole === Role.RIDER) {
        await prisma.deliveryPartner.create({
          data: {
            accountId: account.id,
            name: "",
            phone: "",
            vehicleNo: "",
          },
        });
      } else {
        await tx.user.create({ data: { accountId: account.id } });
      }

      const session = await tx.session.create({
        data: {
          accountId: account.id,
          refreshToken: "",
          expiresAt: new Date(
            Date.now() + REFRESH_EXPIRES_DAYS * 86400000
          ),
        },
      });

      return { account, session };
    });

    const refreshToken = signRefreshToken({
      accountId: account.id,
      sessionId: session.id,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: hashToken(refreshToken) },
    });

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    const accessToken = signAccessToken({
      accountId: account.id,
      role: account.role,
      sessionId: session.id,
    });

    return res.status(201).json({ accessToken });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const account = await prisma.account.findUnique({ where: { email } });
    if (!account || !account.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, account.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const session = await prisma.session.create({
      data: {
        accountId: account.id,
        refreshToken: "",
        expiresAt: new Date(
          Date.now() + REFRESH_EXPIRES_DAYS * 86400000
        ),
      },
    });

    const refreshToken = signRefreshToken({
      accountId: account.id,
      sessionId: session.id,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: hashToken(refreshToken) },
    });

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    const accessToken = signAccessToken({
      accountId: account.id,
      role: account.role,
      sessionId: session.id,
    });

    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = String(req.cookies.refreshToken);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accountId = Number(payload.sub);
    const sessionId = payload.sessionId as string;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });

    if (
      !session ||
      session.revoked ||
      session.expiresAt < new Date() ||
      session.accountId !== accountId ||
      session.refreshToken !== hashToken(token)
    ) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newRefreshToken = signRefreshToken({ accountId, sessionId });

    await prisma.session.update({
      where: { id: sessionId },
      data: { refreshToken: hashToken(newRefreshToken) },
    });

    res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account || !account.isActive) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const accessToken = signAccessToken({
      accountId,
      role: account.role,
      sessionId,
    });

    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { sessionId, accountId } = req.auth!;

    await prisma.session.updateMany({
      where: { id: sessionId, accountId },
      data: { revoked: true },
    });

    res.clearCookie("refreshToken", {
      path: "/auth/refresh",
    });

    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};