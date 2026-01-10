import { Router } from "express";
import {
  viewCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controller/cart.controller";
import { authenticateRequest } from "../../middleware/authenticateRequest";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();

router.get(
  "/cart",
  authenticateRequest,
  authorizeRoles(["USER"]),
  viewCart
);

router.post(
  "/cart/item",
  authenticateRequest,
  authorizeRoles(["USER"]),
  addItemToCart
);

router.put(
  "/cart/item/:itemId",
  authenticateRequest,
  authorizeRoles(["USER"]),
  updateCartItem
);


router.delete(
  "/cart/item/:itemId",
  authenticateRequest,
  authorizeRoles(["USER"]),
  removeCartItem
);

router.delete(
  "/cart",
  authenticateRequest,
  authorizeRoles(["USER"]),
  clearCart
);

export default router;
