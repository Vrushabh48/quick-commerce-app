import { Router } from "express";
import { authenticateRequest } from "../../middleware/authenticateRequest";
import { authorizeRoles } from "../../middleware/authorizeRoles";
import { addNewProduct, deliveryPartnerDetails, deliverypartners, inventoryDetails, storeInventoryDetails } from "../controller/product.controller";


const router = Router();

// POST /products
router.post(
  "/products",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  addNewProduct
);

// GET /admin/delivery-partners
router.get(
  "/admin/delivery-partners",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  deliverypartners
);

// GET /admin/delivery-partners/:partnerId
router.get(
  "/admin/delivery-partners/:partnerId",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  deliveryPartnerDetails
);

// GET /admin/inventory
router.get(
  "/admin/inventory",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  inventoryDetails
);


// GET /store/inventory
router.get(
  "/store/inventory",
  authenticateRequest,
  authorizeRoles(["STORE"]),
  storeInventoryDetails
);

// GET /admin/stores/:storeId/inventory
router.get(
  "/admin/stores/:storeId/inventory",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  storeInventoryDetails
);

export default router;