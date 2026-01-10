import { Request, Response } from "express";
import { prisma } from "../../lib";


export async function acceptDelivery(orderId: number, riderId: number) {
  return prisma.$transaction(async (tx) => {
    // 1. Check if assignment already exists (LOCK POINT)
    const existingAssignment = await tx.deliveryAssignment.findUnique({
      where: { orderId },
    });

    if (existingAssignment) {
      throw new Error("Order already assigned");
    }

    // 2. Ensure rider is available
    const rider = await tx.deliveryPartner.findUnique({
      where: { id: riderId },
    });

    if (!rider || !rider.isAvailable) {
      throw new Error("Rider not available");
    }

    // 3. Create assignment (ONLY ONE WILL SUCCEED)
    const assignment = await tx.deliveryAssignment.create({
      data: {
        orderId,
        partnerId: riderId,
        status: "ASSIGNED",
      },
    });

    // 4. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "OUT_FOR_DELIVERY",
      },
    });

    // 5. Mark rider unavailable
    await tx.deliveryPartner.update({
      where: { id: riderId },
      data: {
        isAvailable: false,
      },
    });

    return assignment;
  });
}

export const updateActiveStatus = async (req: Request, res: Response) => {
  try {
    const riderId = Number(req.params.riderId);
    const { isActive } = req.body;
    return prisma.deliveryPartner.update({
    where: { id: riderId },
    data: { isActive },
  });
  } catch (error) {
    console.error(error);  
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const completeDelivery = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await prisma.deliveryAssignment.update({
      where: { id: Number(assignmentId) },
      data: { status: "DELIVERED" },
    }); 

    const order = await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: "DELIVERED" },
    });

    return res.status(200).json(order);
  }     catch (error) {
    console.error(error);  
    return res.status(500).json({ error: "Internal server error" });
  }
}