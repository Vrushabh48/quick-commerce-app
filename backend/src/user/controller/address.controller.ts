import { Request, Response } from "express";
import { prisma } from "../../lib";

export const createUserAddress = async (req: Request, res: Response) => {
    try {
        const { accountId } = req.auth!;
        const {
            addressLine,
            city,
            state,
            pincode,
            country,
            landmark,
            instructions,
            contactPhone,
            isDefault,
        } = req.body;

        // 1️⃣ If isDefault is true, unset other default addresses    
        const newAddress = await prisma.$transaction(async (tx) => {
            if (isDefault === true) {
                await tx.userAddress.updateMany({
                    where: {
                        user: { accountId },
                        isDefault: true,
                    },
                    data: { isDefault: false },
                });
            }
            // 2️⃣ Create new address
            return tx.userAddress.create({
                data: {
                    addressLine,
                    city,
                    state,
                    pincode,
                    country,
                    landmark,
                    instructions,
                    contactPhone,
                    isDefault,
                    user: { connect: { accountId } },
                },
            });
        }
        );

        return res.status(201).json(newAddress);
    } catch (err) {
        console.error("Create address error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getUserAddresses = async (req: Request, res: Response) => {
    const { accountId } = req.auth!;

    try {
        const addresses = await prisma.userAddress.findMany({
            where: {
                user: { accountId },
            },
            orderBy: {
                isDefault: "desc",
            },
        });

        return res.json(addresses);
    } catch (error) {
        console.error("Get addresses error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUserAddress = async (req: Request, res: Response) => {
    try {
        const { accountId } = req.auth!;
        const addressId = Number(req.params.addressId);

        if (!addressId || Number.isNaN(addressId)) {
            return res.status(400).json({ error: "Invalid addressId" });
        }

        const {
            addressLine,
            city,
            state,
            pincode,
            country,
            landmark,
            instructions,
            contactPhone,
            isDefault,
        } = req.body;

        // 1️⃣ Fetch address and validate ownership
        const address = await prisma.userAddress.findFirst({
            where: {
                id: addressId,
                user: {
                    accountId,
                },
            },
        });

        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // 2️⃣ Transaction for default handling + update

        const updatedAddress = await prisma.$transaction(async (tx) => {
            if (isDefault === false && address.isDefault) {
                const otherDefault = await prisma.userAddress.findFirst({
                    where: {
                        userId: address.userId,
                        isDefault: true,
                        NOT: { id: addressId },
                    },
                });

                if (!otherDefault) {
                    return res
                        .status(400)
                        .json({ error: "At least one default address is required" });
                }
            }
            // If setting this address as default, unset others
            if (isDefault === true) {
                await tx.userAddress.updateMany({
                    where: {
                        userId: address.userId,
                        isDefault: true,
                        NOT: { id: addressId },
                    },
                    data: { isDefault: false },
                });
            }

            return tx.userAddress.update({
                where: { id: addressId },
                data: {
                    addressLine,
                    city,
                    state,
                    pincode,
                    country,
                    landmark,
                    instructions,
                    contactPhone,
                    isDefault,
                },
            });
        });

        return res.status(200).json(updatedAddress);
    } catch (err) {
        console.error("Update address error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteUserAddress = async (req: Request, res: Response) => {
    const { accountId } = req.auth!;
    const addressId = Number(req.params.addressId);

    if (!addressId || Number.isNaN(addressId)) {
        return res.status(400).json({ error: "Invalid addressId" });
    }

    try {
        // 1️⃣ Fetch address and validate ownership
        const address = await prisma.userAddress.findFirst({
            where: {
                id: addressId,
                user: {
                    accountId,
                },
            },
        });
        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // 2️⃣ Delete address
        await prisma.$transaction(async (tx) => {
            if (address.isDefault) {
                const next = await tx.userAddress.findFirst({
                    where: {
                        userId: address.userId,
                        NOT: { id: addressId },
                    },
                });

                if (next) {
                    await tx.userAddress.update({
                        where: { id: next.id },
                        data: { isDefault: true },
                    });
                }
            }

            await tx.userAddress.delete({
                where: { id: addressId },
            });
        });

        return res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        console.log("Delete address error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}