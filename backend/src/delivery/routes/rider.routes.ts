import { Router } from "express";
import {
  updateActiveStatus,
  completeDelivery,
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
export default router;