import { Router } from "express";
import {
  getUserAddresses,
  updateUserAddress,
  deleteUserAddress,
} from "../controller/address.controller";
import { authenticateRequest } from "../../middleware/authenticateRequest";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();


// GET /addresses
router.get(
  "/addresses",
  authenticateRequest,
  authorizeRoles(["USER"]),
  getUserAddresses
);

// PUT /addresses/:addressId
router.put(
  "/addresses/:addressId",
  authenticateRequest,
  authorizeRoles(["USER"]),
  updateUserAddress
);


// DELETE /addresses/:addressId
router.delete(
  "/addresses/:addressId",
  authenticateRequest,
  authorizeRoles(["USER"]),
  deleteUserAddress
);

export default router;