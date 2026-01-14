import { Request, Response } from "express";
import { prisma } from "../../lib";
import { assignRider } from "../../delivery/service/dispatch.service";

export const incomingOrders = async (req: Request, res: Response) => {
    try {
        const incomingOrders = await prisma.order.findMany({
            where: {
                status: "PAID",
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json(incomingOrders);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    } 
}

export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PREPARING" },
    });

    // Fire-and-forget rider assignment
    assignRider(order.id).catch((err) => {
      console.error("Rider assignment failed:", err);
    });

    return res.status(200).json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const readyForPickup = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params; 
        const order = await prisma.order.update({
            where: {
                id: Number(orderId),
            },
            data: {
                status: "READY_FOR_PICKUP",
            },
        });
    return res.status(200).json(order);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
        