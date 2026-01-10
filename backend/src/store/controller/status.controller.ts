import { Request, Response } from "express";
import { prisma } from "../../lib";

export const updateStoreStatus = async (req: Request, res: Response) => {
  try {
    const storeId = Number(req.params.storeId);

    if (!Number.isInteger(storeId)) {
      return res.status(400).json({ error: "Invalid storeId" });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be boolean" });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return res.status(200).json(updatedStore);
  } catch (error) {
    console.error("Update Store Status Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getStoreStatus = async (req: Request, res: Response) => {
  try {
    const storeId = Number(req.params.storeId);
    if (!Number.isInteger(storeId)) {
      return res.status(400).json({ error: "Invalid storeId" });
    }
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { 
        id: true,
        name: true,
        isActive: true,
      },
    });
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    } 
    return res.status(200).json(store);
  } catch (error) {
    console.error("Get Store Status Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};