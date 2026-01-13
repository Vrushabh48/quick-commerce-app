import { Router } from "express";
import {
  updateActiveStatus,
  completeDelivery,
  getAssignedDelivery,
  getAvailableOrders,
} from "../controller/rider.controller";
import { authenticateRequest } from "../../middleware/authenticateRequest";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();

// PATCH /rider/status
router.patch(
  "/rider/status",
  authenticateRequest,
  authorizeRoles(["RIDER"]),
  updateActiveStatus
);


// POST /rider/deliveries/:assignmentId/complete
router.post(
  "/rider/deliveries/:assignmentId/complete",
  authenticateRequest,
  authorizeRoles(["RIDER"]),
  completeDelivery
);


router.patch(
  "/admin/riders/:riderId/status",
  authenticateRequest,
  authorizeRoles(["ADMIN"]),
  updateActiveStatus
);

router.get(
  "/orders/assigned",
  authenticateRequest,
  authorizeRoles(["RIDER"]),
  getAssignedDelivery
);

router.get(
  "/order/available",
  authenticateRequest,
  authorizeRoles(["ADMIN", "RIDER"]),
  getAvailableOrders
);

router.post(
  "/order/accept/:orderId",
  authenticateRequest,
  authorizeRoles(["ADMIN", "RIDER"]),
  getAvailableOrders
);
export default router;