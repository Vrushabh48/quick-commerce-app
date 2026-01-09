import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET is not defined");
}

type Role = "USER" | "STORE" | "ADMIN" | "RIDER";

interface AccessTokenPayload extends JwtPayload {
  sub: string;        // accountId (STRING in JWT, parsed to number)
  sessionId: string;
  role: Role;
}

export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid Authorization header"
      });
    }

    const token = authHeader.split(" ")[1];

    let payload: AccessTokenPayload;

    try {
      payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    } catch {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired access token"
      });
    }

    const { sub, sessionId, role } = payload;

    if (!sub || !sessionId || !role) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Malformed access token"
      });
    }

    const accountId = Number(sub);

    if (Number.isNaN(accountId)) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token subject"
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (
      !session ||
      session.revoked ||
      session.expiresAt < new Date() ||
      session.accountId !== accountId
    ) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Session invalid or expired"
      });
    }

    // Attach authenticated context
    req.auth = {
      accountId,
      role,
      sessionId
    };

    next();
  } catch {
    return res.status(500).json({
      error: "InternalServerError",
      message: "Authentication middleware failure"
    });
  }
}
