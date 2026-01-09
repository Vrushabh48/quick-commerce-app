import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";


export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.auth = {
      accountId: Number(payload.sub),
      sessionId: payload.sessionId as string,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid access token" });
  }
};
