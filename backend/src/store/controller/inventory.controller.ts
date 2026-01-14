import { Request, Response } from "express";
import { prisma } from "../../lib";

export const createInventoryRecord = async (req: Request, res: Response) => {
  try {
    const storeId = req.auth!.storeId;

    if (!storeId) {
      return res.status(403).json({ error: "Store not found" });
    }

    const { productId, quantity } = req.body;
    if (!Number.isInteger(productId) || !Number.isInteger(storeId) || !Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: "Invalid input data" });
    }
    const newInventory = await prisma.inventory.create({
      data: {
        productId,
        storeId,
        quantity,
      },
    });
    return res.status(201).json(newInventory);
  } catch (err: any) {
    console.error("Create Inventory Error:", err);
    return res.status(500).json({ error: "Failed to create inventory record" });
  }
}

export const getProductInventory = async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId)) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    const inventory = await prisma.inventory.findMany({
      where: { productId },
      select: {
        id: true,
        storeId: true,
        quantity: true,
      },
    });

    return res.status(200).json(inventory);
  } catch (err: any) {
    console.error("Get Product Inventory Error:", err);
    return res.status(400).json({ error: err.message });
  }
};


export const getInventoryDetails = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;

    const inventory = await prisma.inventory.findMany({
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { id: "asc" },
      select: {
        id: true,
        productId: true,
        storeId: true,
        quantity: true,
      },
    });

    const nextCursor =
      inventory.length === limit
        ? inventory[inventory.length - 1].id
        : null;

    return res.status(200).json({
      data: inventory,
      nextCursor,
    });
  } catch (err) {
    console.error("Get Inventory Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const updateInventoryQuantity = async (req: Request, res: Response) => {
  try {
    const inventoryId = Number(req.params.inventoryId);
    if (!Number.isInteger(inventoryId)) {
      return res.status(400).json({ error: "Invalid Inventory" });
    }

    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res
        .status(400)
        .json({ error: "Quantity must be a non-negative integer" });
    }

    const updatedInventory = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventory.findUnique({
        where: { id: inventoryId },
      });

      if (!existing) {
        throw new Error("Inventory not found");
      }

      return tx.inventory.update({
        where: { id: inventoryId },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });

    });

    return res.status(200).json({
      id: updatedInventory.id,
      productId: updatedInventory.productId,
      storeId: updatedInventory.storeId,
      quantity: updatedInventory.quantity,
    });
  } catch (err: any) {
    console.error("Update Inventory Error:", err);

    if (err.message === "Inventory not found") {
      return res.status(404).json({ error: err.message });
    }

    return res.status(500).json({ error: "Failed to update inventory" });
  }
};