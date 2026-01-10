import { Request, Response } from "express";
import { prisma } from "../../lib";


export const getStoreOrders = async (req: Request, res: Response) => {
    try {
        const storeId = Number(req.params.storeId);
        const orders = await prisma.order.findMany({
            where: {
                storeId: storeId,
            },
            include: {
                items: true,
                store: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }); 
        return res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}