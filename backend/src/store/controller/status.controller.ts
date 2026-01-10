import { Request, Response } from "express";
import { prisma } from "../../lib";

const updateStoreStatus = async (req: Request, res: Response) => {
  try {
    const storeId = Number(req.params.storeId);
    const isActive = req.body.isActive;

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        isActive: !isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}