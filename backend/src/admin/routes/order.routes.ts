import { Router } from "express";
import { getStoreOrders } from "../controller/order.controller";
import { authenticateRequest } from "../../middleware/authenticateRequest";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();

// GET /store/orders
router.get(
  "/store/orders",
  authenticateRequest,
  authorizeRoles(["STORE", "ADMIN"]),
  getStoreOrders
);
export default router;