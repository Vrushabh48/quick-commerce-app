import { Request, Response } from "express";
import { prisma } from "../../lib";

export const createOrder = async (req: Request, res: Response) => {
  const id = req.auth!.accountId;

    const userId = await prisma.user.findUnique({
      where: { accountId: id },
      select: { id: true },
    }).then(user => user!.id);

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Resolve user
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // 2. Fetch cart with items
      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart empty");
      }

      // 3. Validate inventory & product state
      for (const item of cart.items) {
        if (!item.product.isActive) {
          throw new Error("Product unavailable");
        }

        const inventory = await tx.inventory.findUnique({
          where: {
            productId_storeId: {
              productId: item.productId,
              storeId: cart.storeId,
            },
          },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new Error("Insufficient stock");
        }
      }

      const deliveryAddressId = req.body.deliveryAddressId;

      // 4. Create order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          deliveryAddressId:deliveryAddressId, 
          storeId: cart.storeId,
          totalAmount: cart.total,
          status: "CREATED",
        },
      });

      return order;
    });

    return res.status(201).json(order);
  } catch (err: any) {
    console.error("Checkout Error:", err);

    if (err.message === "Cart empty") {
      return res.status(400).json({ error: "Cart is empty" });
    }

    return res.status(409).json({ error: err.message });
  }
};

const orderPayment = async (req: Request, res: Response) => {
  // To be implemented

  // 5. Create order items & decrement inventory
    //   for (const item of cart.items) {
    //     await tx.orderItem.create({
    //       data: {
    //         orderId: order.id,
    //         productId: item.productId,
    //         quantity: item.quantity,
    //         priceAtPurchase: item.unitPrice,
    //       },
    //     });

    //     const updated = await tx.inventory.update({
    //       where: {
    //         productId_storeId: {
    //           productId: item.productId,
    //           storeId: cart.storeId,
    //         },
    //       },
    //       data: {
    //         quantity: { decrement: item.quantity },
    //       },
    //     });

    //     if (!updated) {
    //       throw new Error("Inventory update failed");
    //     }
    //   }

    //   // 6. Clear cart
    //   await tx.cartItem.deleteMany({
    //     where: { cartId: cart.id },
    //   });

    //   await tx.cart.update({
    //     where: { id: cart.id },
    //     data: { total: 0 },
    //   });
}