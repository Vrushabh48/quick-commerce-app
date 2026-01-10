import { Request, Response } from "express";
import { prisma } from "../../lib";

const addNewStore = async (req: Request, res: Response) => {
    try {
        const accountId = Number(req.auth!.accountId);
        const { name, address, latitude, longitude } = req.body;

        if(!name || !address || !latitude || !longitude) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newStore = await prisma.store.create({
            data: {
                name,
                address,
                latitude,
                longitude,
                accountId: accountId,
            },
        });

        return res.status(201).json(newStore);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

const updateStore = async (req: Request, res: Response) => {
    try {
        const accountId = Number(req.auth!.accountId);
        const { name, address, latitude, longitude } = req.body;

        if(!name || !address || !latitude || !longitude) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newStore = await prisma.store.create({
            data: {
                name,
                address,
                latitude,
                longitude,
                accountId: accountId,
            },
        });

        return res.status(201).json(newStore);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}