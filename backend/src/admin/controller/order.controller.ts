import { Request, Response } from "express";
import { prisma } from "../../lib";


export const getStoreOrders = async (req: Request, res: Response) => {
  try {
    const accountId = req.auth!.accountId;
    const storeId = req.body.storeId;
    if (!accountId || !storeId) {
      return res.status(403).json({ error: "Store context missing" });
    }

    const orders = await prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            priceAtPurchase: true,
          },
        },
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get Store Orders Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};