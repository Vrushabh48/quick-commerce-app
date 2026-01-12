import { Router } from "express";
import { authenticateRequest } from "../../middleware/authenticateRequest";
import { authorizeRoles } from "../../middleware/authorizeRoles";
import { addNewStore, updateStore } from "../controller/store.controller";

const router = Router();

// POST /admin/stores
router.post(
  "/admin/stores",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  addNewStore
);

// PUT /store
router.put(
  "/store",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  updateStore
);

export default router;