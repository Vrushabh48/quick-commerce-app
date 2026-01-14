import { Request, Response } from "express";
import { prisma } from "../../lib";

export const getAssignedDelivery = async (req: Request, res: Response) => {
  try {
    const riderId = req.auth!.partnerId!;
    const assignment = await prisma.deliveryAssignment.findFirst({
      where: {
        partnerId: riderId,
        status: "ASSIGNED",
      },  
      include: {
        order: {
          include: {
            user: {
              select: {
                accountId: true,
              },
            },
            deliveryAddress: true,  
          },
        },
      },
    });
    if (!assignment) {
      return res.status(404).json({ error: "No assigned delivery found" });
    }
    return res.status(200).json(assignment);
  } catch (error) {
    console.error("Get Assigned Delivery Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAvailableOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({  
      where: { status: "READY_FOR_PICKUP" },
      include: {
        user: { 
          select: { accountId: true },
        },
        deliveryAddress: true,  
      },
    });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get Available Orders Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

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
    const riderId = req.auth!.partnerId!;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be boolean" });
    }

    const rider = await prisma.deliveryPartner.update({
      where: { id: riderId },
      data: { isActive },
    });

    return res.status(200).json(rider);
  } catch (error) {
    console.error("Update Rider Status Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const completeDelivery = async (req: Request, res: Response) => {
  try {
    const assignmentId = Number(req.params.assignmentId);
    const riderId = req.auth!.partnerId!;

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment || assignment.partnerId !== riderId) {
        throw new Error("Unauthorized delivery completion");
      }

      if (assignment.status !== "ASSIGNED") {
        throw new Error("Delivery not active");
      }

      await tx.deliveryAssignment.update({
        where: { id: assignmentId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: assignment.orderId },
        data: { status: "DELIVERED" },
      });

      await tx.deliveryPartner.update({
        where: { id: riderId },
        data: { isAvailable: true },
      });

      return assignment;
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Complete Delivery Error:", error);
    return res.status(400).json({ error: error.message });
  }
};
