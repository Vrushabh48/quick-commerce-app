import { Request, Response } from "express";
import { prisma } from "../../lib";
import bcrypt from "bcrypt";

export const CreateStoreAccount = async (req: Request, res: Response) => {
  try {
    const accountId = req.auth!.accountId;
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const existingAccount = await prisma.account.findUnique({
      where: { email },
    });

    if (existingAccount) {
      return res.status(409).json({ error: "Account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAccount = await prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        role: "STORE",
      },
    });
    return res.status(201).json({ message: "Store account created"});
  } catch (error) {
    console.error("Create Store Account Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export const addNewStore = async (req: Request, res: Response) => {
  try {
    const accountId = req.auth!.accountId;

    const { name, address, latitude, longitude } = req.body;

    if (
      !name ||
      !address ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !accountId
    ) {
      return res.status(400).json({ error: "Invalid or missing fields" });
    }

    const store = await prisma.store.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        accountId,
      },
    });

    return res.status(201).json(store);
  } catch (error) {
    console.error("Add Store Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStore = async (req: Request, res: Response) => {
  try {
    const storeId = req.auth!.storeId;

    if (!storeId) {
      return res.status(403).json({ error: "Store context missing" });
    }

    const { name, address, latitude, longitude } = req.body;

    if (
      !name ||
      !address ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({ error: "Invalid or missing fields" });
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        name,
        address,
        latitude,
        longitude,
      },
    });

    return res.status(200).json(store);
  } catch (error) {
    console.error("Update Store Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};