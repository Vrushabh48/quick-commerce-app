import { Router } from "express";

import { authenticateRequest } from "../../middleware/authenticateRequest";
import { authorizeRoles } from "../../middleware/authorizeRoles";
import { createOrder } from "../controller/order.controller";

const router = Router();

router.post('/create/order',
  authenticateRequest,
  authorizeRoles(['USER']),
  createOrder
);

export default router;