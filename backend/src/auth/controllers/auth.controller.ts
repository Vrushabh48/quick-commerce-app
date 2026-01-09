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

    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        role: accountRole,
      },
    });

    const session = await prisma.session.create({
      data: {
        accountId: account.id,
        refreshToken: "",
        expiresAt: new Date(
          Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000
        ),
      },
    });

    const refreshToken = signRefreshToken({
      accountId: account.id,
      sessionId: session.id,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken },
    });

    const accessToken = signAccessToken({
      accountId: account.id,
      role: account.role,
      sessionId: session.id,
    });

    return res.status(201).json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
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

    const passwordOk = await bcrypt.compare(password, account.password);
    if (!passwordOk) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const session = await prisma.session.create({
      data: {
        accountId: account.id,
        refreshToken: "",
        expiresAt: new Date(
          Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000
        ),
      },
    });

    const refreshToken = signRefreshToken({
      accountId: account.id,
      sessionId: session.id,
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken },
    });

    const accessToken = signAccessToken({
      accountId: account.id,
      role: account.role,
      sessionId: session.id,
    });

    return res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken required" });
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;
    } catch {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accountId = Number(payload.sub);
    const sessionId = payload.sessionId as string;

    if (!accountId || !sessionId) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (
      !session ||
      session.revoked ||
      session.expiresAt < new Date() ||
      session.accountId !== accountId ||
      session.refreshToken !== refreshToken
    ) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newRefreshToken = signRefreshToken({
      accountId,
      sessionId,
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken: newRefreshToken,
      },
    });

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.isActive) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({
      accountId,
      role: account.role,
      sessionId,
    });

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { sessionId, accountId } = req.auth!;

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        accountId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({ error: "Session not found" });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { revoked: true },
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};