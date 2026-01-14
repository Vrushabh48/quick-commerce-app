import "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        accountId: number;
        role: "USER" | "STORE" | "ADMIN" | "RIDER";
        sessionId: string;
        userId?: number;
        storeId?: number;
        partnerId?: number;
      };
    }
  }
}
