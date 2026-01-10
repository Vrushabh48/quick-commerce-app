import { prisma } from "../../lib";
import { Request, Response } from "express";


async function recalculateCartTotal(cartId: number) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    select: {
      quantity: true,
      unitPrice: true,
    },
  });

  const total = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0
  );

  return prisma.cart.update({
    where: { id: cartId },
    data: { total },
  });
}

export const viewCart = async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId!;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return res.status(200).json({
        items: [],
        total: 0,
      });
    }

    return res.status(200).json(cart);
  } catch (err) {
    console.error("View Cart Error:", err);
    return res.status(500).json({ error: "Failed to fetch cart" });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId!;

    const itemId = Number(req.params.itemId);
    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const item = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      include: {
        cart: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    const updatedCart = await recalculateCartTotal(item.cartId);

    return res.status(200).json(updatedCart);
  } catch (err) {
    console.error("Update Cart Item Error:", err);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
};


export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId!;
    const itemId = Number(req.params.itemId);

    const item = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    const updatedCart = await recalculateCartTotal(item.cartId);

    return res.status(200).json(updatedCart);
  } catch (err) {
    console.error("Remove Cart Item Error:", err);
    return res.status(500).json({ error: "Failed to remove cart item" });
  }
};


export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId!;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(200).json({ message: "Cart already empty" });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: { total: 0 },
    });

    return res.status(200).json(updatedCart);
  } catch (err) {
    console.error("Clear Cart Error:", err);
    return res.status(500).json({ error: "Failed to clear cart" });
  }
};

export const addItemToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId!;

    const { productId, quantity, storeId } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product unavailable" });
    }

    const inventory = await prisma.inventory.findFirst({
      where: { productId, storeId },
    });

    if (!inventory || inventory.quantity < quantity) {
      return res.status(409).json({ error: "Insufficient stock" });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    // Create cart if missing
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          storeId: storeId,
          total: 0,
        },
      });
    }

    if (cart.storeId !== inventory.storeId) {
      return res.status(409).json({
        error: "Cart contains items from another store",
      });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (inventory.quantity < newQuantity) {
      return res.status(409).json({ error: "Stock exceeded" });
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          unitPrice: product.price,
        },
      });
    }

    const updatedCart = await recalculateCartTotal(cart.id);

    return res.status(200).json(updatedCart);
  } catch (err) {
    console.error("Add Item Error:", err);
    return res.status(500).json({ error: "Failed to add item to cart" });
  }
};