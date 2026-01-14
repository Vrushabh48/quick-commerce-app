import { prisma } from "../../lib";
import { Request, Response } from "express";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNumber = Number.isInteger(Number(page)) && Number(page) > 0
      ? Number(page)
      : 1;

    const pageSize = Number.isInteger(Number(limit)) && Number(limit) > 0
      ? Math.min(Number(limit), 50)
      : 20;


    const where: any = {
      isActive: true,
    };

    if (categoryId) {
      const id = Number(categoryId);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid categoryId" });
      }
      where.categoryId = id;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        const min = Number(minPrice);
        if (Number.isNaN(min)) {
          return res.status(400).json({ error: "Invalid minPrice" });
        }
        where.price.gte = min;
      }

      if (maxPrice) {
        const max = Number(maxPrice);
        if (Number.isNaN(max)) {
          return res.status(400).json({ error: "Invalid maxPrice" });
        }
        where.price.gte = max;
      }

    }

    if (inStock === "true") {
      where.inventory = {
        some: {
          quantity: { gt: 0 },
        },
      };
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      data: products,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("Get products error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const searchProductsByName = async (req: Request, res: Response) => {
  try {
    const {
      q,
      page = "1",
      limit = "20",
      inStock,
    } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters",
      });
    }

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Number(limit), 50);
    const searchTerm = q.trim();

    const where: any = {
      isActive: true,
      name: {
        contains: searchTerm,
        mode: "insensitive",
      },
    };

    if (inStock === "true") {
      where.inventory = {
        some: {
          quantity: { gt: 0 },
        },
      };
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      data: products,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("Search products error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};