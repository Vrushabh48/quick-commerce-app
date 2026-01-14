import { Router, Request, Response, NextFunction } from "express";
import { authorizeRoles } from "../../middleware/authorizeRoles";

import { authenticateRequest } from "../../middleware/authenticateRequest";
import { getProducts, searchProductsByName } from "../controller/product.controller";

const router = Router();

router.get(`/products`, authenticateRequest, authorizeRoles(["USER"]), getProducts);
router.get(
    "/products/search",
    authenticateRequest,
    authorizeRoles(["USER"]),
    searchProductsByName
);

export default router;