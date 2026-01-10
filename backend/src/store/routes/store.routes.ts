import { Router } from "express";
import {
  getProductInventory,
  getInventoryDetails,
  updateInventoryQuantity,
} from "../controller/inventory.controller";
import { authenticateRequest } from "../../middleware/authenticateRequest";
import { authorizeRoles } from "../../middleware/authorizeRoles";
import { acceptOrder, incomingOrders, readyForPickup } from "../controller/order.controller";
import { getStoreStatus, updateStoreStatus } from "../controller/status.controller";

const router = Router();

// GET /inventory/product/:productId
router.get(
  "/inventory/product/:productId",
  authenticateRequest,
  authorizeRoles(["USER", "STORE", "ADMIN"]),
  getProductInventory
);


// GET /inventory?limit=20&cursor=10
router.get(
  "/inventory",
  authenticateRequest,
  authorizeRoles(["STORE", "ADMIN"]),
  getInventoryDetails
);


// PUT /inventory/:inventoryId
router.put(
  "/inventory/:inventoryId",
  authenticateRequest,
  authorizeRoles(["STORE", "ADMIN"]),
  updateInventoryQuantity
);

// GET /store/orders/incoming
router.get(
  "/orders/incoming",
  authenticateRequest,
  authorizeRoles(["STORE", "ADMIN"]),
  incomingOrders
);

// POST /store/orders/:orderId/accept
router.post(
  "/orders/:orderId/accept",
  authenticateRequest,
  authorizeRoles(["STORE", "ADMIN"]),
  acceptOrder
);


// POST /store/orders/:orderId/ready
router.post(
  "/orders/:orderId/ready",
  authenticateRequest,
  authorizeRoles(["STORE", "ADMIN"]),
  readyForPickup
);

// PATCH /stores/:storeId/status
router.patch(
  "/:storeId/status",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  updateStoreStatus
);

router.get("/status/:storeId", authenticateRequest, authorizeRoles(["STORE", "ADMIN", "RIDER", "USER"]), getStoreStatus);

export default router;