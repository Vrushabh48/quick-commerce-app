import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib";
import { JWT_SECRET } from "../config/env";

type Role = "USER" | "STORE" | "ADMIN" | "RIDER";

interface AccessTokenPayload extends JwtPayload {
  sub: string;        // accountId
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
        message: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    let payload: AccessTokenPayload;

    try {
      payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    } catch {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired access token",
      });
    }

    const { sub, sessionId, role } = payload;

    if (!sub || !sessionId || !role) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Malformed access token",
      });
    }

    const accountId = Number(sub);
    if (!Number.isInteger(accountId)) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token subject",
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (
      !session ||
      session.revoked ||
      session.expiresAt < new Date() ||
      session.accountId !== accountId
    ) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Session invalid or expired",
      });
    }

    // ---- ROLE-BASED ENTITY RESOLUTION ----
    let userId: number | undefined;
    let storeId: number | undefined;
    let partnerId: number | undefined;

    if (role === "USER") {
      const user = await prisma.user.findUnique({
        where: { accountId },
        select: { id: true },
      });

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "User account not found",
        });
      }

      userId = user.id;
    }

    if (role === "STORE") {
      const store = await prisma.store.findUnique({
        where: { accountId },
        select: { id: true },
      });

      if (!store) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Store account not found",
        });
      }

      storeId = store.id;
    }

    if (role === "RIDER") {
      const rider = await prisma.deliveryPartner.findUnique({
        where: { accountId },
        select: { id: true },
      });

      if (!rider) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Rider account not found",
        });
      }

      partnerId = rider.id;
    }

    // Attach auth context
    req.auth = {
      accountId,
      role,
      sessionId,
      userId,
      storeId,
      partnerId,
    };

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(500).json({
      error: "InternalServerError",
      message: "Authentication middleware failure",
    });
  }
}
