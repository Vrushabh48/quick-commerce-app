import { Request, Response, NextFunction } from "express";

type Role = "USER" | "STORE" | "ADMIN" | "RIDER";

export function authorizeRoles(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required"
      });
    }

    const { role } = req.auth;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource"
      });
    }

    next();
  };
}
