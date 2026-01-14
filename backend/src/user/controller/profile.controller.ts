import { Request, Response } from "express";
import { prisma } from "../../lib";


//get user profile
export const getUserProfile = async (req: Request, res: Response) => {
    const { accountId } = req.auth!;

    const user = await prisma.user.findUnique({
        where: { accountId },
        include: {
            addresses: true,
        },
    });

    if (!user) {
        return res.status(404).json({ error: "User profile not found" });
    }

    return res.json(user);
};

//update user profile
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const { accountId } = req.auth!;
    const { name, phone } = req.body;

    const user = await prisma.user.update({
        where: { accountId },
        data: {
            name,
            phone,
        },
    });

    return res.json(user);
    } catch (error) {
        return res.status(500).json({ error: "Failed to update user profile" });
    }
};

//delete user profile
export const deleteUserProfile = async (req: Request, res: Response) => {
    const { accountId } = req.auth!;

    await prisma.$transaction([
        prisma.session.updateMany({
            where: { accountId },
            data: { revoked: true },
        }),
        prisma.account.update({
            where: { id: accountId },
            data: { isActive: false },
        }),
    ]);

    return res.status(204).send();
};
