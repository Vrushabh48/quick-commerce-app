import { Request, Response } from "express";
import { prisma } from "../../lib";

export const addNewProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, price, categoryId } = req.body;

        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price,
                categoryId,
            },
        });

        return res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const deliverypartners = async (req: Request, res: Response) => {
    try {
        const partners = await prisma.deliveryPartner.findMany();
        return res.status(200).json(partners);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" }); 
    }
}

export const deliveryPartnerDetails = async (req: Request, res: Response) => {
    try {
        const partnerId = Number(req.params.partnerId);
        const partner = await prisma.deliveryPartner.findUnique({
            where: { id: partnerId },
            include: {
                assignments: true,
            },
        });
        if (!partner) {
            return res.status(404).json({ error: "Delivery partner not found" });
        }
        return res.status(200).json(partner);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" }); 
    }
}

export const inventoryDetails = async (req: Request, res: Response) => {    
    try {
        const inventory = await prisma.inventory.findMany({
            include:{
                product: true,
                store: true,
            }
        });
        
        return res.status(200).json(inventory);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const storeInventoryDetails = async (req: Request, res: Response) => {    
    try {
        const storeId = Number(req.params.storeId);
        const inventory = await prisma.inventory.findMany({
            where: {
                storeId: storeId,
            },
            include:{
                product: true,
                store: true,
            }
        });
        
        return res.status(200).json(inventory);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}